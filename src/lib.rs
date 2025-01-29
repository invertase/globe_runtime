mod dart_api_dl;
mod polyfill;

use rusty_v8 as v8;
use std::{
    ffi::{c_char, c_void, CStr},
    fs,
};

fn init_v8() {
    let platform = v8::new_default_platform(0, false).make_shared();
    v8::V8::initialize_platform(platform);
    v8::V8::initialize();
}

pub fn create_isolate<F>(closure: F)
where
    F: FnOnce(&mut v8::Isolate),
{
    // Create a new Isolate and pass it to the closure.
    {
        let isolate = &mut v8::Isolate::new(v8::CreateParams::default());
        closure(isolate); // Run the user-provided closure.
    }

    // Dispose V8 after the isolate goes out of scope.
    unsafe {
        v8::V8::dispose();
    }

    v8::V8::shutdown_platform();
}

pub unsafe fn execute_js(
    send_port: dart_api_dl::Dart_Port, // Use a reference
    script_content: String,
    isolate: &mut v8::Isolate,
) {
    {
        let handle_scope = &mut v8::HandleScope::new(isolate);
        let global = polyfill::create_global_object(handle_scope);

        let context = v8::Context::new_from_template(handle_scope, global);
        let context_scope = &mut v8::ContextScope::new(handle_scope, context);
        let context_global = context.global(context_scope);

        let js_send_port = v8::String::new(context_scope, send_port.to_string().as_str()).unwrap();
        let send_port_key = v8::String::new(context_scope, "dart_port").unwrap();
        context_global.set(context_scope, send_port_key.into(), js_send_port.into());

        polyfill::process::bind_process(context_scope, context_global);

        let exports = v8::Object::new(context_scope);
        let exports_name = v8::String::new(context_scope, "exports").unwrap();
        context_global.set(context_scope, exports_name.into(), exports.into());

        // Create and add console object
        let console_template = polyfill::console::create_console(context_scope);
        let console_key = v8::String::new(context_scope, "console").unwrap();
        let console_obj = console_template.new_instance(context_scope).unwrap();
        context_global.set(context_scope, console_key.into(), console_obj.into());

        let code = v8::String::new(context_scope, &script_content).unwrap();
        let script = v8::Script::compile(context_scope, code, None).unwrap();

        script.run(context_scope);
    }
}

#[no_mangle]
pub unsafe extern "C" fn ai_sdk_initialize_sdk(api: *mut c_void) -> u8 {
    let result = dart_api_dl::Dart_InitializeApiDL(api);
    if result != 0 {
        panic!("Failed to initialize Dart DL C API: Version mismatch. Ensure that include/ matches Dart SDK version.");
    }

    init_v8();

    result as u8
}

#[no_mangle]
pub unsafe extern "C" fn ai_sdk_execute_async(
    query: *const c_char,
    identifier: u8,
    send_port: dart_api_dl::Dart_Port,
) -> u8 {
    let cquery = unsafe { CStr::from_ptr(query) };
    let user_query = cquery.to_str().unwrap();

    let script_path = "index.js";

    // Read the JavaScript file content.
    let script_content = match fs::read_to_string(script_path) {
        Ok(content) => content,
        Err(err) => {
            eprintln!("Failed to read file '{}': {}", script_path, err);
            std::process::exit(1);
        }
    };

    create_isolate(|isolate| {
        execute_js(send_port, script_content, isolate);
    });

    0
}
