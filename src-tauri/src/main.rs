// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod clipboard;

use clipboard::{
    ClipboardState,
    start_clipboard_monitoring,
    get_clipboard_history,
    clear_clipboard_history,
    get_settings,
    update_settings,
};

fn main() {
    tauri::Builder::default()
        .manage(ClipboardState::default())
        .invoke_handler(tauri::generate_handler![
            start_clipboard_monitoring,
            get_clipboard_history,
            clear_clipboard_history,
            get_settings,
            update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// fn main() {
//     clipman_lib::run()
// }
