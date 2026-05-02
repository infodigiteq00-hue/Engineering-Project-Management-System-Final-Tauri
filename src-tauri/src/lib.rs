use tauri::{image::Image, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // Taskbar / window chrome in dev: bundle icons apply to packaged builds; set explicitly for local runs.
      if let Ok(icon) = Image::from_bytes(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/icons/32x32.png"
      ))) {
        if let Some(w) = app.get_webview_window("main") {
          let _ = w.set_icon(icon);
        }
      }
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
