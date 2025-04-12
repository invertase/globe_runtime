use std::{
    ffi::{c_char, c_void, CStr},
    rc::Rc,
    sync::Arc,
};

use deno_runtime::{
    deno_console,
    deno_core::{extension, JsRuntime, RuntimeOptions},
    deno_fetch, deno_net,
    deno_permissions::PermissionsContainer,
    deno_telemetry, deno_url, deno_web, deno_webidl,
    ops::{self},
    permissions::RuntimePermissionDescriptorParser,
};

use crate::{dart_runtime::dart_runtime, js_resolver::NpmFsModuleLoader};

#[derive(Debug)]
pub struct JsFunctionArgs {
    pub args: *const *const c_void,
    pub type_ids: *const i32,
    pub sizes: *const isize,
    pub count: i32,
}

pub fn get_runtime(send_port: i64) -> JsRuntime {
    let permission_desc_parser = Arc::new(RuntimePermissionDescriptorParser::new(
        sys_traits::impls::RealSys,
    ));
    let permissions = PermissionsContainer::allow_all(permission_desc_parser);

    let extensions = vec![
        deno_permissions_worker::init_ops_and_esm(permissions, false),
        deno_telemetry::deno_telemetry::init_ops_and_esm(),
        deno_webidl::deno_webidl::init_ops_and_esm(),
        deno_console::deno_console::init_ops_and_esm(),
        deno_url::deno_url::init_ops_and_esm(),
        deno_web::deno_web::init_ops_and_esm::<PermissionsContainer>(
            Default::default(),
            Default::default(),
        ),
        deno_net::deno_net::init_ops_and_esm::<PermissionsContainer>(None, None),
        deno_fetch::deno_fetch::init_ops_and_esm::<PermissionsContainer>(Default::default()),
        js_runtime::init_ops_and_esm(),
        bufbuild::init_ops_and_esm(),
        dart_runtime::init_ops_and_esm::<i64>(send_port),
    ];

    let platform = v8::new_default_platform(0, false).make_shared();

    JsRuntime::new(RuntimeOptions {
        module_loader: Some(Rc::new(NpmFsModuleLoader)),
        extension_transpiler: Some(Rc::new(|specifier, source| {
            deno_runtime::transpile::maybe_transpile_source(specifier, source)
        })),
        extensions,
        v8_platform: Some(platform),
        ..Default::default()
    })
}

pub fn get_js_function(
    scope: &mut v8::HandleScope,
    module: &str,
    function: &str,
) -> Result<(v8::Global<v8::Function>, v8::Global<v8::Value>), String> {
    let module_obj = get_js_module(scope, module)?;

    let state_key = v8::String::new(scope, "state").unwrap();
    let state_value = module_obj
        .get(scope, state_key.into())
        .ok_or_else(|| format!("Error: 'state' property not found in module '{}'", module))?;
    let state_global = v8::Global::new(scope, state_value);

    let function_key = v8::String::new(scope, function).ok_or_else(|| {
        format!(
            "Error: Failed to create V8 string for function '{}'",
            function
        )
    })?;
    let function_value = module_obj.get(scope, function_key.into());

    match function_value {
        Some(value) if value.is_function() => {
            let function = v8::Local::<v8::Function>::try_from(value)
                .map_err(|_| format!("Error: '{}' is not a valid function", function))?;
            let function_global = v8::Global::new(scope, function);

            Ok((function_global, state_global))
        }
        _ => Err(format!("Error: Function '{}' not found", function)),
    }
}

pub fn get_js_module<'a>(
    scope: &mut v8::HandleScope<'a>,
    module: &str,
) -> Result<v8::Local<'a, v8::Object>, String> {
    let global = scope.get_current_context().global(scope);

    // Access the module object inside globalThis
    let module_key = v8::String::new(scope, module)
        .ok_or_else(|| format!("Error: Failed to create V8 string for module '{}'", module))?;
    let module_value = global.get(scope, module_key.into());

    // Ensure module exists
    match module_value {
        Some(value) if value.is_object() => Ok(value.to_object(scope).unwrap()),
        _ => {
            return Err(format!(
                "Error: Module '{}' not registered in runtime.",
                module
            ))
        }
    }
}

extension!(
    js_runtime,
    esm_entry_point = "ext:js_runtime/js_runtime.ts",
    esm = [dir "src", "js_runtime.ts"],
);

extension!(deno_permissions_worker,
  options = {
    permissions: PermissionsContainer,
    enable_testing_features: bool,
  },
  state = |state, options| {
    state.put::<PermissionsContainer>(options.permissions);
    state.put(ops::TestingFeaturesEnabled(options.enable_testing_features));
  },
);

