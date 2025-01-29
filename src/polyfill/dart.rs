use crate::dart_api_dl;
use rusty_v8 as v8;

pub fn send_to_port(
    scope: &mut v8::HandleScope,
    args: v8::FunctionCallbackArguments,
    mut rv: v8::ReturnValue,
) {
    // Get the first argument and convert it to a Rust String
    let js_string = args.get(0).to_string(scope).unwrap();
    let rust_string = js_string.to_rust_string_lossy(scope);
    let dart_port: i64 = rust_string.parse::<i64>().unwrap();

    let message = args
        .get(1)
        .to_string(scope)
        .unwrap()
        .to_rust_string_lossy(scope);

    unsafe {
        let mut obj = dart_api_dl::Dart_CObject {
            type_: dart_api_dl::Dart_CObject_kString,
            value: dart_api_dl::_Dart_CObject__bindgen_ty_1 {
                as_string: message.as_ptr() as *mut i8,
            },
        };

        let result = dart_api_dl::Dart_PostCObject(dart_port, &mut obj);

        rv.set(v8::Boolean::new(scope, result).into());
    }
}
