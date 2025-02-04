use crate::dart_api;

use deno_core::extension;
use deno_core::op2;
use deno_core::OpState;

trait DartJsCommsBridge {
    fn send_to_dart(&self, callback_id: i32, message: &str) -> bool;
}

#[derive(Clone)]
pub struct DartRuntimeOptions {
    pub send_port: i64,
}

impl DartJsCommsBridge for i64 {
    fn send_to_dart(&self, callback_id: i32, message: &str) -> bool {
        let json_obj = serde_json::json!({
            "callback_id": callback_id,
            "data": message
        });

        let mut json_data = match serde_json::to_vec(&json_obj) {
            Ok(data) => data,
            Err(e) => return false,
        };

        let mut parent_obj = dart_api::Dart_CObject {
            type_: dart_api::Dart_CObject_kTypedData,
            value: dart_api::_Dart_CObject__bindgen_ty_1 {
                as_typed_data: dart_api::_Dart_CObject__bindgen_ty_1__bindgen_ty_4 {
                    type_: dart_api::Dart_TypedData_kUint8,
                    values: json_data.as_mut_ptr(),
                    length: json_data.len() as isize,
                },
            },
        };

        unsafe { dart_api::Dart_PostCObject(*self, &mut parent_obj) }
    }
}

#[op2(fast)]
fn op_send_to_dart<FP>(state: &mut OpState, callback_id: i32, #[string] message: String) -> bool
where
    FP: DartJsCommsBridge + 'static,
{
    let options = state.borrow::<DartRuntimeOptions>();

    options
        .send_port
        .send_to_dart(callback_id, message.to_string().as_str())
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
