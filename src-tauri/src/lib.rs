// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::path::Path;
use tauri::Manager;

mod icon;
mod hotkey;
mod tray;
mod uwp;
mod window_utils;
mod paths;
mod storage;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn spawn_app(
    path: String,
    args: Vec<String>,
    content: Option<String>,
    run_as_admin: Option<bool>,
) -> Result<(), String> {
    let resolved_path = paths::resolve_launch_path(&path);
    let run_as_admin = run_as_admin.unwrap_or(false);
    if let Some(url) = resolved_path.strip_prefix("url:") {
        return open_url(url);
    }
    if let Some(_script_id) = resolved_path.strip_prefix("script:") {
        return run_script(content.as_deref().unwrap_or(""), run_as_admin);
    }
    if let Some(item_id) = resolved_path.strip_prefix("builtin:") {
        return spawn_builtin_item(item_id);
    }
    #[cfg(target_os = "windows")]
    if run_as_admin {
        let parameters = (!args.is_empty()).then(|| quote_windows_args(&args));
        return shell_execute_path(
            &resolved_path,
            Some("runas"),
            parameters.as_deref(),
        );
    }
    if args.is_empty() {
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("explorer")
                .arg(resolved_path)
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
        #[cfg(not(target_os = "windows"))]
        {
            std::process::Command::new(resolved_path)
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string())
        }
    } else {
        std::process::Command::new(resolved_path)
            .args(args)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn open_with_dialog(path: String) -> Result<(), String> {
    let resolved_path = paths::resolve_launch_path(&path);
    if paths::is_special_path(&resolved_path) {
        return Err("special path is not supported".to_string());
    }
    let p = Path::new(&resolved_path);
    if !p.exists() || p.is_dir() {
        return Err("file not found".to_string());
    }
    #[cfg(target_os = "windows")]
    {
        return shell_execute_path(&resolved_path, Some("openas"), None);
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("open with is only supported on Windows".to_string())
    }
}

#[tauri::command]
fn read_image_as_data_url(path: String) -> Result<String, String> {
    use base64::Engine;

    let resolved_path = paths::resolve_launch_path(&path);
    if paths::is_special_path(&resolved_path) {
        return Err("special path is not supported".to_string());
    }
    let image_path = Path::new(&resolved_path);
    if !image_path.exists() || !image_path.is_file() {
        return Err("file not found".to_string());
    }

    let ext = image_path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase())
        .unwrap_or_default();
    let mime = match ext.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        _ => return Err("unsupported image format".to_string()),
    };

    let bytes = std::fs::read(image_path).map_err(|e| e.to_string())?;
    Ok(format!(
        "data:{};base64,{}",
        mime,
        base64::engine::general_purpose::STANDARD.encode(bytes)
    ))
}

fn open_url(url: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(url)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = url;
        Err("URL launch is only supported on Windows".to_string())
    }
}

