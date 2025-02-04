mod dart_api;
mod dart_runtime;
mod js_resolver;
mod js_runtime;
mod utils;

use deno_runtime::deno_core::{self};

use std::{
    cell::RefCell,
    ffi::{c_char, c_void, CStr, CString},
    rc::Rc,
};

static mut JS_RUNTIME: Option<Rc<RefCell<deno_core::JsRuntime>>> = None;

#[no_mangle]
pub unsafe extern "C" fn init_runtime(
    module: *const c_char,
    dart_api: *mut c_void,
    dart_port: dart_api::Dart_Port,
    error: *mut *const c_char,
) -> u8 {
    // Ensure error is initially NULL
    if !error.is_null() {
        *error = std::ptr::null();
    }

    let result = dart_api::Dart_InitializeApiDL(dart_api);
    if result != 0 {
        *error = CString::new("Failed to initialize Dart DL C API: Version mismatch. Ensure that include/ matches Dart SDK version.").unwrap().into_raw();
        return 1;
    }

    let module_name = unsafe { CStr::from_ptr(module).to_str().unwrap() };

    // Resolve the JS module path
    let main_module = match deno_core::resolve_path(module_name, &std::env::current_dir().unwrap())
    {
        Ok(path) => path,
        Err(e) => {
            *error = CString::new(format!("Failed to resolve module path: {}", e))
                .unwrap()
                .into_raw();
            return 1;
        }
    };

    // // Load and evaluate the JavaScript module
    let runtime_result = utils::get_runtime().block_on(async {
        let mut runtime = js_runtime::get_runtime(dart_port);
        let mod_id = match runtime.load_main_es_module(&main_module).await {
            Ok(id) => id,
            Err(e) => {
                return Err(format!("Error loading JS module: {}", e));
            }
        };

        let result = runtime.mod_evaluate(mod_id);

        // Wait for module execution
        if let Err(e) = runtime.run_event_loop(Default::default()).await {
            return Err(format!("Error running event loop: {}", e));
        }

        if let Err(e) = result.await {
            return Err(format!("Error evaluating module: {}", e));
        }

        Ok(runtime)
    });

    if let Err(e) = runtime_result {
        *error = CString::new(e).unwrap().into_raw();
        return 1;
    }

    unsafe {
        if JS_RUNTIME.is_none() {
            JS_RUNTIME = Some(Rc::new(RefCell::new(runtime_result.unwrap())));
        }
    }

    0
}

#[no_mangle]
pub unsafe extern "C" fn call_globe_function(
    function_name: *const c_char, // Function name
    message_identifier: i32,      // Message identifier
    args: *const *const c_void,   // Arguments pointer
    arg_type_ids: *const i32,     // Argument type IDs
    arg_sizes: *const isize,      // Argument sizes (for List<String>, Uint8List)
    args_count: i32,              // Number of arguments
) -> u8 {
    let function_str = unsafe { CStr::from_ptr(function_name).to_str().unwrap() };

    if JS_RUNTIME.is_none() {
        eprintln!("Error: JS runtime not initialized");
        return 1;
    }

    let runtime_ref = JS_RUNTIME.as_ref().unwrap().clone();

    _ = utils::get_runtime().block_on(async move {
        let local_set = tokio::task::LocalSet::new();

        local_set
            .run_until(async move {
                let mut javascript_runtime = runtime_ref.borrow_mut();
                let fnc_call = {
                    // Retrieve the function from the module
                    let js_function = {
                        let scope = &mut javascript_runtime.handle_scope();
                        let js_function = js_runtime::get_js_function(scope, function_str);

                        if let Err(e) = js_function {
                            return Err(e);
                        }
                        js_function.unwrap()
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

                Ok("Success")
            })
            .await
    });

    0
}

#[no_mangle]
pub unsafe extern "C" fn dispose_runtime() -> u8 {
    unsafe {
        JS_RUNTIME = None; // Drop the runtime safely
    }

    0
}
