use crate::dart_api;

use deno_core::extension;
use deno_core::op2;
use deno_core::OpState;

trait DartJsCommsBridge {
    fn send_to_dart(&self, callback_id: i32, data: &[u8]) -> bool;
}

#[derive(Clone)]
pub struct DartRuntimeOptions {
    pub send_port: i64,
}

impl DartJsCommsBridge for i64 {
    fn send_to_dart(&self, callback_id: i32, data: &[u8]) -> bool {
        let mut data_vec = data.to_vec();

        // First Dart_CObject: Integer (callback_id)
        let mut callback_obj = dart_api::Dart_CObject {
            type_: dart_api::Dart_CObject_kInt32,
            value: dart_api::_Dart_CObject__bindgen_ty_1 {
                as_int32: callback_id,
            },
        };

        // Second Dart_CObject: Uint8Array (data)
        let mut byte_array_obj = dart_api::Dart_CObject {
            type_: dart_api::Dart_CObject_kTypedData,
            value: dart_api::_Dart_CObject__bindgen_ty_1 {
                as_typed_data: dart_api::_Dart_CObject__bindgen_ty_1__bindgen_ty_4 {
                    type_: dart_api::Dart_TypedData_kUint8,
                    values: data_vec.as_mut_ptr(),
                    length: data_vec.len() as isize,
                },
            },
        };

        // Create a Dart_CObject list of fixed length 2
        let mut array_values: [*mut dart_api::Dart_CObject; 2] = [
            &mut callback_obj as *mut dart_api::Dart_CObject,
            &mut byte_array_obj as *mut dart_api::Dart_CObject,
        ];

        let mut parent_obj = dart_api::Dart_CObject {
            type_: dart_api::Dart_CObject_kArray,
            value: dart_api::_Dart_CObject__bindgen_ty_1 {
                as_array: dart_api::_Dart_CObject__bindgen_ty_1__bindgen_ty_3 {
                    values: array_values.as_mut_ptr(),
                    length: array_values.len() as isize,
                },
            },
        };

        unsafe { dart_api::Dart_PostCObject(*self, &mut parent_obj) }
    }
}

#[op2(fast)]
fn op_send_to_dart<FP>(state: &mut OpState, callback_id: i32, #[buffer] data: &[u8]) -> bool
where
    FP: DartJsCommsBridge + 'static,
{
    let options = state.borrow::<DartRuntimeOptions>();

    options.send_port.send_to_dart(callback_id, data)
}
extension!(
    dart_runtime,
    parameters = [FP: DartJsCommsBridge],
    ops = [
        op_send_to_dart<FP>,
    ],
    esm_entry_point = "ext:dart_runtime/dart_runtime.ts",
    esm = [ dir "src", "dart_runtime.ts", "dart_runtime_data.ts" ],
    options = {
        send_port: i64,
    },
    state = |state, options| {
        state.put::<DartRuntimeOptions>(DartRuntimeOptions {
            send_port: options.send_port,
        });
    },
);
