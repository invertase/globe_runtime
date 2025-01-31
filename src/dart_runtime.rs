use crate::dart_api;

use deno_core::extension;
use deno_core::op2;
use deno_core::OpState;

trait DartJsCommsBridge {
    fn send_to_dart(&self, message: &str) -> bool;
}

#[derive(Clone)]
pub struct DartRuntimeOptions {
    pub send_port: i64,
}

impl DartJsCommsBridge for i64 {
    fn send_to_dart(&self, message: &str) -> bool {
        let mut obj = dart_api::Dart_CObject {
            type_: dart_api::Dart_CObject_kString,
            value: dart_api::_Dart_CObject__bindgen_ty_1 {
                as_string: message.as_ptr() as *mut std::ffi::c_char,
            },
        };

        unsafe { dart_api::Dart_PostCObject(*self, &mut obj) }
    }
}

#[op2(fast)]
fn op_send_to_dart<FP>(
    state: &mut OpState,
    #[string] message: String,
) -> Result<bool, std::io::Error>
where
    FP: DartJsCommsBridge + 'static,
{
    let options = state.borrow::<DartRuntimeOptions>();

    let result = options.send_port.send_to_dart(message.to_string().as_str());

    Ok(result)
}

extension!(
    dart_runtime,
    parameters = [FP: DartJsCommsBridge],
    ops = [
        op_send_to_dart<FP>,
    ],
    options = {
        send_port: i64,
    },
    state = |state, options| {
        state.put::<DartRuntimeOptions>(DartRuntimeOptions {
            send_port: options.send_port,
        });
    },
);
