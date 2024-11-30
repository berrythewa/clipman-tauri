use tauri::Emitter;
use arboard::Clipboard;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClipboardContent {
    content: String,
    content_type: String,
}

pub struct ClipboardState {
    last_content: Arc<Mutex<Option<String>>>,
}

impl Default for ClipboardState {
    fn default() -> Self {
        Self {
            last_content: Arc::new(Mutex::new(None)),
        }
    }
}

#[tauri::command]
pub async fn start_clipboard_monitoring(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, ClipboardState>,
) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    
    let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(500));
    
    let last_content = Arc::clone(&state.last_content);
    
    tauri::async_runtime::spawn(async move {
        loop {
            interval.tick().await;
            
            // Try to get text content
            let content = match clipboard.get_text() {
                Ok(text) if !text.is_empty() => Some(ClipboardContent {
                    content: text,
                    content_type: "text".to_string(),
                }),
                _ => None, // Handle empty or error cases gracefully
            };
            
            if let Some(new_content) = content {
                let mut last_content = last_content.lock().unwrap();
                
                // Only emit if content has changed and is not empty
                if last_content.as_ref() != Some(&new_content.content) {
                    *last_content = Some(new_content.content.clone());
                    
                    app_handle.emit_to("main", "clipboard-change", new_content)
                        .unwrap_or_else(|e| eprintln!("Failed to emit clipboard event: {}", e));
                }
            }
            
            // Add a small delay to prevent high CPU usage
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
    });
    
    Ok(())
}