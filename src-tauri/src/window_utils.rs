use tauri::{AppHandle, Manager};

pub fn show_main_window(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

pub fn toggle_main_window(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let minimized = w.is_minimized().unwrap_or(false);
        let visible = w.is_visible().unwrap_or(false);
        if minimized {
            let _ = w.unminimize();
            let _ = w.show();
            let _ = w.set_focus();
            return;
        }
        if visible {
            let _ = w.hide();
            return;
        }
        let _ = w.show();
        let _ = w.set_focus();
    }
}
