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

static mut JS_RUNTIME: Option<Rc<RefCell<deno_core::JsRuntime>>> = None;

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
        *error = CString::new("Failed to initialize Dart DL C API: Version mismatch. Ensure that include/ matches Dart SDK version.").unwrap().into_raw();
        return 1;
    }

    let runtime = js_runtime::get_runtime(dart_port);

    unsafe {
        if JS_RUNTIME.is_none() {
            JS_RUNTIME = Some(Rc::new(RefCell::new(runtime)));
        }
    }

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

    let module_name = unsafe { CStr::from_ptr(module).to_str().unwrap() };
    let working_dir_name = unsafe { CStr::from_ptr(working_dir).to_str().unwrap() };

    // Resolve the JS module path
    let main_module = match deno_core::resolve_path(module_name, &PathBuf::from(working_dir_name)) {
        Ok(path) => path,
        Err(e) => {
            *error = CString::new(format!("Failed to resolve module path: {}", e))
                .unwrap()
                .into_raw();
            return 1;
        }
    };

    let runtime_ref = JS_RUNTIME.as_ref().unwrap().clone();

    utils::get_runtime().block_on(async move {
        let local_set = tokio::task::LocalSet::new();

        local_set
            .run_until(async move {
                let mut javascript_runtime = runtime_ref.borrow_mut();

                let mod_id = match javascript_runtime.load_main_es_module(&main_module).await {
                    Ok(id) => id,
                    Err(e) => {
                        *error = CString::new(format!("Failed to resolve module path: {}", e))
                            .unwrap()
                            .into_raw();
                        return 1;
                    }
                };

                let result = javascript_runtime.mod_evaluate(mod_id);

                // Wait for module execution
                if let Err(e) = javascript_runtime.run_event_loop(Default::default()).await {
                    *error = CString::new(format!("Error running event loop: {}", e))
                        .unwrap()
                        .into_raw();
                    return 1;
                }

                if let Err(e) = result.await {
                    *error = CString::new(format!("Error evaluating module: {}", e))
                        .unwrap()
                        .into_raw();
                    return 1;
                }

                0
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

    if JS_RUNTIME.is_none() {
        *error = CString::new("Error: JS runtime not initialized")
            .unwrap()
            .into_raw();
        return 1;
    }

    let runtime_ref = JS_RUNTIME.as_ref().unwrap().clone();

    let result = utils::get_runtime().block_on(async move {
        let local_set = tokio::task::LocalSet::new();

        local_set
            .run_until(async move {
                let mut javascript_runtime = runtime_ref.borrow_mut();
                let fnc_call = {
                    // Retrieve the function from the module
                    let js_function = {
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
                        let msg_id_value: v8::Local<v8::Value> =
                            v8::Integer::new(scope, message_identifier).into();

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
    unsafe {
        JS_RUNTIME = None; // Drop the runtime safely
    }

    0
}
