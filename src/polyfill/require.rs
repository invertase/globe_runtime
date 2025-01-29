use rusty_v8 as v8;
use std::fs;
use std::ops::DerefMut;
use std::path::Path;
use v8::TryCatch;

use super::create_global_object;
use super::handle_v8_exception;

pub fn require(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut rv: v8::ReturnValue,
) {
    let isolate_ptr = scope.deref_mut().deref_mut() as *mut v8::Isolate;
    let _isolate: &mut v8::Isolate = unsafe { &mut *isolate_ptr };

    let module_name = args
        .get(0)
        .to_string(scope)
        .unwrap()
        .to_rust_string_lossy(scope);

    // Build the module path
    let module_path = Path::new("node_modules")
        .join(&module_name)
        .join("dist")
        .join("index.js");

    // Read the module's source code
    let source = match fs::read_to_string(&module_path) {
        Ok(content) => content,
        Err(err) => {
            eprintln!("Error reading module '{}': {}", &module_name, err);
            return;
        }
    };

    let global = create_global_object(scope);
    let module_context = v8::Context::new_from_template(scope, global);
    let context_scope = &mut v8::ContextScope::new(scope, module_context);

    {
        let try_catch = &mut TryCatch::new(context_scope);

        // Compile the module's code
        let code = match v8::String::new(try_catch, &source) {
            Some(c) => c,
            None => {
                handle_v8_exception(try_catch);
                return;
            }
        };

        println!("Compiling module: {:?}", module_path);

        // Compile and execute the module's code
        let script = match v8::Script::compile(try_catch, code, None) {
            Some(s) => s,
            None => {
                handle_v8_exception(try_catch);
                return;
            }
        };

        // Execute the script
        script.run(try_catch)
    };

    let global_object = module_context.global(context_scope);
    let exports_key = v8::String::new(context_scope, "exports").unwrap();
    let exports = global_object.get(context_scope, exports_key.into());

    match exports {
        Some(exports_obj) if exports_obj.is_object() => rv.set(exports_obj.into()),
        _ => {
            eprintln!("Error: 'exports' is not an object.");
            rv.set(v8::undefined(context_scope).into());
        }
    }
}
