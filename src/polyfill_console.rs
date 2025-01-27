use rusty_v8 as v8;

pub fn log_callback(
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

pub fn create_console<'a>(scope: &mut v8::HandleScope<'a>) -> v8::Local<'a, v8::ObjectTemplate> {
    let console = v8::ObjectTemplate::new(scope);

    // Add all standard console methods
    let methods = [
        ("log", log_callback),
        ("info", log_callback),
        ("warn", log_callback),
        ("error", log_callback),
        ("debug", log_callback),
    ];

    for (name, callback) in methods.iter() {
        console.set(
            v8::String::new(scope, name).unwrap().into(),
            v8::FunctionTemplate::new(scope, *callback).into(),
        );
    }

    console
}
