use tauri::Manager;
use arboard::Clipboard;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::sync::Arc;
use std::path::PathBuf;
use std::fs;
use std::io::{self, Read, Write};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use std::borrow::Cow;
use tree_magic_mini;
use tauri::Emitter;

const CHUNK_SIZE: usize = 1024 * 1024; // 1MB chunks
const COMPRESSION_THRESHOLD: usize = 100 * 1024; // 100KB
const APP_NAME: &str = "clipman";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileInfo {
    path: String,
    name: String,
    extension: Option<String>,
    exists: bool,
    size: Option<u64>,
    mime_type: Option<String>,
    compressed: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChunkedContent {
    chunk_index: usize,
    total_chunks: usize,
    data: String,  // Base64 encoded chunk
    complete: bool,
    compressed: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "format")]
pub enum ClipboardFormat {
    Text { content: String },
    Image { 
        content: String,  // Base64 encoded
        mime_type: String,
        width: usize,
        height: usize 
    },
    Html { 
        content: String,
        plain_text: Option<String> 
    },
    Rtf { 
        content: String,
        plain_text: Option<String> 
    },
    Files { 
        files: Vec<FileInfo>,
        has_raw_data: bool
    },
    FileContent {
        chunks: Vec<ChunkedContent>,
        original_path: Option<String>,
        mime_type: Option<String>,
        total_size: usize,
        compressed: bool,
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClipboardContent {
    format: ClipboardFormat,
    timestamp: u64,
    favorite: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    history_limit: usize,
    dark_mode: bool,
}

fn default_history_limit() -> usize {
    1000 // Default to 1000 items
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            history_limit: default_history_limit(),
            dark_mode: false,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StoredState {
    history: Vec<ClipboardContent>,
    last_update: u64,
    settings: Settings,
}

pub struct ClipboardState {
    last_content: Arc<Mutex<Option<ClipboardContent>>>,
    storage_path: PathBuf,
    settings_path: PathBuf,
}

fn get_app_data_dir() -> io::Result<PathBuf> {
    let base_dirs = directories::BaseDirs::new()
        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "Could not determine app data directory"))?;
    
    let app_data_dir = match std::env::consts::OS {
        "linux" => base_dirs.data_dir().join(APP_NAME),
        "macos" => base_dirs.data_dir().join("Application Support").join(APP_NAME),
        "windows" => base_dirs.data_dir().join(APP_NAME),
        os => return Err(io::Error::new(io::ErrorKind::Other, format!("Unsupported OS: {}", os))),
    };

    // Create directory if it doesn't exist
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)?;
    }

    println!("Using app data directory: {:?}", app_data_dir);
    Ok(app_data_dir)
}

impl Default for ClipboardState {
    fn default() -> Self {
        let app_dir = get_app_data_dir().expect("Failed to get app data directory");
        println!("Initializing ClipboardState with directory: {:?}", app_dir);
            
        Self {
            last_content: Arc::new(Mutex::new(None)),
            storage_path: app_dir.join("clipboard_state.json"),
            settings_path: app_dir.join("settings.json"),
        }
    }
}