#[cfg(target_os = "windows")]
fn run_script(script: &str, run_as_admin: bool) -> Result<(), String> {
    if script.trim().is_empty() {
        return Err("script is empty".to_string());
    }
    use base64::Engine;

    let mut encoded_bytes = Vec::with_capacity(script.len() * 2);
    for unit in script.encode_utf16() {
        encoded_bytes.extend_from_slice(&unit.to_le_bytes());
    }
    let encoded = base64::engine::general_purpose::STANDARD.encode(encoded_bytes);
    let args = vec![
        "-NoLogo".to_string(),
        "-NoProfile".to_string(),
        "-ExecutionPolicy".to_string(),
        "Bypass".to_string(),
        "-EncodedCommand".to_string(),
        encoded,
    ];

    if run_as_admin {
        let parameters = quote_windows_args(&args);
        return shell_execute_path("powershell.exe", Some("runas"), Some(parameters.as_str()));
    }

    std::process::Command::new("powershell.exe")
        .args(args)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[cfg(not(target_os = "windows"))]
fn run_script(_script: &str, _run_as_admin: bool) -> Result<(), String> {
    Err("script is only supported on Windows".to_string())
}

#[cfg(target_os = "windows")]
fn spawn_builtin_item(item_id: &str) -> Result<(), String> {
    use windows::Win32::Foundation::{LPARAM, WPARAM};
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        keybd_event, KEYEVENTF_KEYUP, VK_MEDIA_NEXT_TRACK, VK_MEDIA_PLAY_PAUSE,
        VK_MEDIA_PREV_TRACK, VK_VOLUME_DOWN, VK_VOLUME_MUTE, VK_VOLUME_UP,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        SendMessageW, HWND_BROADCAST, SC_MONITORPOWER, WM_SYSCOMMAND,
    };

    let command = |program: &str, args: &[&str]| {
        std::process::Command::new(program)
            .args(args)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    };

    let send_virtual_key = |vk: u16| {
        unsafe {
            keybd_event(vk as u8, 0, Default::default(), 0);
            keybd_event(vk as u8, 0, KEYEVENTF_KEYUP, 0);
        }
        Ok(())
    };

    let turn_off_display = || {
        unsafe {
            let _ = SendMessageW(
                HWND_BROADCAST,
                WM_SYSCOMMAND,
                Some(WPARAM(SC_MONITORPOWER as usize)),
                Some(LPARAM(2)),
            );
        }
        Ok(())
    };

    match item_id {
        "show-desktop" => command("explorer.exe", &["shell:::{3080F90D-D7AD-11D9-BD98-0000947B0257}"]),
        "shutdown" => command("shutdown", &["/s", "/t", "0"]),
        "restart" => command("shutdown", &["/r", "/t", "0"]),
        "sleep" => command(
            "powershell.exe",
            &[
                "-NoLogo",
                "-NoProfile",
                "-Command",
                "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend',$false,$true)",
            ],
        ),
        "hibernate" => command("shutdown", &["/h"]),
        "signout" => command("shutdown", &["/l"]),
        "lock" => command("rundll32.exe", &["user32.dll,LockWorkStation"]),
        "turn-off-display" => turn_off_display(),
        "prevent-sleep" => command("PresentationSettings.exe", &["/start"]),
        "allow-sleep" => command("PresentationSettings.exe", &["/stop"]),
        "volume-up" => send_virtual_key(VK_VOLUME_UP.0),
        "volume-down" => send_virtual_key(VK_VOLUME_DOWN.0),
        "mute" => send_virtual_key(VK_VOLUME_MUTE.0),
        "media-prev" => send_virtual_key(VK_MEDIA_PREV_TRACK.0),
        "media-play-pause" => send_virtual_key(VK_MEDIA_PLAY_PAUSE.0),
        "media-next" => send_virtual_key(VK_MEDIA_NEXT_TRACK.0),
        "this-pc" => command("explorer.exe", &["shell:MyComputerFolder"]),
        "recycle-bin" => command("explorer.exe", &["shell:RecycleBinFolder"]),
        "control-panel" => command("control.exe", &[]),
        "god-mode" => command("explorer.exe", &["shell:::{ED7BA470-8E54-465E-825C-99712043E01C}"]),
        "system-config" => command("msconfig.exe", &[]),
        "env-vars" => command("rundll32.exe", &["sysdm.cpl,EditEnvironmentVariables"]),
        "network-connections" => command("control.exe", &["ncpa.cpl"]),
        "network" => command("explorer.exe", &["shell:NetworkPlacesFolder"]),
        "printers" => command("explorer.exe", &["shell:PrintersFolder"]),
        "startup-folder" => command("explorer.exe", &["shell:startup"]),
        "common-startup-folder" => command("explorer.exe", &["shell:common startup"]),
        "cmd" => command("cmd.exe", &[]),
        "powershell" => command("powershell.exe", &[]),
        "calculator" => command("calc.exe", &[]),
        "paint" => command("mspaint.exe", &[]),
        "notepad" => command("notepad.exe", &[]),
        "hosts" => command("notepad.exe", &[r"C:\Windows\System32\drivers\etc\hosts"]),
        "remote-desktop" => command("mstsc.exe", &[]),
        "volume-mixer" => command("SndVol.exe", &[]),
        "registry-editor" => command("regedit.exe", &[]),
        "group-policy" => command("mmc.exe", &["gpedit.msc"]),
        "services" => command("mmc.exe", &["services.msc"]),
        "task-scheduler" => command("mmc.exe", &["taskschd.msc"]),
        "resource-monitor" => command("resmon.exe", &[]),
        "device-manager" => command("mmc.exe", &["devmgmt.msc"]),
        "computer-management" => command("mmc.exe", &["compmgmt.msc"]),
        "event-viewer" => command("mmc.exe", &["eventvwr.msc"]),
        "user-certificates" => command("mmc.exe", &["certmgr.msc"]),
        "computer-certificates" => command("mmc.exe", &["certlm.msc"]),
        "programs-features" => command("control.exe", &["appwiz.cpl"]),
        "windows-features" => command("OptionalFeatures.exe", &[]),
        _ => Err(format!("unknown builtin item: {item_id}")),
    }
}

#[cfg(not(target_os = "windows"))]
fn spawn_builtin_item(_item_id: &str) -> Result<(), String> {
    Err("builtin item is only supported on Windows".to_string())
}

