use std::{fs, path::Path};

use deno_core::{
    error::ModuleLoaderError, futures::FutureExt, normalize_path, resolve_import, url::Url,
    ModuleLoadResponse, ModuleLoader, ModuleSource, ModuleSourceCode, ModuleSpecifier, ModuleType,
    RequestedModuleType, ResolutionKind,
};
use deno_error::JsErrorBox;
use serde_json::Value;

#[derive(Debug, thiserror::Error, deno_error::JsError)]
#[class(inherit)]
#[error("Failed to load {specifier}")]
pub struct LoadFailedError {
    specifier: ModuleSpecifier,
    #[source]
    #[inherit]
    source: std::io::Error,
}
/// Combined module loader that handles both NPM packages and file system imports
pub struct NpmFsModuleLoader;

impl ModuleLoader for NpmFsModuleLoader {
    fn resolve(
        &self,
        specifier: &str,
        referrer: &str,
        _kind: ResolutionKind,
    ) -> Result<ModuleSpecifier, ModuleLoaderError> {
        if is_file_import(specifier) {
            return Ok(resolve_import(specifier, referrer)?);
        }
        resolve_npm(specifier, referrer)
    }

    fn load(
        &self,
        module_specifier: &ModuleSpecifier,
        _maybe_referrer: Option<&ModuleSpecifier>,
        _is_dynamic: bool,
        requested_module_type: RequestedModuleType,
    ) -> ModuleLoadResponse {
        let module_specifier = module_specifier.clone();
        let fut = async move {
            let path = module_specifier.to_file_path().map_err(|_| {
                JsErrorBox::generic(format!(
                    "Provided module specifier \"{module_specifier}\" is not a file URL."
                ))
            })?;
            let module_type = determine_module_type(&path, &requested_module_type);

            // If we loaded a JSON file, but the "requested_module_type" (that is computed from
            // import attributes) is not JSON we need to fail.
            if module_type == ModuleType::Json && requested_module_type != RequestedModuleType::Json
            {
                return Err(ModuleLoaderError::JsonMissingAttribute);
            }

            let code = std::fs::read(path).map_err(|source| {
                JsErrorBox::from_err(LoadFailedError {
                    specifier: module_specifier.clone(),
                    source,
                })
            })?;
            let module = ModuleSource::new(
                module_type,
                ModuleSourceCode::Bytes(code.into_boxed_slice().into()),
                &module_specifier,
                None,
            );
            Ok(module)
        }
        .boxed_local();

        ModuleLoadResponse::Async(fut)
    }
}

fn is_file_import(specifier: &str) -> bool {
    specifier.starts_with('.')
        || specifier.starts_with('/')
        || specifier.starts_with("./")
        || specifier.starts_with("../")
        || specifier.starts_with("file://")
}

fn determine_module_type(path: &Path, requested_module_type: &RequestedModuleType) -> ModuleType {
    if let Some(extension) = path.extension() {
        let ext = extension.to_string_lossy().to_lowercase();
        match ext.as_str() {
            "json" => ModuleType::Json,
            "wasm" => ModuleType::Wasm,
            _ => match requested_module_type {
                RequestedModuleType::Other(ref ty) => ModuleType::Other(ty.clone()),
                _ => ModuleType::JavaScript,
            },
        }
    } else {
        ModuleType::JavaScript
    }
}

fn resolve_npm(specifier: &str, referrer: &str) -> Result<ModuleSpecifier, ModuleLoaderError> {
    let referrer_url =
        Url::parse(referrer).map_err(|_| JsErrorBox::generic("Invalid referrer URL"))?;
    let referrer_path = referrer_url
        .to_file_path()
        .map_err(|_| JsErrorBox::generic("Referrer is not a file URL"))?;

    let mut current_dir = referrer_path
        .parent()
        .ok_or_else(|| JsErrorBox::generic("Referrer has no parent directory"))?;

    while let Some(parent) = current_dir.parent() {
        let node_modules = current_dir.join("node_modules");
        let package_dir = node_modules.join(specifier);

        if package_dir.exists() {
            let package_json = package_dir.join("package.json");
            if !package_json.exists() {
                return Err(ModuleLoaderError::from(JsErrorBox::generic(
                    "Package directory does not contain package.json",
                )));
            }
            let contents = fs::read_to_string(&package_json).map_err(JsErrorBox::from_err)?;
            let package: Value = serde_json::from_str(&contents).map_err(JsErrorBox::from_err)?;

            let main = package
                .get("module")
                .and_then(|v| v.as_str())
                .unwrap_or("index.mjs");
            let main_path = normalize_path(&package_dir.join(main));

            if !main_path.exists() {
                return Err(ModuleLoaderError::from(JsErrorBox::generic(format!(
                    "Main module does not exist: {main}"
                ))));
            }

            return Url::from_file_path(main_path)
                .map(ModuleSpecifier::from)
                .map_err(|_| JsErrorBox::generic("Failed to convert file path to URL").into());
        }

        current_dir = parent;
    }

    Err(ModuleLoaderError::from(JsErrorBox::generic(
        "Module not found in node_modules",
    )))
}
