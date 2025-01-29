use rusty_v8 as v8;

pub fn log_callback(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    _rv: v8::ReturnValue,
) {
    // Handle multiple arguments
    let mut output = String::new();

    for i in 0..args.length() {
        if i > 0 {
            output.push(' ');
        }

        let arg = args.get(i);

        // Handle different types of arguments
        if arg.is_string() {
            output.push_str(&arg.to_string(scope).unwrap().to_rust_string_lossy(scope));
        } else if arg.is_null() {
            output.push_str("null");
        } else if arg.is_undefined() {
            output.push_str("undefined");
        } else if arg.is_boolean() {
            output.push_str(&arg.boolean_value(scope).to_string());
        } else if arg.is_number() {
            output.push_str(&arg.number_value(scope).unwrap().to_string());
        } else if arg.is_object() {
            let global = scope.get_current_context().global(scope);

            // Attempt to stringify the object
            let json = v8::String::new(scope, "JSON").unwrap();
            let json_obj = global.get(scope, json.into()).unwrap();
            let stringify = v8::String::new(scope, "stringify").unwrap();
            let stringify_fn = json_obj
                .to_object(scope)
                .unwrap()
                .get(scope, stringify.into())
                .unwrap();

            let stringify_fn = v8::Local::<v8::Function>::try_from(stringify_fn).unwrap();
            let recv = v8::undefined(scope).into();
            let args = [arg.into()];

            let result = stringify_fn.call(scope, recv, &args);

            if let Some(result) = result {
                let result_str = result.to_rust_string_lossy(scope);
                output.push_str(&result_str);
                continue;
            }

            if let Some(obj) = arg.to_object(scope) {
                let constructor = v8::String::new(scope, "constructor").unwrap();
                if let Some(constructor_val) = obj.get(scope, constructor.into()) {
                    if let Some(_) = constructor_val.to_object(scope) {
                        let name_key = v8::String::new(scope, "name").unwrap();

                        if let Some(name_val) = obj.get(scope, name_key.into()) {
                            output.push_str("[class ");
                            output.push_str(
                                &name_val
                                    .to_string(scope)
                                    .unwrap()
                                    .to_rust_string_lossy(scope),
                            );
                            output.push(']');
                            continue;
                        }
                    }
                }
            }
        }
    }

    println!("{}", output);
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
