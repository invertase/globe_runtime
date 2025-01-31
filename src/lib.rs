mod dart_api;
mod dart_runtime;
mod js_runtime;

use deno_runtime::deno_core::{self};
use tokio::runtime;

use std::{
    ffi::{c_char, c_void, CStr},
    path::Path,
};

#[no_mangle]
pub unsafe extern "C" fn ai_sdk_dispose_sdk() -> u8 {
    0
}

#[no_mangle]
pub unsafe extern "C" fn ai_sdk_initialize_sdk(api: *mut c_void) -> u8 {
    let result = dart_api::Dart_InitializeApiDL(api);
    if result != 0 {
        panic!("Failed to initialize Dart DL C API: Version mismatch. Ensure that include/ matches Dart SDK version.");
    }

    result as u8
}

#[no_mangle]
pub unsafe extern "C" fn ai_sdk_execute_async(
    query: *const c_char,
    _: u8,
    dart_port: dart_api::Dart_Port,
) -> u8 {
    let cquery = unsafe { CStr::from_ptr(query) };
    let _: &str = cquery.to_str().unwrap();

    let script_path = "index.js";

    if !Path::new(script_path).exists() {
        eprintln!("File '{}' does not exist.", script_path);
        std::process::exit(1);
    }

    let main_module =
        deno_core::resolve_path(script_path, &std::env::current_dir().unwrap()).unwrap();

    let tokio = runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();

    tokio.block_on(async {
        let mut js_runtime = js_runtime::get_runtime(dart_port);
        let mod_id = js_runtime.load_main_es_module(&main_module).await.unwrap();
        let result = js_runtime.mod_evaluate(mod_id);
        _ = js_runtime.run_event_loop(Default::default()).await.unwrap();
        _ = result.await
    });

    0
}
