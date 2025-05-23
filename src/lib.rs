mod dart_api;
mod dart_runtime;
mod js_resolver;
mod js_runtime;
mod utils;

include!(concat!(env!("OUT_DIR"), "/version.rs"));

use deno_runtime::deno_core::{self};

use std::{
    cell::RefCell,
    ffi::{c_char, c_void, CStr, CString},
    fs,
    path::PathBuf,
    rc::Rc,
};

thread_local! {
    static JS_RUNTIME: RefCell<Option<Rc<RefCell<deno_core::JsRuntime>>>> = RefCell::new(None);
}

fn get_runtime_instance() -> Rc<RefCell<deno_core::JsRuntime>> {
    JS_RUNTIME.with(|runtime| {
        runtime
            .borrow()
            .as_ref()
            .expect("Error: JS Runtime has not been initialized! Call `init_runtime()` first.")
            .clone()
    })
}

#[no_mangle]
pub unsafe extern "C" fn init_runtime(
    dart_api: *mut c_void,
    dart_port: dart_api::Dart_Port,
    error: *mut *const c_char,
) -> u8 {
    if !error.is_null() {
        *error = std::ptr::null();
    }

    let result = dart_api::Dart_InitializeApiDL(dart_api);
    if result != 0 {
        set_error(error, "Failed to initialize Dart DL C API: Version mismatch. Ensure that include/ matches Dart SDK version.");
        return 1;
    }

    let runtime = js_runtime::get_runtime(dart_port);

    JS_RUNTIME.with(|js_runtime| {
        *js_runtime.borrow_mut() = Some(Rc::new(RefCell::new(runtime)));
    });

    0
}

#[no_mangle]
pub unsafe extern "C" fn register_module(
    module_name: *const c_char,
    module_source: *const c_char,
    error: *mut *const c_char,
    //
    args: *const *const c_void, // Arguments pointer
    arg_type_ids: *const i32,   // Argument type IDs
    arg_sizes: *const isize,    // Argument sizes (for List<String>, Uint8List)
    args_count: i32,            // Number of arguments
) -> u8 {
    if !error.is_null() {
        *error = std::ptr::null();
    }

    let module_init_args = js_runtime::JsFunctionArgs {
        args,
        sizes: arg_sizes,
        count: args_count,
        type_ids: arg_type_ids,
    };

    let module_name_str = match check_and_get_cstr(module_name) {
        Ok(name) => name,
        Err(e) => {
            set_error(error, e);
            return 1;
        }
    };

    let source_code = match check_and_get_cstr(module_source) {
        Ok(cstr) => {
            let path = PathBuf::from(cstr);
            if path.is_file() {
                match fs::read_to_string(&path) {
                    Ok(code) => (path.to_str().unwrap().to_string(), code),
                    Err(e) => {
                        set_error(error, &format!("Failed to read JS module from file: {}", e));
                        return 1;
                    }
                }
            } else {
                (module_name_str.to_string() + ".js", cstr.to_string())
            }
        }
        Err(e) => {
            set_error(error, e);
            return 1;
        }
    };

    let runtime_ref = get_runtime_instance();
    let mut javascript_runtime = runtime_ref.borrow_mut();

    let module_object = {
        let result = javascript_runtime
            .lazy_load_es_module_with_code(format!("file://{}", source_code.0), source_code.1);
        if let Err(e) = result {
            set_error(
                error,
                &format!("Error loading module: {}, {}", module_name_str, e),
            );
            return 1;
        }

        result.unwrap()
    };

    let mut handle_scope = javascript_runtime.handle_scope();
    let scope = &mut handle_scope;

    let local = v8::Local::new(scope, module_object);
    let obj = local.to_object(scope).unwrap();
    let key = v8::String::new(scope, "default").unwrap();

    // Check if the module exports a default function
    let value = obj.get(scope, key.into()).unwrap();
    if !value.is_object() {
        set_error(error, "Module does not export a default function");
        return 1;
    }

    let module_name = v8::String::new(scope, module_name_str).unwrap();
    let default_object = value.to_object(scope).unwrap();

    let init_key = v8::String::new(scope, "init").unwrap();
    let init_fnc_value = default_object.get(scope, init_key.into()).unwrap();
    let init_function = v8::Local::<v8::Function>::try_from(init_fnc_value).unwrap();

    let functions_key = v8::String::new(scope, "functions").unwrap();
    let functions_value = default_object.get(scope, functions_key.into()).unwrap();
    let functions_object = v8::Local::<v8::Object>::try_from(functions_value).unwrap();

    js_runtime::register_js_module(
        scope,
        module_name,
        init_function,
        functions_object,
        module_init_args,
    )
}

