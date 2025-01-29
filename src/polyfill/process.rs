use rusty_v8 as v8;

pub fn bind_process(scope: &mut v8::HandleScope, global: v8::Local<v8::Object>) {
    let key = v8::String::new(scope, "process").unwrap();
    let process_obj = v8::Object::new(scope);

    // Create the `env` object
    let env_key = v8::String::new(scope, "env").unwrap();
    let env_obj = v8::Object::new(scope);

    // Populate `env` with environment variables from Rust's `std::env`
    for (key, value) in std::env::vars() {
        let key_v8 = v8::String::new(scope, &key).unwrap();
        let value_v8 = v8::String::new(scope, &value).unwrap();
        env_obj.set(scope, key_v8.into(), value_v8.into());
    }

    // // Attach `env` to `process`
    process_obj.set(scope, env_key.into(), env_obj.into());

    // Attach `process` to the global object
    global.set(scope, key.into(), process_obj.into());
}
