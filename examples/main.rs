use std::env;
use std::fs;

fn main() {
    // Get the JavaScript file path from command-line arguments.
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: {} <path_to_script.js>", args[0]);
        std::process::exit(1);
    }

    let script_path = &args[1];

    // Read the JavaScript file content.
    let script_content = match fs::read_to_string(script_path) {
        Ok(content) => content,
        Err(err) => {
            eprintln!("Failed to read file '{}': {}", script_path, err);
            std::process::exit(1);
        }
    };

    dart_v8_runtime::init_v8(|isolate| {
        // Execute the JavaScript script.
        dart_v8_runtime::execute_js(script_content, isolate);
    });
}
