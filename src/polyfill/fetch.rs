use std::{str::FromStr, sync::mpsc};

use reqwest::{Client, Method};
use rusty_v8 as v8;

use super::get_runtime;

#[derive(Debug)]
struct FetchOptions {
    method: Method,
    headers: Option<String>,
    body: Option<String>,
}

fn string_to_method(method: &str) -> Result<Method, String> {
    match Method::from_str(method.to_uppercase().as_str()) {
        Ok(parsed) => Ok(parsed),
        Err(_) => Err(format!("Invalid HTTP method: {}", method)),
    }
}

fn fetch_options_to_rust(
    scope: &mut v8::HandleScope,
    fetch_arg: v8::Local<v8::Value>,
) -> FetchOptions {
    let mut options = FetchOptions {
        method: Method::GET,
        headers: None,
        body: None,
    };

    if fetch_arg.is_null_or_undefined() {
        return options;
    }

    let fetch_opts = fetch_arg.to_object(scope).unwrap();
    let property_names = fetch_opts.get_property_names(scope).unwrap();

    for i in 0..property_names.length() {
        let key = property_names.get_index(scope, i).unwrap();
        let key_str = key.to_string(scope).unwrap().to_rust_string_lossy(scope);

        let value = fetch_opts.get(scope, key).unwrap();
        let value_str = value.to_string(scope).unwrap().to_rust_string_lossy(scope);

        match key_str.as_str() {
            "method" => options.method = string_to_method(&value_str).unwrap(),
            "headers" => options.headers = Some(value_str),
            "body" => options.body = Some(value_str),
            _ => {}
        }
    }

    options
}

pub fn fetch(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut rv: v8::ReturnValue,
) {
    let url = args
        .get(0)
        .to_string(scope)
        .unwrap()
        .to_rust_string_lossy(scope);

    let fetch_options = fetch_options_to_rust(scope, args.get(1));

    let promise_resolver = v8::PromiseResolver::new(scope).unwrap();
    let promise = promise_resolver.get_promise(scope);

    // Send the Promise back to JavaScript as the function result.
    rv.set(promise.into());

    let global_resolver = v8::Global::new(scope, promise_resolver);

    let (tx, rx) = mpsc::channel();

    get_runtime().spawn(async move {
        let client = Client::new();

        let result = match client.request(fetch_options.method, url).send().await {
            Ok(response) => {
                let body = response.text().await.unwrap();
                Ok(body)
            }
            Err(error) => Err(format!("Failed to fetch: {}", error)),
        };
        tx.send(result).unwrap();
    });

    let resolver = global_resolver.open(scope);

    while let Ok(received) = rx.recv() {
        match received {
            Ok(body) => {
                let result = v8::String::new(scope, &body).unwrap();
                resolver.resolve(scope, result.into());
            }
            Err(err) => {
                let error = v8::String::new(scope, &err).unwrap();
                resolver.reject(scope, error.into());
            }
        }
    }
}
