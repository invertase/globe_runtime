use reqwest::Client;
use rusty_v8 as v8;
use std::env;
use std::fs;
use std::sync::mpsc;

use std::sync::Once;
use tokio::runtime::Runtime;

static INIT: Once = Once::new();
static mut RUNTIME: Option<Runtime> = None;

fn get_runtime() -> &'static Runtime {
    unsafe {
        INIT.call_once(|| {
            let rt = Runtime::new().expect("Failed to create Tokio runtime");
            RUNTIME = Some(rt);
        });
        RUNTIME.as_ref().expect("Runtime is not initialized")
    }
}

fn main() {
    // Get the JavaScript file path from command-line arguments.
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: {} <path_to_script.js>", args[0]);
        std::process::exit(1);
    }

    let script_path = &args[1];

    // Read the JavaScript file content.
    let script_content = match fs::read_to_string(script_path) {
        Ok(content) => content,
        Err(err) => {
            eprintln!("Failed to read file '{}': {}", script_path, err);
            std::process::exit(1);
        }
    };

    let platform = v8::new_default_platform(0, false).make_shared();
    v8::V8::initialize_platform(platform);
    v8::V8::initialize();

    execute_js(script_content);

    unsafe {
        v8::V8::dispose();
    }
}

fn fetch_callback(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut rv: v8::ReturnValue,
) {
    let url = args
        .get(0)
        .to_string(scope)
        .unwrap()
        .to_rust_string_lossy(scope);

    let fetch_opts = args.get(1).to_object(scope).unwrap();

    println!("{:?}", fetch_opts);

    let promise_resolver = v8::PromiseResolver::new(scope).unwrap();
    let promise = promise_resolver.get_promise(scope);

    // Send the Promise back to JavaScript as the function result.
    rv.set(promise.into());

    let global_resolver = v8::Global::new(scope, promise_resolver);

    let (tx, rx) = mpsc::channel();

    get_runtime().spawn(async move {
        let client = Client::new();
        let result = match client.get(&url).send().await {
            Ok(response) => {
                let body = response.text().await.unwrap();
                Ok(body)
            }
            Err(_) => Err("Failed to fetch".to_string()),
        };
        tx.send(result).unwrap();
    });

    let resolver = global_resolver.open(scope);

    for received in rx {
        let body = received.unwrap();

        let result = v8::String::new(scope, &body).unwrap();
        resolver.resolve(scope, result.into());
    }
}

fn log_callback(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    _rv: v8::ReturnValue,
) {
    let message = args
        .get(0)
        .to_string(scope)
        .unwrap()
        .to_rust_string_lossy(scope);
    println!("{}", message);
}

fn execute_js(script_content: String) {
    {
        // Create a new Isolate and make it the current one.
        let isolate = &mut v8::Isolate::new(v8::CreateParams::default());

        // Create a stack-allocated handle scope.
        let handle_scope = &mut v8::HandleScope::new(isolate);

        // Create a new context.
        let context = v8::Context::new(handle_scope);

        // Enter the context for compiling and running the hello world script.
        let scope = &mut v8::ContextScope::new(handle_scope, context);
        setup_fetch(scope, &context);
        setup_console(scope, &context);

        // Create a string containing the JavaScript source code.
        let code = v8::String::new(scope, &script_content).unwrap();

        // Compile the source code.
        let script = v8::Script::compile(scope, code, None).unwrap();
        script.run(scope).unwrap();
    }
}

fn setup_fetch(scope: &mut v8::HandleScope, context: &v8::Local<v8::Context>) {
    let global = context.global(scope);

    let key = v8::String::new(scope, "fetch").unwrap();
    let fetch_fn = v8::FunctionTemplate::new(scope, fetch_callback);
    let fetch_val = fetch_fn.get_function(scope).unwrap();
    global.set(scope, key.into(), fetch_val.into());
}

fn setup_console(scope: &mut v8::HandleScope, context: &v8::Local<v8::Context>) {
    let global = context.global(scope);

    let key = v8::String::new(scope, "console").unwrap();
    let console = v8::Object::new(scope);
    let log_key = v8::String::new(scope, "log").unwrap();
    let log_fn = v8::FunctionTemplate::new(scope, log_callback);
    let log_val = log_fn.get_function(scope).unwrap();
    console.set(scope, log_key.into(), log_val.into());
    global.set(scope, key.into(), console.into());
}
