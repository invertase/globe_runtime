use std::{rc::Rc, sync::Arc};

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
        dart_runtime::init_ops::<i64>(send_port),
        js_runtime::init_ops_and_esm(),
    ];

    JsRuntime::new(RuntimeOptions {
        module_loader: Some(Rc::new(NpmFsModuleLoader)),
        extension_transpiler: Some(Rc::new(|specifier, source| {
            deno_runtime::transpile::maybe_transpile_source(specifier, source)
        })),
        extensions,
        ..Default::default()
    })
}

extension!(
    js_runtime,
    esm_entry_point = "ext:js_runtime/js_runtime.js",
    esm = [dir "src", "js_runtime.js"],
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