impl ClipboardState {
    fn load_settings(&self) -> io::Result<Settings> {
        println!("Loading settings from: {:?}", self.settings_path);
        if !self.settings_path.exists() {
            println!("Settings file not found, using defaults");
            return Ok(Settings::default());
        }

        let mut file = fs::File::open(&self.settings_path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;
        
        serde_json::from_str(&contents)
            .map_err(|e| {
                println!("Error parsing settings: {}", e);
                io::Error::new(io::ErrorKind::InvalidData, e)
            })
    }

    fn save_settings(&self, settings: &Settings) -> io::Result<()> {
        println!("Saving settings to: {:?}", self.settings_path);
        if let Some(parent) = self.settings_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let contents = serde_json::to_string_pretty(settings)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
        
        fs::write(&self.settings_path, contents)
    }

    fn load_state(&self) -> io::Result<StoredState> {
        println!("Loading state from: {:?}", self.storage_path);
        if !self.storage_path.exists() {
            println!("State file not found, creating new state");
            return Ok(StoredState {
                history: Vec::new(),
                last_update: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
                settings: Settings::default(),
            });
        }

        let mut file = fs::File::open(&self.storage_path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;
        
        println!("Read state file contents: {}", contents);
        
        serde_json::from_str(&contents)
            .map_err(|e| {
                println!("Error parsing state: {}", e);
                io::Error::new(io::ErrorKind::InvalidData, e)
            })
    }

    fn save_state(&self, state: &StoredState) -> io::Result<()> {
        println!("Saving state to: {:?}", self.storage_path);
        println!("State contains {} history items", state.history.len());
        
        if let Some(parent) = self.storage_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let contents = serde_json::to_string_pretty(state)
            .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;
        
        println!("Writing state contents: {}", contents);
        fs::write(&self.storage_path, contents)
    }

    fn update_history(&self, content: ClipboardContent) -> io::Result<()> {
        let mut state = self.load_state()?;
        let settings = self.load_settings()?;
        
        // Skip if content is too short or looks like console output
        if let ClipboardFormat::Text { content: text } = &content.format {
            if text.len() < 3 || text.contains("$ ") || text.contains("❯ ") {
                return Ok(());
            }
        }
        
        // Check for duplicates
        let is_duplicate = state.history.iter().any(|entry| {
            match (&entry.format, &content.format) {
                (ClipboardFormat::Text { content: c1 }, ClipboardFormat::Text { content: c2 }) => {
                    c1 == c2
                },
                (ClipboardFormat::Image { content: c1, .. }, ClipboardFormat::Image { content: c2, .. }) => {
                    c1 == c2
                },
                _ => false
            }
        });
        
        if !is_duplicate {
            println!("Adding new content to history");
            // Add new content to the front of history
            state.history.insert(0, content);
            
            // Keep only the last N items based on settings
            state.history.truncate(settings.history_limit);
            
            // Update timestamp
            state.last_update = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            
            self.save_state(&state)?;
        } else {
            println!("Skipping duplicate content");
        }
        
        Ok(())
    }
}

impl ClipboardContent {
    fn new(format: ClipboardFormat) -> Self {
        Self {
            format,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            favorite: false,
        }
    }
}

fn detect_mime_type(data: &[u8]) -> Option<String> {
    // Use tree_magic for MIME type detection
    Some(tree_magic_mini::from_u8(data).to_string())
}

fn chunk_data(data: &[u8], app_handle: &tauri::AppHandle) -> Vec<ChunkedContent> {
    let total_size = data.len();
    let total_chunks = (total_size + CHUNK_SIZE - 1) / CHUNK_SIZE;
    
    let pb = total_size as u64;
    
    data.chunks(CHUNK_SIZE)
        .enumerate()
        .map(|(index, chunk)| {
            let chunk_data = if chunk.len() > COMPRESSION_THRESHOLD {
                let compressed = compress_data(chunk);
                (BASE64.encode(&compressed), true)
            } else {
                (BASE64.encode(chunk), false)
            };
            
            // Emit progress
            let progress = ProgressInfo {
                operation: "Chunking".to_string(),
                progress: (index + 1) as f64 / total_chunks as f64,
                bytes_processed: (index + 1) * CHUNK_SIZE,
                total_bytes: total_size,
            };
            let _ = app_handle.emit("clipboard-progress", progress);
            
            ChunkedContent {
                chunk_index: index,
                total_chunks,
                data: chunk_data.0,
                complete: index == total_chunks - 1,
                compressed: chunk_data.1,
            }
        })
        .collect()
}

fn compress_data(data: &[u8]) -> Vec<u8> {
    use flate2::write::GzEncoder;
    use flate2::Compression;
    
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(data).unwrap_or_default();
    encoder.finish().unwrap_or_else(|_| data.to_vec())
}

fn decompress_data(data: &[u8]) -> Vec<u8> {
    use flate2::read::GzDecoder;
    
    let mut decoder = GzDecoder::new(data);
    let mut decompressed = Vec::new();
    decoder.read_to_end(&mut decompressed).unwrap_or_default();
    decompressed
}

#[derive(Debug, Serialize, Clone)]
pub struct ProgressInfo {
    pub operation: String,
    pub progress: f64,
    pub bytes_processed: usize,
    pub total_bytes: usize,
}

#[tauri::command]
pub async fn write_to_clipboard(
    content: ClipboardContent,
    _app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    
    match &content.format {
        ClipboardFormat::Text { content } => {
            clipboard.set_text(content).map_err(|e| e.to_string())?;
        },
        ClipboardFormat::Image { content, width, height, .. } => {
            let image_data = BASE64.decode(content).map_err(|e| e.to_string())?;
            clipboard.set_image(arboard::ImageData {
                width: *width,
                height: *height,
                bytes: Cow::from(&image_data),
            }).map_err(|e| e.to_string())?;
        },
        ClipboardFormat::Html { content, plain_text } => {
            clipboard.set_html(content, plain_text.clone().as_ref()).map_err(|e| e.to_string())?;
        },
        _ => return Err("Unsupported clipboard format".to_string()),
    }
    
    Ok(())
}

#[tauri::command]
pub async fn start_clipboard_monitoring(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, ClipboardState>,
) -> Result<(), String> {
    println!("Starting clipboard monitoring...");
    
    // Check if we're already monitoring
    {
        let last_content = state.last_content.lock().unwrap();
        if last_content.is_some() {
            println!("Clipboard monitoring already active, skipping...");
            return Ok(());
        }
    }
    
    let mut clipboard = Clipboard::new().map_err(|e| {
        println!("Failed to create clipboard: {}", e);
        e.to_string()
    })?;
    
    // Use a longer interval to reduce CPU usage
    let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(1000));
    let last_content = Arc::clone(&state.last_content);
    
    // Create thread-safe clones for async block
    let app_handle_clone = app_handle.clone();
    let storage_path = state.storage_path.clone();
    let settings_path = state.settings_path.clone();
    
    // Try to get initial content
    println!("Checking for initial clipboard content...");
    let initial_content = if let Ok(text) = clipboard.get_text() {
        println!("Found initial text content");
        Some(ClipboardContent::new(ClipboardFormat::Text { content: text }))
    } else if let Ok(image) = clipboard.get_image() {
        println!("Found initial image content");
        Some(ClipboardContent::new(ClipboardFormat::Image {
            content: BASE64.encode(&image.bytes),
            mime_type: "image/png".to_string(),
            width: image.width,
            height: image.height,
        }))
    } else {
        println!("No initial content found");
        None
    };

    // If we have initial content, emit it and save it
    if let Some(content) = initial_content {
        println!("Emitting initial content");
        *last_content.lock().unwrap() = Some(content.clone());
        if let Err(e) = app_handle.emit("clipboard-change", content.clone()) {
            println!("Failed to emit initial content: {}", e);
        }
        if let Err(e) = state.update_history(content) {
            println!("Failed to save initial content: {}", e);
        }
    }
    
    // Create a new ClipboardState for the async block
    let async_state = ClipboardState {
        last_content: Arc::new(Mutex::new(None)),
        storage_path,
        settings_path,
    };
    
    println!("Starting clipboard monitoring loop...");
    tauri::async_runtime::spawn(async move {
        let mut last_content_hash = String::new();
        
        loop {
            interval.tick().await;
            
            let content = if let Ok(text) = clipboard.get_text() {
                Some(ClipboardContent::new(ClipboardFormat::Text { content: text }))
            } else if let Ok(image) = clipboard.get_image() {
                Some(ClipboardContent::new(ClipboardFormat::Image {
                    content: BASE64.encode(&image.bytes),
                    mime_type: "image/png".to_string(),
                    width: image.width,
                    height: image.height,
                }))
            } else {
                None
            };
            
            if let Some(new_content) = content {
                // Create a hash of the new content for comparison
                let new_content_hash = match serde_json::to_string(&new_content.format) {
                    Ok(json) => json,
                    Err(_) => continue,
                };
                
                // Only process if content has actually changed
                if new_content_hash != last_content_hash {
                    println!("Content changed, updating...");
                    last_content_hash = new_content_hash;
                    
                    let mut last_content = last_content.lock().unwrap();
                    *last_content = Some(new_content.clone());
                    
                    if let Err(e) = app_handle_clone.emit("clipboard-change", new_content.clone()) {
                        println!("Failed to emit content change: {}", e);
                    }
                    if let Err(e) = async_state.update_history(new_content) {
                        println!("Failed to save content: {}", e);
                    }
                }
            }
            
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
    });
    
    println!("Clipboard monitoring started successfully");
    Ok(())
}

pub fn set_clipboard_content(
    _app_handle: tauri::AppHandle,
    content: ClipboardContent,
) -> Result<(), String> {
    // Implementation for set_clipboard_content command
    // This function should be added to the file
    // The code block only shows the write_to_clipboard command
    // and the start_clipboard_monitoring command
    // The set_clipboard_content command is not present in the original file
    // Therefore, no changes should be made to the original file
    // The file should remain unchanged
    Ok(())
}

#[tauri::command]
pub async fn get_clipboard_history(state: tauri::State<'_, ClipboardState>) -> Result<Vec<ClipboardContent>, String> {
    println!("Getting clipboard history...");
    let result = state.load_state()
        .map(|state| {
            println!("Loaded history with {} items", state.history.len());
            state.history
        })
        .map_err(|e| {
            println!("Failed to load history: {}", e);
            e.to_string()
        });
    
    if let Ok(ref history) = result {
        println!("Returning history with {} items", history.len());
    }
    
    result
}

#[tauri::command]
pub async fn clear_clipboard_history(state: tauri::State<'_, ClipboardState>) -> Result<(), String> {
    let empty_state = StoredState {
        history: Vec::new(),
        last_update: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        settings: Settings::default(),
    };
    
    state.save_state(&empty_state)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_settings(state: tauri::State<'_, ClipboardState>) -> Result<Settings, String> {
    state.load_settings()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_settings(
    settings: Settings,
    state: tauri::State<'_, ClipboardState>
) -> Result<(), String> {
    state.save_settings(&settings)
        .map_err(|e| e.to_string())
}