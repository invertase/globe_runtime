use rusty_v8 as v8;

mod async_runtime;
mod polyfill_console;
mod polyfill_fetch;

pub fn init_v8<F>(closure: F)
where
    F: FnOnce(&mut v8::Isolate),
{
    // Initialize V8.
    let platform = v8::new_default_platform(0, false).make_shared();
    v8::V8::initialize_platform(platform);
    v8::V8::initialize();

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

pub fn execute_js(script_content: String, isolate: &mut v8::Isolate) {
    {
        let handle_scope = &mut v8::HandleScope::new(isolate);
        let global = v8::ObjectTemplate::new(handle_scope);

        global.set(
            v8::String::new(handle_scope, "fetch").unwrap().into(),
            v8::FunctionTemplate::new(handle_scope, polyfill_fetch::fetch).into(),
        );

        let context = v8::Context::new_from_template(handle_scope, global);
        let context_scope = &mut v8::ContextScope::new(handle_scope, context);

        // Create and add console object
        let console_template = polyfill_console::create_console(context_scope);
        let global = context_scope.get_current_context().global(context_scope);
        let console_key = v8::String::new(context_scope, "console").unwrap();
        let console_obj = console_template.new_instance(context_scope).unwrap();
        global.set(context_scope, console_key.into(), console_obj.into());

        let code = v8::String::new(context_scope, &script_content).unwrap();
        let script = v8::Script::compile(context_scope, code, None).unwrap();

        script.run(context_scope);
    }
}
