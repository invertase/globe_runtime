mod dart_api;
mod dart_runtime;
mod js_resolver;
mod js_runtime;
mod utils;

use deno_runtime::deno_core::{self};
use tokio::runtime::Runtime;

use std::ffi::{c_char, c_void, CStr};

#[repr(C)]
pub struct GlobeJSRuntime {
    pub runtime: deno_core::JsRuntime,
    pub dart_port: dart_api::Dart_Port,
    pub tokio_runtime: *mut Runtime,
}

#[no_mangle]
pub unsafe extern "C" fn init_runtime(
    module: *const c_char,
    dart_api: *mut c_void,
    dart_port: dart_api::Dart_Port,
    globe_js_runtime: *mut *mut GlobeJSRuntime,
) -> u8 {
    let module_name = unsafe { CStr::from_ptr(module).to_str().unwrap() };

    // Resolve the JS module path
    let main_module = match deno_core::resolve_path(module_name, &std::env::current_dir().unwrap())
    {
        Ok(path) => path,
        Err(e) => {
            eprintln!("Failed to resolve module path: {}", e);
            return 1;
        }
    };

    let mut runtime = js_runtime::get_runtime(dart_port);
    let tokio_runtime = utils::get_runtime();

    // Load and evaluate the JavaScript module
    let load_result = tokio_runtime.block_on(async {
        let mod_id = match runtime.load_main_es_module(&main_module).await {
            Ok(id) => id,
            Err(e) => {
                eprintln!("Error loading JS module: {}", e);
                return Err(e);
            }
        };

        let result = runtime.mod_evaluate(mod_id);

        // Wait for module execution
        if let Err(e) = runtime.run_event_loop(Default::default()).await {
            eprintln!("Error running event loop: {}", e);
            return Err(e);
        }

        if let Err(e) = result.await {
            eprintln!("Error evaluating module: {}", e);
            return Err(e);
        }

        Ok(())
    });

    if let Err(_) = load_result {
        return 1;
    }

    let result = dart_api::Dart_InitializeApiDL(dart_api);
    if result != 0 {
        eprintln!("Failed to initialize Dart DL C API: Version mismatch. Ensure that include/ matches Dart SDK version.");
        return 1;
    }

    // Allocate the `GlobeJSRuntime` struct and store it in the provided pointer
    let globe_runtime = Box::new(GlobeJSRuntime {
        runtime,
        dart_port,
        tokio_runtime: tokio_runtime as *const Runtime as *mut Runtime,
    });
    *globe_js_runtime = Box::into_raw(globe_runtime);

    0
}

#[no_mangle]
pub unsafe extern "C" fn dispose_runtime(globe_js_runtime: *mut *mut GlobeJSRuntime) -> u8 {
    if globe_js_runtime.is_null() {
        return 1;
    }

    let runtime = Box::from_raw(*globe_js_runtime);
    drop(runtime);

    *globe_js_runtime = std::ptr::null_mut();

    0
}

#[no_mangle]
pub unsafe extern "C" fn call_js_function(
    name: *const c_char,
    identifier: u8,
    globe_js_runtime: *mut GlobeJSRuntime,
) -> u8 {
    if globe_js_runtime.is_null() {
        eprintln!("Globe Runtime not initialized");
        return 1;
    }

    let globe_js_runtime = &mut *globe_js_runtime;
    let tokio_runtime = &*globe_js_runtime.tokio_runtime;
    let javascript_runtime = &mut globe_js_runtime.runtime;

    let function_name = unsafe { CStr::from_ptr(name).to_str().unwrap() };

    tokio_runtime.block_on(async {
        // Retrieve the function from the module
        let add_fn = {
            let scope = &mut javascript_runtime.handle_scope();
            let global = scope.get_current_context().global(scope);

            let function_key = v8::String::new(scope, function_name).unwrap();
            let function_value = global.get(scope, function_key.into());

            // Ensure function exists
            match function_value {
                Some(value) if value.is_function() => {
                    let function = v8::Local::<v8::Function>::try_from(value).unwrap();
                    v8::Global::new(scope, function)
                }
                _ => {
                    eprintln!("Error: Function '{}' not found", function_name);
                    return;
                }
            }
        };

        // Prepare arguments
        let args = {
            let scope = &mut javascript_runtime.handle_scope();
            let arg1: v8::Local<v8::Value> = v8::Integer::new(scope, 3).into();
            let arg2: v8::Local<v8::Value> = v8::Integer::new(scope, 5).into();
            vec![v8::Global::new(scope, arg1), v8::Global::new(scope, arg2)]
        };

        // Call the JS function
        let future = javascript_runtime.call_with_args(&add_fn, &args);

        // Wait for execution
        match future.await {
            Ok(result) => {
                let scope = &mut javascript_runtime.handle_scope();
                let result_value = v8::Local::<v8::Value>::new(scope, result);

                if let Some(int_result) = result_value.to_integer(scope) {
                    println!(
                        "Function '{}' returned: {}",
                        function_name,
                        int_result.value()
                    );
                } else {
                    eprintln!("Function '{}' did not return an integer", function_name);
                }
            }
            Err(e) => {
                eprintln!("Error calling function '{}': {}", function_name, e);
            }
        }
    });

    0
}
