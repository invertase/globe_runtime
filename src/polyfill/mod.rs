use std::sync::OnceLock;

use rusty_v8::{self as v8, TryCatch};
use tokio::runtime::Runtime;

pub mod console;
pub mod dart;
pub mod fetch;
pub mod process;
pub mod require;

static RUNTIME: OnceLock<Runtime> = OnceLock::new();

pub fn get_runtime() -> &'static Runtime {
    RUNTIME.get_or_init(|| Runtime::new().expect("Failed to create Tokio runtime"))
}

pub fn create_global_object<'s>(
    scope: &mut v8::HandleScope<'s, ()>,
) -> v8::Local<'s, v8::ObjectTemplate> {
    let global = v8::ObjectTemplate::new(scope);

    global.set(
        v8::String::new(scope, "fetch").unwrap().into(),
        v8::FunctionTemplate::new(scope, fetch::fetch).into(),
    );
    global.set(
        v8::String::new(scope, "require").unwrap().into(),
        v8::FunctionTemplate::new(scope, require::require).into(),
    );
    global.set(
        v8::String::new(scope, "send_to_port").unwrap().into(),
        v8::FunctionTemplate::new(scope, dart::send_to_port).into(),
    );
    global.set(
        v8::String::new(scope, "require").unwrap().into(),
        v8::FunctionTemplate::new(scope, require::require).into(),
    );

    // Add `exports` object
    let exports = v8::ObjectTemplate::new(scope);
    let exports_key = v8::String::new(scope, "exports").unwrap();
    global.set(exports_key.into(), exports.into());

    // let fetch_extension =
    //     deno_fetch::deno_fetch::init_ops_and_esm::<PermissionsContainer>(deno_fetch::Options {
    //         user_agent: "Deno/1.0.0".to_string(),
    //         file_fetch_handler: Rc::new(deno_fetch::FsFetchHandler),
    //         ..Default::default()
    //     });

    // if let Some(template) = fetch_extension.global_template_middleware {
    //     template(
    //         &mut convert_handle_scope(scope),
    //         convert_local_object_template(global),
    //     );
    // }

    global
}

// Helper function to handle V8 exceptions
pub fn handle_v8_exception(scope: &mut TryCatch<v8::HandleScope>) {
    if let Some(exception) = scope.exception() {
        let exception_string = exception
            .to_string(scope)
            .map(|s| s.to_rust_string_lossy(scope))
            .unwrap_or_else(|| "Unknown exception".to_string());
        eprintln!("V8 Exception: {}", exception_string);

        if let Some(stack_trace) = scope.stack_trace() {
            let stack_trace_string = stack_trace
                .to_string(scope)
                .map(|s| s.to_rust_string_lossy(scope))
                .unwrap_or_else(|| "No stack trace".to_string());
            eprintln!("Stack trace: {}", stack_trace_string);
        }
    }
}

// fn convert_handle_scope<'s>(
//     rusty_scope: &mut rusty_v8::HandleScope<'s, ()>,
// ) -> actual_v8::HandleScope<'s> {
//     unsafe { std::mem::transmute(rusty_scope) }
// }

// fn convert_local_object_template(
//     rusty_local: rusty_v8::Local<rusty_v8::ObjectTemplate>,
// ) -> actual_v8::Local<actual_v8::ObjectTemplate> {
//     unsafe { std::mem::transmute(rusty_local) }
// }
