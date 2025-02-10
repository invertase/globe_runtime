use std::sync::OnceLock;

use tokio::runtime::{self, Runtime};

static RUNTIME: OnceLock<Runtime> = OnceLock::new();

pub fn tokio_runtime() -> &'static Runtime {
    RUNTIME.get_or_init(|| {
        runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("Failed to create Tokio runtime")
    })
}