extension!(
    bufbuild,
    esm_entry_point = "ext:bufbuild/index.js",
    esm = [
        dir "third_party/@bufbuild/protobuf/dist/esm/",
        "wire/text-format.js",
        "wire/varint.js",

        "types.js",
        "index.js",
        "is-message.js",
        "create.js",
        "clone.js",
        "descriptors.js",
        "equals.js",
        "fields.js",
        "registry.js",
        "to-binary.js",
        "from-binary.js",
        "to-json.js",
        "from-json.js",
        "extensions.js",
        "proto-int64.js",
        "codegenv1/boot.js",
        // "codegenv1/embed.js",
        "codegenv1/enum.js",
        // "codegenv1/extension.js",
        "codegenv1/file.js",
        // "codegenv1/index.js",
        "codegenv1/message.js",
        "codegenv1/restore-json-names.js",
        // "codegenv1/scalar.js",
        // "codegenv1/service.js",
        // "codegenv1/symbols.js",
        // "codegenv1/types.js",
        "wire/base64-encoding.js",
        "wire/binary-encoding.js",
        "wire/index.js",
        "wire/size-delimited.js",
        "wire/text-encoding.js",
        // "wire/text-format.js",
        // "wire/varint.js",
        // "reflect/index.js",
        "reflect/names.js",
        "reflect/nested-types.js",
        "reflect/reflect-check.js",
        // "reflect/reflect-types.js",
        "reflect/reflect.js",
        "reflect/scalar.js",
        "reflect/error.js",
        "reflect/guard.js",
        "reflect/unsafe.js",
        "wkt/any.js",
        "wkt/index.js",
        "wkt/timestamp.js",
        "wkt/wrappers.js",
        "wkt/gen/google/protobuf/any_pb.js",
        "wkt/gen/google/protobuf/api_pb.js",
        "wkt/gen/google/protobuf/descriptor_pb.js",
        "wkt/gen/google/protobuf/duration_pb.js",
        "wkt/gen/google/protobuf/empty_pb.js",
        "wkt/gen/google/protobuf/field_mask_pb.js",
        "wkt/gen/google/protobuf/source_context_pb.js",
        "wkt/gen/google/protobuf/struct_pb.js",
        "wkt/gen/google/protobuf/timestamp_pb.js",
        "wkt/gen/google/protobuf/type_pb.js",
        "wkt/gen/google/protobuf/wrappers_pb.js",
        "wkt/gen/google/protobuf/compiler/plugin_pb.js"
    ],
);

#[repr(i32)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FFITypeId {
    None = 0,
    String = 1,
    Integer = 2,
    Double = 3,
    Bool = 4,
    Bytes = 5,
}

impl FFITypeId {
    // ✅ Convert from `i32` (received from Dart)
    pub fn from_i32(value: i32) -> Option<Self> {
        match value {
            0 => Some(FFITypeId::None),
            1 => Some(FFITypeId::String),
            2 => Some(FFITypeId::Integer),
            3 => Some(FFITypeId::Double),
            4 => Some(FFITypeId::Bool),
            5 => Some(FFITypeId::Bytes),
            _ => None,
        }
    }
}

pub fn c_args_to_v8_args_global(
    scope: &mut v8::HandleScope,
    args: *const *const c_void,
    type_ids: *const i32,
    sizes: *const isize,
    count: i32,
) -> Vec<v8::Global<v8::Value>> {
    let mut v8_args = Vec::new();

    for i in 0..count as usize {
        let arg_ptr = unsafe { *args.add(i) };
        let type_id = unsafe { *type_ids.add(i) };
        let size = unsafe { *sizes.add(i) };

        if arg_ptr.is_null() {
            println!("❌ Arg[{}] is NULL", i);
            continue;
        }

        let ffi_type = FFITypeId::from_i32(type_id);

        let v8_value: v8::Local<v8::Value> = match ffi_type {
            Some(FFITypeId::String) => {
                // ✅ String (Pointer to UTF-8)
                let c_str = unsafe { CStr::from_ptr(arg_ptr as *const c_char) };
                match c_str.to_str() {
                    Ok(string) => v8::String::new(scope, string).unwrap().into(),
                    Err(_) => v8::undefined(scope).into(),
                }
            }
            Some(FFITypeId::Integer) => {
                let int_value = unsafe { *(arg_ptr as *const i32) };
                v8::Integer::new(scope, int_value).into()
            }
            Some(FFITypeId::Double) => {
                let float_value = unsafe { *(arg_ptr as *const f64) };
                v8::Number::new(scope, float_value).into()
            }
            Some(FFITypeId::Bool) => {
                let bool_value = arg_ptr as usize != 0;
                v8::Boolean::new(scope, bool_value).into()
            }
            Some(FFITypeId::Bytes) => {
                let byte_array =
                    unsafe { std::slice::from_raw_parts(arg_ptr as *const u8, size as usize) };

                let v8_array = v8::ArrayBuffer::new_backing_store_from_boxed_slice(
                    byte_array.to_vec().into_boxed_slice(),
                );
                let v8_shared_array = v8_array.make_shared();
                let v8_buffer = v8::ArrayBuffer::with_backing_store(scope, &v8_shared_array);
                v8_buffer.into()
            }
            _ => v8::undefined(scope).into(),
        };

        let global_value = v8::Global::new(scope, v8_value);
        v8_args.push(global_value);
    }

    v8_args
}