#[no_mangle]
pub unsafe extern "C" fn get_runtime_version() -> *const c_char {
    CString::new(VERSION).unwrap().into_raw()
}

#[no_mangle]
pub unsafe extern "C" fn is_module_registered(module_name: *const c_char) -> u8 {
    let module_str = unsafe { CStr::from_ptr(module_name).to_str().unwrap() };
    let runtime_ref = get_runtime_instance();

    utils::tokio_runtime().block_on(async move {
        let local_set = tokio::task::LocalSet::new();

        local_set
            .run_until(async move {
                let mut javascript_runtime = runtime_ref.borrow_mut();
                let scope = &mut javascript_runtime.handle_scope();
                let js_module = js_runtime::get_js_module(scope, module_str);

                match js_module {
                    Ok(_) => 0,
                    Err(_) => 1,
                }
            })
            .await
    })
}

#[no_mangle]
pub unsafe extern "C" fn call_js_function(
    module_name: *const c_char,   // Module name
    function_name: *const c_char, // Function name
    message_identifier: i32,      // Message identifier
    args: *const *const c_void,   // Arguments pointer
    arg_type_ids: *const i32,     // Argument type IDs
    arg_sizes: *const isize,      // Argument sizes (for List<String>, Uint8List)
    args_count: i32,              // Number of arguments
    error: *mut *const c_char,    // Error message
) -> u8 {
    let module_str = unsafe { CStr::from_ptr(module_name).to_str().unwrap() };
    let function_str = unsafe { CStr::from_ptr(function_name).to_str().unwrap() };

    let runtime_ref = get_runtime_instance();

    let result = utils::tokio_runtime().block_on(async move {
        let local_set = tokio::task::LocalSet::new();

        local_set
            .run_until(async move {
                let mut javascript_runtime = runtime_ref.borrow_mut();
                let fnc_call = {
                    // Retrieve function & module state from the module
                    let (js_function, module_state) = {
                        let scope = &mut javascript_runtime.handle_scope();
                        js_runtime::get_js_function(scope, module_str, function_str)?
                    };

                    // Prepare arguments
                    let v8_args = {
                        let scope = &mut javascript_runtime.handle_scope();
                        let mut args = js_runtime::c_args_to_v8_args_global(
                            scope,
                            args,
                            arg_type_ids,
                            arg_sizes,
                            args_count,
                        );

                        // Insert module state as first argument
                        args.insert(0, module_state);

                        let msg_id_value: v8::Local<v8::Value> =
                            v8::Integer::new(scope, message_identifier).into();

                        // Insert message identifier as last argument
                        args.push(v8::Global::new(scope, msg_id_value));
                        args
                    };

                    javascript_runtime.call_with_args(&js_function, &v8_args)
                };

                // Wait for module execution
                if let Err(e) = javascript_runtime.run_event_loop(Default::default()).await {
                    return Err(e.to_string());
                }

                if let Err(e) = fnc_call.await {
                    return Err(e.to_string());
                }

                Ok(())
            })
            .await
    });

    if let Err(e) = result {
        *error = CString::new(e).unwrap().into_raw();
        return 1;
    }

    0
}

#[no_mangle]
pub unsafe extern "C" fn dispose_runtime() -> u8 {
    JS_RUNTIME.with(|runtime| {
        *runtime.borrow_mut() = None;
    });

    0
}

// Helper function to set error messages
unsafe fn set_error(error: *mut *const c_char, msg: &str) {
    if !error.is_null() {
        *error = CString::new(msg).unwrap().into_raw();
    }
}

// Helper to safely convert a *const c_char into a Rust &str
unsafe fn check_and_get_cstr(ptr: *const c_char) -> Result<&'static str, &'static str> {
    if ptr.is_null() {
        return Err("Received null pointer");
    }

    match CStr::from_ptr(ptr).to_str() {
        Ok(val) => Ok(val),
        Err(_) => Err("Invalid UTF-8 in pointer string"),
    }
}
