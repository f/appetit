use tauri::WebviewUrl;
use tauri::WebviewWindowBuilder;

const INJECT_CSS_JS: &str = r##"
(function() {
  var css = "body, body * { -webkit-user-select: none !important; user-select: none !important; } " +
    "input, textarea, [contenteditable=\"true\"] { -webkit-user-select: text !important; user-select: text !important; } " +
    ".sidebar-brand { display: none !important; } " +
    ".sidebar-header { padding-top: 48px !important; } " +
    ".sidebar { -webkit-app-region: drag; } " +
    ".sidebar a, .sidebar button, .sidebar input, .sidebar select, .sidebar textarea, .sidebar .nav-item, .sidebar .theme-toggle, .sidebar .about-btn { -webkit-app-region: no-drag; }";

  function injectStyle() {
    if (document.head) {
      var s = document.createElement("style");
      s.textContent = css;
      document.head.appendChild(s);
      return true;
    }
    return false;
  }
  if (!injectStyle()) {
    document.addEventListener("DOMContentLoaded", injectStyle);
    new MutationObserver(function(_, obs) {
      if (injectStyle()) obs.disconnect();
    }).observe(document.documentElement, { childList: true });
  }


  var _origOpen = window.open;
  window.open = function(url, target) {
    if (url) {
      try {
        var u = new URL(url, window.location.href);
        var host = u.hostname;
        if (host !== "wvw.dev" && host !== "www.wvw.dev") {
          window.location.href = u.href;
          return null;
        }
      } catch(e) {}
    }
    return _origOpen.apply(this, arguments);
  };

  document.addEventListener("click", function(e) {
    var brand = e.target.closest(".sidebar-brand a, .wvw-badge");
    if (brand) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var a = e.target.closest('a[target="_blank"]');
    if (a && a.href) {
      try {
        var u = new URL(a.href, window.location.href);
        var host = u.hostname;
        if (host !== "wvw.dev" && host !== "www.wvw.dev") {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = u.href;
        }
      } catch(e2) {}
    }
  }, true);
})();
"##;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let url = "https://wvw.dev".parse().unwrap();
            let handle = app.handle().clone();

            let mut builder =
                WebviewWindowBuilder::new(&handle, "main", WebviewUrl::External(url))
                    .title("WVW")
                    .inner_size(1200.0, 800.0)
                    .min_inner_size(901.0, 500.0)
                    .resizable(true)
                    .decorations(true)
                    .title_bar_style(tauri::TitleBarStyle::Overlay)
                    .hidden_title(true)
                    .initialization_script(INJECT_CSS_JS)
                    .on_navigation(|nav_url| {
                        let host = nav_url.host_str().unwrap_or("");
                        if host == "wvw.dev" || host == "www.wvw.dev" {
                            return true;
                        }
                        let url_str = nav_url.to_string();
                        std::thread::spawn(move || {
                            #[cfg(target_os = "macos")]
                            {
                                let _ = std::process::Command::new("open")
                                    .arg(&url_str)
                                    .spawn();
                            }
                            #[cfg(target_os = "windows")]
                            {
                                let _ = std::process::Command::new("cmd")
                                    .args(["/C", "start", &url_str])
                                    .spawn();
                            }
                            #[cfg(target_os = "linux")]
                            {
                                let _ = std::process::Command::new("xdg-open")
                                    .arg(&url_str)
                                    .spawn();
                            }
                        });
                        false
                    });

            #[cfg(target_os = "macos")]
            {
                builder = builder.traffic_light_position(
                    tauri::LogicalPosition::new(16.0, 18.0),
                );
            }

            builder.build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
