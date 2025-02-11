mod dart_api;
mod dart_runtime;
mod js_resolver;
mod js_runtime;
mod utils;

use deno_runtime::deno_core::{self};

use std::{
    cell::RefCell,
    ffi::{c_char, c_void, CStr, CString},
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
    module: *const c_char,
    working_dir: *const c_char,
    error: *mut *const c_char,
) -> u8 {
    if !error.is_null() {
        *error = std::ptr::null();
    }

    // Convert module name
    let module_name = if module.is_null() {
        set_error(error, "Module name pointer is null");
        return 1;
    } else {
        match CStr::from_ptr(module).to_str() {
            Ok(name) => name,
            Err(_) => {
                set_error(error, "Failed to convert module name");
                return 1;
            }
        }
    };

    // Convert working directory
    let working_dir_name = if working_dir.is_null() {
        set_error(error, "Working directory pointer is null");
        return 1;
    } else {
        match CStr::from_ptr(working_dir).to_str() {
            Ok(name) => name,
            Err(_) => {
                set_error(error, "Failed to convert working directory name");
                return 1;
            }
        }
    };

    // Resolve the JS module path
    let main_module = match deno_core::resolve_path(module_name, &PathBuf::from(working_dir_name)) {
        Ok(path) => path,
        Err(e) => {
            set_error(
                error,
                format!("Failed to resolve module path: {}", e).as_str(),
            );
            return 1;
        }
    };

    let runtime_ref = get_runtime_instance();

    utils::tokio_runtime().block_on(async move {
        let local_set = tokio::task::LocalSet::new();

        local_set
            .run_until(async move {
                let mut javascript_runtime = runtime_ref.borrow_mut();

                let mod_id = match javascript_runtime.load_main_es_module(&main_module).await {
                    Ok(id) => id,
                    Err(e) => {
                        set_error(
                            error,
                            format!("Failed to load module into runtime: {}", e).as_str(),
                        );
                        return 1;
                    }
                };

                let result = javascript_runtime.mod_evaluate(mod_id);

                // Wait for module execution
                if let Err(e) = javascript_runtime.run_event_loop(Default::default()).await {
                    set_error(error, format!("Error running event loop: {}", e).as_str());
                    return 1;
                }

                if let Err(e) = result.await {
                    set_error(error, format!("Error evaluating module: {}", e).as_str());
                    return 1;
                }

                0
            })
            .await
    })
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
pub unsafe extern "C" fn call_globe_function(
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
                        let mut args = js_runtime::c_args_to_v8_args(
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
                    return Err(format!("Error running event loop: {}", e));
                }

                if let Err(e) = fnc_call.await {
                    return Err(format!("Error running function: {}", e));
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