pub fn c_args_to_v8_args_local<'s>(
    scope: &mut v8::HandleScope<'s>,
    args: *const *const c_void,
    type_ids: *const i32,
    sizes: *const isize,
    count: i32,
) -> Vec<v8::Local<'s, v8::Value>> {
    let mut v8_args = Vec::new();

    for i in 0..count as usize {
        let arg_ptr = unsafe { *args.add(i) };
        let type_id = unsafe { *type_ids.add(i) };
        let size = unsafe { *sizes.add(i) };

        if arg_ptr.is_null() {
            continue;
        }

        let ffi_type = FFITypeId::from_i32(type_id);

        let v8_value: v8::Local<v8::Value> = match ffi_type {
            Some(FFITypeId::String) => {
                // ✅ String (Pointer to UTF-8)
                let c_str = unsafe { CStr::from_ptr(arg_ptr as *const c_char) };
                match c_str.to_str() {
                    Ok(string) => v8::String::new(scope, string).unwrap().into(),
                    Err(_) => v8::undefined(scope).into(),
                }
            }
            Some(FFITypeId::Integer) => {
                let int_value = unsafe { *(arg_ptr as *const i32) };
                v8::Integer::new(scope, int_value).into()
            }
            Some(FFITypeId::Double) => {
                let float_value = unsafe { *(arg_ptr as *const f64) };
                v8::Number::new(scope, float_value).into()
            }
            Some(FFITypeId::Bool) => {
                let bool_value = arg_ptr as usize != 0;
                v8::Boolean::new(scope, bool_value).into()
            }
            Some(FFITypeId::Bytes) => {
                let byte_array =
                    unsafe { std::slice::from_raw_parts(arg_ptr as *const u8, size as usize) };

                let v8_array = v8::ArrayBuffer::new_backing_store_from_boxed_slice(
                    byte_array.to_vec().into_boxed_slice(),
                );
                let v8_shared_array = v8_array.make_shared();
                let v8_buffer = v8::ArrayBuffer::with_backing_store(scope, &v8_shared_array);
                v8_buffer.into()
            }
            _ => v8::undefined(scope).into(),
        };

        v8_args.push(v8_value);
    }

    v8_args
}

pub fn register_js_module<'s>(
    scope: &mut v8::HandleScope<'s>,
    module_name: v8::Local<'s, v8::String>,
    init_function: v8::Local<'s, v8::Function>,
    functions_object: v8::Local<'s, v8::Object>,
    module_init_args: JsFunctionArgs,
) -> u8 {
    let mut v8_args = c_args_to_v8_args_local(
        scope,
        module_init_args.args,
        module_init_args.type_ids,
        module_init_args.sizes,
        module_init_args.count,
    );
    v8_args.insert(0, v8::Object::new(scope).into());

    let receiver = v8::undefined(scope).into();
    let module_state_value = init_function.call(scope, receiver, &v8_args).unwrap();

    // Create module object and set the state
    let module_object = v8::Object::new(scope);
    let state_key = v8::String::new(scope, "state").unwrap();
    module_object.set(scope, state_key.into(), module_state_value);

    let args = v8::GetPropertyNamesArgs {
        mode: v8::KeyCollectionMode::OwnOnly,
        property_filter: v8::PropertyFilter::ALL_PROPERTIES,
        index_filter: v8::IndexFilter::IncludeIndices,
        key_conversion: v8::KeyConversionMode::KeepNumbers,
    };

    let props_array = functions_object
        .get_own_property_names(scope, args)
        .unwrap();

    // Loop over module properties and register functions
    for i in 0..props_array.length() {
        let key = props_array.get_index(scope, i).unwrap();
        let value = functions_object.get(scope, key).unwrap();
        if value.is_function() {
            module_object.set(scope, key, value.into());
        }
    }

    // Put module on globalThis
    let global = scope.get_current_context().global(scope);
    global.set(scope, module_name.into(), module_object.into());

    0
}