#[tauri::command]
fn open_app_folder(path: String) -> Result<(), String> {
    let mut raw = path.trim().to_string();
    if raw.starts_with('\"') && raw.ends_with('\"') && raw.len() >= 2 {
        raw = raw[1..raw.len() - 1].to_string();
    }
    if raw.starts_with('\'') && raw.ends_with('\'') && raw.len() >= 2 {
        raw = raw[1..raw.len() - 1].to_string();
    }
    if raw.trim().is_empty() {
        return Err("path is empty".to_string());
    }
    if paths::is_special_path(&raw) {
        return Err("path has no folder".to_string());
    }
    let resolved = paths::resolve_launch_path(&raw);
    let p = Path::new(&resolved);
    if p.exists() && p.is_dir() {
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("explorer")
                .arg(resolved)
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string())?;
            return Ok(());
        }
        #[cfg(not(target_os = "windows"))]
        {
            std::process::Command::new(resolved)
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    if p.exists() {
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("explorer")
                .arg("/select,")
                .arg(p.to_string_lossy().to_string())
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string())?;
            return Ok(());
        }
        #[cfg(not(target_os = "windows"))]
        {
            let parent = p.parent().unwrap_or(p);
            std::process::Command::new(parent.to_string_lossy().to_string())
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    if let Some(parent) = p.parent() {
        #[cfg(target_os = "windows")]
        {
            let arg = parent.to_string_lossy().to_string();
            std::process::Command::new("explorer")
                .arg(arg)
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string())?;
            return Ok(());
        }
        #[cfg(not(target_os = "windows"))]
        {
            std::process::Command::new(parent.to_string_lossy().to_string())
                .spawn()
                .map(|_| ())
                .map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    Err("parent folder not found".to_string())
}

#[tauri::command]
fn set_toggle_hotkey(
    app: tauri::AppHandle,
    hotkey_state: tauri::State<'_, hotkey::HotkeyState>,
    hotkey: String,
) -> Result<(), String> {
    hotkey::apply_hotkey(&app, &hotkey_state, hotkey)
}

#[cfg(target_os = "windows")]
fn quote_windows_arg(arg: &str) -> String {
    if !arg.is_empty() && !arg.chars().any(|ch| ch == ' ' || ch == '\t' || ch == '"') {
        return arg.to_string();
    }

    let mut quoted = String::from("\"");
    let mut backslashes = 0usize;
    for ch in arg.chars() {
        match ch {
            '\\' => backslashes += 1,
            '"' => {
                quoted.push_str(&"\\".repeat(backslashes * 2 + 1));
                quoted.push('"');
                backslashes = 0;
            }
            _ => {
                if backslashes > 0 {
                    quoted.push_str(&"\\".repeat(backslashes));
                    backslashes = 0;
                }
                quoted.push(ch);
            }
        }
    }
    if backslashes > 0 {
        quoted.push_str(&"\\".repeat(backslashes * 2));
    }
    quoted.push('"');
    quoted
}

#[cfg(target_os = "windows")]
fn quote_windows_args(args: &[String]) -> String {
    args.iter()
        .map(|arg| quote_windows_arg(arg))
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(target_os = "windows")]
fn shell_execute_path(path: &str, verb: Option<&str>, parameters: Option<&str>) -> Result<(), String> {
    use windows::core::PCWSTR;
    use windows::Win32::UI::Shell::ShellExecuteW;
    use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

    fn wide(value: &str) -> Vec<u16> {
        value.encode_utf16().chain(std::iter::once(0)).collect()
    }

    let file_w = wide(path);
    let verb_w = verb.map(wide);
    let parameters_w = parameters.map(wide);

    let result = unsafe {
        ShellExecuteW(
            None,
            PCWSTR(verb_w.as_ref().map_or(std::ptr::null(), |v| v.as_ptr())),
            PCWSTR(file_w.as_ptr()),
            PCWSTR(parameters_w.as_ref().map_or(std::ptr::null(), |v| v.as_ptr())),
            PCWSTR::null(),
            SW_SHOWNORMAL,
        )
    };

    if result.0 as isize <= 32 {
        return Err(format!("ShellExecuteW failed: {}", result.0 as isize));
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(
        |app, _args, _cwd| {
            window_utils::show_main_window(app);
        },
    ));

    #[cfg(not(desktop))]
    let builder = builder;

    builder
        .setup(|app| {
            #[cfg(desktop)]
            {
                tray::setup_tray(&app.handle())?;
                app.manage(hotkey::HotkeyState(std::sync::Mutex::new(None)));
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(|app, _shortcut, event| {
                            hotkey::handle_shortcut_event(app, event.state);
                        })
                        .build(),
                )?;

                let saved = storage::load_saved_hotkey(&app.handle());
                if let Some(state) = app.try_state::<hotkey::HotkeyState>() {
                    hotkey::init_from_saved_hotkey(&app.handle(), &state, saved);
                }
            }
            if storage::should_hide_on_startup(&app.handle()) {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.hide();
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .invoke_handler(tauri::generate_handler![
            greet,
            spawn_app,
            uwp::list_uwp_apps,
            uwp::spawn_uwp_app,
            icon::get_file_icon,
            set_toggle_hotkey,
            paths::make_relative_path,
            open_with_dialog,
            read_image_as_data_url,
            open_app_folder,
            storage::load_launcher_state,
            storage::save_launcher_state,
            paths::validate_paths
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
