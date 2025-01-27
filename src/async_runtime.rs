use std::sync::Once;
use tokio::runtime::Runtime;

static INIT: Once = Once::new();
static mut RUNTIME: Option<Runtime> = None;

pub fn get_runtime() -> &'static Runtime {
    unsafe {
        INIT.call_once(|| {
            let rt = Runtime::new().expect("Failed to create Tokio runtime");
            RUNTIME = Some(rt);
        });
        RUNTIME.as_ref().expect("Runtime is not initialized")
    }
}
