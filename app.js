(function () {
  var saved = localStorage.getItem("theme");
  if (!saved) saved = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", saved);
})();

(function () {
  "use strict";

  let data = null;
  let currentView = "discover";
  let currentApp = null;

  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeUrl(url) {
    if (typeof url !== "string") return "#";
    const trimmed = url.trim();
    if (!trimmed) return "#";
    try {
      const parsed = new URL(trimmed);
      const protocol = parsed.protocol.toLowerCase();
      if (protocol === "http:" || protocol === "https:") return parsed.href;
    } catch (e) {
      // invalid URL
    }
    return "#";
  }

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const icons = {
    discover: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    macos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    web: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    "developer-tools": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    cli: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    games: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="3"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="4" y1="12" x2="8" y2="12"/><circle cx="16" cy="10" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></svg>`,
    productivity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
    github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`,
  };

  const cardGradientsDark = [
    ["#1a1a2e", "#16213e", "#0f3460"],
    ["#1a1a1a", "#2d132c", "#3a1c3f"],
    ["#0d1117", "#161b22", "#1a2332"],
    ["#1a1a2e", "#0a3d62", "#1e5f74"],
    ["#1a0a2e", "#2b1055", "#3c1053"],
    ["#0a2e1a", "#0b4228", "#165a3a"],
  ];

  const cardGradientsLight = [
    ["#d4e4f7", "#c5d8f0", "#a8c4e0"],
    ["#e8daf0", "#dcc8e8", "#ccb0dc"],
    ["#d6e2ef", "#c8d8e8", "#b8cade"],
    ["#d0e8ee", "#b8dce6", "#a0d0dc"],
    ["#ddd4f0", "#cec0e8", "#baa8dc"],
    ["#d0ead8", "#b8dcc4", "#a0d0b0"],
  ];

  function getCardGradients() {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? cardGradientsLight
      : cardGradientsDark;
  }

  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function iconStyle(app) {
    const s = app.iconStyle || {};
    const parts = [];
    if (s.scale) parts.push(`transform:scale(${s.scale})`);
    if (s.objectFit) parts.push(`object-fit:${s.objectFit}`);
    if (s.padding) parts.push(`padding:${s.padding}`);
    return parts.join(";");
  }

  function iconContainerStyle(app) {
    const s = app.iconStyle || {};
    const parts = [];
    if (s.bgColor) parts.push(`background:${s.bgColor}`);
    if (s.borderRadius) parts.push(`border-radius:${s.borderRadius}`);
    return parts.length ? ` style="${parts.join(";")}"` : "";
  }

  function renderIcon(app) {
    if (app.icon) {
      const imgSt = iconStyle(app);
      const st = imgSt ? ` style="${imgSt}"` : "";
      return `<img src="${app.icon}" alt="${app.name}"${st} onerror="this.parentElement.innerHTML='${app.iconEmoji || "📦"}'">`;
    }
    return app.iconEmoji || "📦";
  }

  function starBadge(stars) {
    return `<span class="star-count"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>${formatNumber(stars)}</span>`;
  }

  function platformIcon(platform) {
    if (platform === "ios") {
      return `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`;
    }
    if (platform === "android") {
      return `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C14.15 1.23 13.1 1 12 1c-1.1 0-2.15.23-3.12.63L7.4.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C6.34 3.07 5 5.38 5 8h14c0-2.62-1.34-4.93-3.47-5.84zM10 6H9V5h1v1zm5 0h-1V5h1v1z"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
  }

  function isPaidApp(app) {
    return app.price && app.price !== "Free" && app.price !== "free";
  }

  function getBuyUrl(app) {
    return app.buyUrl || app.homepage || app.github;
  }

  function getButtonLabel(app) {
    if (isPaidApp(app)) return app.price;
    if (app.links && app.links.length > 0) return "Get";
    if (app.category && (app.category.includes("games") || app.category.includes("entertainment"))) return "Get";
    if (app.brew || app.downloadUrl || app.installCommand) return "Get";
    return "View";
  }

  function appRow(app) {
    return `
      <div class="app-row" data-app="${app.id}">
        <div class="app-icon"${iconContainerStyle(app)}>${renderIcon(app)}</div>
        <div class="app-info">
          <div class="app-name">${app.name}</div>
          <div class="app-subtitle">${app.subtitle}</div>
          <div class="app-meta">
            <span class="app-meta-tag">${app.platform}</span>
            ${app.stars ? starBadge(app.stars) : ""}
          </div>
        </div>
        <button class="get-btn${isPaidApp(app) ? " buy-btn" : ""}" data-action="get" data-app="${app.id}">${getButtonLabel(app)}</button>
      </div>`;
  }

  function appCard(app, index) {
    const grads = getCardGradients();
    const g = grads[index % grads.length];
    const hasScreenshot = app.screenshots && app.screenshots.length > 0;
    const screenshotImg = hasScreenshot
      ? `<img class="card-screenshot" src="${app.screenshots[0]}" alt="${app.name}" loading="lazy">`
      : "";
    return `
      <div class="card" data-app="${app.id}">
        <div class="card-image">
          <div class="card-image-bg" style="background:linear-gradient(135deg, ${g[0]}, ${g[1]}, ${g[2]})">
            ${screenshotImg}
            <div class="card-icon-fallback">${app.icon ? `<img src="${app.icon}" style="width:80px;height:80px;border-radius:18px;${iconStyle(app)}" onerror="this.outerHTML='📦'">` : (app.iconEmoji || "📦")}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-label">${app.platform === "macOS" ? "macOS APP" : app.platform === "Web" ? "WEB APP" : "TOOL"}</div>
          <div class="card-title">${app.name}</div>
          <div class="card-subtitle">${app.subtitle}</div>
        </div>
      </div>`;
  }

  // Sidebar
  function buildSidebar() {
    const nav = $("#sidebarNav");
    const items = [
      { id: "discover", name: "Discover", icon: icons.discover },
    ];

    let html = "";
    items.forEach((item) => {
      html += `<div class="nav-item${currentView === item.id ? " active" : ""}" data-view="${item.id}">
        <span class="nav-icon">${item.icon}</span>${item.name}
      </div>`;
    });

    html += `<div class="nav-separator"></div>`;
    html += `<div class="nav-section-label">Categories</div>`;

    const categories = [
      { id: "macos", name: "macOS Apps", icon: icons.macos },
      { id: "web", name: "Web Apps", icon: icons.web },
      { id: "developer-tools", name: "Developer Tools", icon: icons["developer-tools"] },
      { id: "cli", name: "CLI Apps", icon: icons.cli },
      { id: "productivity", name: "Productivity", icon: icons.productivity },
      { id: "games", name: "Games", icon: icons.games },
    ];

    categories.forEach((cat) => {
      html += `<div class="nav-item${currentView === cat.id ? " active" : ""}" data-view="${cat.id}">
        <span class="nav-icon">${cat.icon}</span>${cat.name}
      </div>`;
    });

    html += `<div class="nav-separator"></div>`;
    html += `<div class="nav-item" data-view="github">
      <span class="nav-icon">${icons.github}</span>GitHub
    </div>`;

    nav.innerHTML = html;
  }

  function renderFeaturedBanner(f) {
    const app = data.apps.find((a) => a.id === f.id);
    return `
      <div class="featured-banner" data-app="${f.id}">
        <div class="featured-content">
          <div class="featured-label">${f.headline}</div>
          <div class="featured-title">${f.title}</div>
          <div class="featured-subtitle">${f.subtitle}</div>
          ${app ? `
          <div class="featured-app-row">
            <div class="featured-app-icon"${iconContainerStyle(app)}>${renderIcon(app)}</div>
            <div class="featured-app-info">
              <div class="featured-app-name">${app.name}</div>
              <div class="featured-app-sub">${app.subtitle}</div>
            </div>
            <button class="featured-get-btn${isPaidApp(app) ? " buy-btn" : ""}" data-action="get" data-app="${app.id}">${getButtonLabel(app)}</button>
          </div>` : ""}
        </div>
      </div>`;
  }

  // Discover Page
  function renderDiscover() {
    const apps = data.apps;
    const featuredList = Array.isArray(data.featured) ? data.featured : [data.featured];

    const macosApps = apps.filter((a) => a.category.includes("macos"));
    const devApps = apps.filter((a) => a.category.includes("developer-tools"));
    const gameApps = apps.filter((a) => a.category.includes("games"));

    const dots = featuredList.length > 1
      ? `<div class="carousel-dots">${featuredList.map((_, i) => `<button class="carousel-dot${i === 0 ? " active" : ""}" data-slide="${i}"></button>`).join("")}</div>`
      : "";

    let html = `
      <div class="carousel">
        <div class="carousel-track">
          ${featuredList.map((f) => renderFeaturedBanner(f)).join("")}
        </div>
        ${dots}
      </div>

      <div class="section">
        <div class="section-header">
          <h2>Best New Apps and Updates</h2>
        </div>
        <div class="app-list">
          ${apps.slice(0, 6).map((a) => appRow(a)).join("")}
        </div>
      </div>

      ${(() => {
        const paidApps = apps.filter((a) => isPaidApp(a));
        if (paidApps.length === 0) return "";
        return `
      <div class="section">
        <div class="section-header">
          <h2>Best Paid Apps</h2>
        </div>
        <div class="app-list">
          ${paidApps.map((a) => appRow(a)).join("")}
        </div>
      </div>`;
      })()}

      <div class="section">
        <div class="section-header">
          <h2>The Latest Must-Try Apps</h2>
        </div>
        <div class="cards-grid">
          ${apps.slice(0, 4).map((a, i) => appCard(a, i)).join("")}
        </div>
      </div>

      ${macosApps.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <h2>macOS Apps</h2>
        </div>
        <div class="app-list">
          ${macosApps.map((a) => appRow(a)).join("")}
        </div>
      </div>` : ""}

      ${devApps.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <h2>Developer Tools</h2>
        </div>
        <div class="app-list">
          ${devApps.map((a) => appRow(a)).join("")}
        </div>
      </div>` : ""}

      ${gameApps.length > 0 ? `
      <div class="section">
        <div class="section-header">
          <h2>Games</h2>
        </div>
        <div class="app-list">
          ${gameApps.map((a) => appRow(a)).join("")}
        </div>
      </div>` : ""}
    `;

    return html;
  }

  // Category Page
  function renderCategory(categoryId) {
    const cat = data.categories.find((c) => c.id === categoryId);
    const apps = data.apps.filter((a) => a.category.includes(categoryId));

    if (apps.length === 0) {
      return `
        <div class="page-header"><h1>${cat ? cat.name : "Category"}</h1></div>
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>No apps yet</h3>
          <p>Check back later for new apps in this category.</p>
        </div>`;
    }

    return `
      <div class="page-header"><h1>${cat ? cat.name : "Category"}</h1></div>
      <div class="app-list">
        ${apps.map((a) => appRow(a)).join("")}
      </div>`;
  }

  // App Detail Page
  function renderAppDetail(appId) {
    const app = data.apps.find((a) => a.id === appId);
    if (!app) return `<div class="empty-state"><h3>App not found</h3></div>`;

    return `
      <div class="app-detail">
        <div class="back-btn" data-action="back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </div>

        <div class="app-detail-header">
          <div class="app-detail-icon"${iconContainerStyle(app)}>${renderIcon(app)}</div>
          <div class="app-detail-title-area">
            <div class="app-detail-title">${escapeHtml(app.name)}</div>
            <div class="app-detail-subtitle">${escapeHtml(app.subtitle)}</div>
            <div class="app-detail-actions">
              ${app.links && app.links.length > 0 && !isPaidApp(app) ? `
              <div class="get-dropdown-wrapper">
                <button class="app-detail-get-btn" data-action="get" data-app="${app.id}"
                  aria-expanded="false" aria-controls="get-dropdown-${app.id}">
                  ${getButtonLabel(app)}
                </button>
                <div class="get-dropdown" id="get-dropdown-${app.id}">
                  ${app.links.map(link => `
                  <a class="get-dropdown-item" href="${sanitizeUrl(link.url)}" target="_blank" rel="noopener">
                    <span class="get-dropdown-icon">${platformIcon(link.platform)}</span>
                    <span class="get-dropdown-label">${escapeHtml(link.label)}</span>
                    <span class="get-dropdown-arrow">›</span>
                  </a>`).join("")}
                </div>
              </div>` : `
              <button class="app-detail-get-btn${isPaidApp(app) ? " buy-btn" : ""}" data-action="get" data-app="${app.id}">
                ${getButtonLabel(app)}
              </button>`}
              <a href="${app.github}" target="_blank" rel="noopener" class="github-link">
                ${icons.github} View on GitHub
              </a>
            </div>
          </div>
        </div>

        <div class="app-detail-stats">
          ${app.stars !== undefined ? `<div class="stat"><div class="stat-value">${formatNumber(app.stars)}</div><div class="stat-label">Stars</div></div>` : ""}
          ${app.forks !== undefined ? `<div class="stat"><div class="stat-value">${formatNumber(app.forks)}</div><div class="stat-label">Forks</div></div>` : ""}
          <div class="stat"><div class="stat-value">${app.price}</div><div class="stat-label">Price</div></div>
          <div class="stat"><div class="stat-value">${app.platform}</div><div class="stat-label">Platform</div></div>
          <div class="stat"><div class="stat-value">${app.language}</div><div class="stat-label">Language</div></div>
        </div>

        ${app.screenshots && app.screenshots.length > 0 ? `
        <div class="detail-section">
          <h3>Preview</h3>
          <div class="screenshots-scroll">
            ${app.screenshots.map((s) => `<img class="screenshot-img" src="${s}" alt="${app.name} screenshot" loading="lazy">`).join("")}
          </div>
        </div>` : ""}

        <div class="detail-section">
          <h3>Description</h3>
          <p>${app.longDescription || app.description}</p>
        </div>

        ${app.features && app.features.length > 0 ? `
        <div class="detail-section">
          <h3>What's New</h3>
          <ul class="features-list">
            ${app.features.map((f) => `<li>${f}</li>`).join("")}
          </ul>
        </div>` : ""}

        ${app.brew ? `
        <div class="detail-section">
          <div class="brew-section">
            <div class="brew-section-title">Install with Homebrew</div>
            <div class="brew-command" data-copy="${app.brew}">
              <span class="prompt">$</span>
              <span class="cmd">${app.brew}</span>
              <span class="copy-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
            </div>
          </div>
        </div>` : ""}

        ${app.installCommand ? `
        <div class="detail-section">
          <div class="brew-section">
            <div class="brew-section-title">Quick Install</div>
            <div class="brew-command" data-copy="${app.installCommand}">
              <span class="prompt">$</span>
              <span class="cmd">${app.installCommand}</span>
              <span class="copy-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
            </div>
          </div>
        </div>` : ""}

        <div class="detail-section">
          <h3>Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Developer</span>
              <span class="info-value">${app.developer || data.store.developer}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Compatibility</span>
              <span class="info-value">${app.requirements}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Language</span>
              <span class="info-value">${app.language}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Price</span>
              <span class="info-value">${app.price}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Source Code</span>
              <span class="info-value"><a href="${app.github}" target="_blank" rel="noopener">${app.github.replace("https://github.com/", "")}</a></span>
            </div>
            ${app.homepage ? `
            <div class="info-item">
              <span class="info-label">Website</span>
              <span class="info-value"><a href="${app.homepage}" target="_blank" rel="noopener">${app.homepage.replace("https://", "")}</a></span>
            </div>` : ""}
          </div>
        </div>
      </div>`;
  }

  // Search results
  function renderSearch(query) {
    const q = query.toLowerCase();
    const results = data.apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.features && a.features.some((f) => f.toLowerCase().includes(q)))
    );

    if (results.length === 0) {
      return `
        <div class="page-header"><h1>Search: "${query}"</h1></div>
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No results</h3>
          <p>Try a different search term.</p>
        </div>`;
    }

    return `
      <div class="page-header"><h1>Search: "${query}"</h1></div>
      <div class="app-list">
        ${results.map((a) => appRow(a)).join("")}
      </div>`;
  }

  // Router
  let suppressHash = false;

  function buildHash(view, appId) {
    if (appId) return `#/${view}/${appId}`;
    if (view === "discover") return "#/";
    return `#/${view}`;
  }

  function parseHash() {
    const hash = location.hash.replace(/^#\/?/, "");
    if (!hash) return { view: "discover", appId: null };
    const parts = hash.split("/");
    if (parts.length >= 2) return { view: parts[0], appId: parts[1] };
    return { view: parts[0], appId: null };
  }

  function navigate(view, appId, fromHash) {
    if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
    const scroll = $("#contentScroll");
    scroll.scrollTop = 0;

    if (view === "github") {
      window.open(data.store.github, "_blank");
      return;
    }

    if (appId) {
      currentApp = appId;
      currentView = view;
      scroll.innerHTML = renderAppDetail(appId);
    } else if (view === "discover") {
      currentApp = null;
      currentView = view;
      scroll.innerHTML = renderDiscover();
    } else {
      currentApp = null;
      currentView = view;
      scroll.innerHTML = renderCategory(view);
    }

    if (!fromHash) {
      suppressHash = true;
      location.hash = buildHash(currentView, currentApp);
      suppressHash = false;
    }

    buildSidebar();
    bindEvents();
    updateMobileTopbar();
  }

  function onHashChange() {
    if (suppressHash) return;
    const { view, appId } = parseHash();
    navigate(view || "discover", appId || null, true);
  }

  // Modal
  function showBrewModal(app) {
    const overlay = $("#modalOverlay");
    const modal = $("#modal");
    const command = app.brew || app.installCommand;

    modal.innerHTML = `
      <button class="modal-close" data-action="close-modal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="modal-icon"${iconContainerStyle(app)}>${renderIcon(app)}</div>
      <h3>Install ${app.name}</h3>
      <p>${app.brew ? "Install via Homebrew with a single command. Make sure you have Homebrew installed on your Mac." : "Run this command to get started."}</p>
      <div class="modal-brew-command" data-copy="${command}">
        <span class="prompt">$</span>
        <span class="cmd">${command}</span>
        <span class="copy-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" data-action="copy-and-close" data-copy="${command}">Copy Command</button>
        ${app.downloadUrl ? `<a class="btn-secondary" href="${app.downloadUrl}" target="_blank" rel="noopener">${app.downloadUrl.endsWith(".dmg") || app.downloadUrl.includes(".dmg") ? "Download .dmg" : "Download"}</a>` : ""}
      </div>
      ${app.downloadUrl && (app.downloadUrl.endsWith(".dmg") || app.downloadUrl.includes(".dmg")) ? `
      <div style="margin-top:14px;font-size:12px;color:var(--text-tertiary);line-height:1.5">
        If macOS blocks the app on first launch, run:
        <div class="brew-command" style="margin-top:8px;font-size:12px;padding:8px 12px" data-copy="xattr -cr /Applications/${app.name}.app">
          <span class="prompt">$</span>
          <span class="cmd">xattr -cr /Applications/${app.name}.app</span>
          <span class="copy-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>
        </div>
      </div>` : ""}
    `;

    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("visible"));

    overlay.onclick = (e) => {
      if (e.target === overlay || e.target.closest("[data-action='close-modal']")) {
        closeModal();
      }
      if (e.target.closest("[data-copy]")) {
        const cmd = e.target.closest("[data-copy]").dataset.copy;
        copyToClipboard(cmd);
      }
      if (e.target.closest("[data-action='copy-and-close']")) {
        const cmd = e.target.closest("[data-action='copy-and-close']").dataset.copy;
        copyToClipboard(cmd);
        closeModal();
      }
    };
  }

  function showBuyModal(app) {
    const overlay = $("#modalOverlay");
    const modal = $("#modal");
    const url = getBuyUrl(app);
    const storeName = (data.store && data.store.name) || "This store";

    modal.innerHTML = `
      <button class="modal-close" data-action="close-modal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="modal-icon"${iconContainerStyle(app)}>${renderIcon(app)}</div>
      <h3>${app.name}</h3>
      <div class="buy-modal-price">${app.price}</div>
      <p>This is a paid app. You will be redirected to the developer's page to complete your purchase.</p>
      <div class="buy-modal-link">
        <a href="${url}" target="_blank" rel="noopener">${url}</a>
      </div>
      <div class="modal-actions">
        <a class="btn-primary buy-modal-btn" href="${url}" target="_blank" rel="noopener">Go to Purchase Page</a>
      </div>
      <div class="buy-modal-disclaimer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>${storeName} does not process payments or receive any commission from this purchase. All transactions occur directly on the developer's platform. Responsibility for the product, pricing, refunds, and support belongs entirely to the app owner.</span>
      </div>
    `;

    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("visible"));

    overlay.onclick = (e) => {
      if (e.target === overlay || e.target.closest("[data-action='close-modal']")) {
        closeModal();
      }
    };
  }

  function showLinksModal(app) {
    const overlay = $("#modalOverlay");
    const modal = $("#modal");

    function sanitizeIconContainerStyle(attrStr) {
      if (typeof attrStr !== "string") return "";
      const match = attrStr.match(/^\s*style=(["'])([\s\S]*)\1\s*$/i);
      if (!match) return "";
      const sanitized = match[2].replace(/["'<>]/g, "");
      return ` style="${sanitized}"`;
    }

    modal.innerHTML = `
      <button class="modal-close" data-action="close-modal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="modal-icon"${sanitizeIconContainerStyle(iconContainerStyle(app))}>${renderIcon(app)}</div>
      <h3>${escapeHtml(app.name)}</h3>
      <div class="modal-platform-links">
        ${app.links.map(link => `
        <a class="modal-platform-link" href="${sanitizeUrl(link.url)}" target="_blank" rel="noopener">
          <span class="modal-platform-icon">${platformIcon(link.platform)}</span>
          <span class="modal-platform-label">${escapeHtml(link.label)}</span>
          <span class="modal-platform-chevron">›</span>
        </a>`).join("")}
      </div>
    `;

    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("visible"));

    overlay.onclick = (e) => {
      if (e.target === overlay || e.target.closest("[data-action='close-modal']")) {
        closeModal();
      }
    };
  }

  function closeModal() {
    const overlay = $("#modalOverlay");
    overlay.classList.remove("visible");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast();
    });
  }

  function showToast() {
    const toast = $("#brewToast");
    toast.classList.add("visible");
    setTimeout(() => toast.classList.remove("visible"), 2000);
  }

  // Event binding
  function bindEvents() {
    $$("[data-app]").forEach((el) => {
      if (el.dataset.boundNav) return;
      el.dataset.boundNav = "1";
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-action='get']")) return;
        if (e.target.closest("a")) return;
        navigate(currentView, el.dataset.app);
      });
    });

    $$("[data-action='get']").forEach((btn) => {
      if (btn.dataset.boundGet) return;
      btn.dataset.boundGet = "1";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const appId = btn.dataset.app;
        const app = data.apps.find((a) => a.id === appId);
        if (!app) return;
        if (isPaidApp(app)) {
          showBuyModal(app);
        } else if (app.links && app.links.length > 0) {
          if (btn.classList.contains("app-detail-get-btn")) {
            const dropdown = document.getElementById(`get-dropdown-${app.id}`);
            if (dropdown) {
              const isOpen = dropdown.classList.contains("open");
              $$(".get-dropdown.open").forEach(d => {
                d.classList.remove("open");
                const prevBtn = d.previousElementSibling;
                if (prevBtn) prevBtn.setAttribute("aria-expanded", "false");
              });
              if (!isOpen) {
                dropdown.classList.add("open");
                btn.setAttribute("aria-expanded", "true");
              }
            }
          } else {
            showLinksModal(app);
          }
        } else if (app.brew || app.installCommand) {
          showBrewModal(app);
        } else if (app.homepage) {
          window.open(app.homepage, "_blank");
        } else {
          window.open(app.github, "_blank");
        }
      });
    });

    $$("[data-action='back']").forEach((btn) => {
      if (btn.dataset.boundBack) return;
      btn.dataset.boundBack = "1";
      btn.addEventListener("click", () => navigate(currentView));
    });

    $$("[data-copy]").forEach((el) => {
      if (el.dataset.boundCopy) return;
      el.dataset.boundCopy = "1";
      el.addEventListener("click", () => copyToClipboard(el.dataset.copy));
    });

    bindCarousel();
  }

  let carouselTimer = null;

  function bindCarousel() {
    const track = $(".carousel-track");
    if (!track) return;
    const slides = $$(".featured-banner", track);
    const dots = $$(".carousel-dot");
    if (slides.length <= 1) return;

    let current = 0;

    function goTo(i) {
      current = ((i % slides.length) + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, j) => d.classList.toggle("active", j === current));
    }

    dots.forEach((d) => {
      d.addEventListener("click", (e) => {
        e.stopPropagation();
        goTo(parseInt(d.dataset.slide, 10));
        resetAutoplay();
      });
    });

    function resetAutoplay() {
      clearInterval(carouselTimer);
      carouselTimer = setInterval(() => goTo(current + 1), 5000);
    }
    resetAutoplay();

    let touchStartX = 0;
    let touchDeltaX = 0;
    let dragging = false;

    track.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
      touchDeltaX = 0;
      dragging = true;
      track.style.transition = "none";
    }, { passive: true });

    track.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      touchDeltaX = e.touches[0].clientX - touchStartX;
      const offset = -(current * 100) + (touchDeltaX / track.offsetWidth) * 100;
      track.style.transform = `translateX(${offset}%)`;
    }, { passive: true });

    track.addEventListener("touchend", () => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
      if (touchDeltaX < -50) goTo(current + 1);
      else if (touchDeltaX > 50) goTo(current - 1);
      else goTo(current);
      resetAutoplay();
    });
  }

  // Sidebar click
  function bindSidebar() {
    $("#sidebarNav").addEventListener("click", (e) => {
      const item = e.target.closest(".nav-item");
      if (!item) return;
      navigate(item.dataset.view);
      $("#sidebar").classList.remove("open");
      $("#sidebarOverlay").classList.remove("open");
    });
  }

  // Search
  function bindSearch() {
    const input = $("#searchInput");
    let timeout;
    input.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const q = input.value.trim();
        if (q.length > 0) {
          const scroll = $("#contentScroll");
          scroll.scrollTop = 0;
          scroll.innerHTML = renderSearch(q);
          currentApp = null;
          $$(".nav-item").forEach((n) => n.classList.remove("active"));
          bindEvents();
        } else {
          navigate(currentView);
        }
      }, 250);
    });
  }

  // Keyboard shortcuts
  function bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        $$(".get-dropdown.open").forEach(d => {
          d.classList.remove("open");
          const prevBtn = d.previousElementSibling;
          if (prevBtn) prevBtn.setAttribute("aria-expanded", "false");
        });
        closeModal();
        if (currentApp) navigate(currentView);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        $("#searchInput").focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".get-dropdown-wrapper")) {
        $$(".get-dropdown.open").forEach(d => {
          d.classList.remove("open");
          const prevBtn = d.previousElementSibling;
          if (prevBtn) prevBtn.setAttribute("aria-expanded", "false");
        });
      }
    });
  }

  // Init
  async function init() {
    try {
      const cacheBust = Math.floor(Date.now() / 300000);
      const resp = await fetch("apps.json?v=" + cacheBust);
      data = await resp.json();
    } catch {
      $("#contentScroll").innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Failed to load apps</h3>
          <p>Could not fetch apps.json. Make sure the file exists.</p>
        </div>`;
      return;
    }

    buildSidebar();
    window.addEventListener("hashchange", onHashChange);
    const initial = parseHash();
    navigate(initial.view || "discover", initial.appId || null);
    bindSidebar();
    bindSearch();
    bindKeyboard();
    bindThemeToggle();
    bindMobileMenu();
  }

  function updateMobileTopbar() {
    const menuBtn = $("#mobileMenuBtn");
    const backBtn = $("#mobileBackBtn");
    if (!menuBtn || !backBtn) return;

    if (currentApp) {
      menuBtn.classList.add("hidden");
      backBtn.classList.remove("hidden");
    } else {
      menuBtn.classList.remove("hidden");
      backBtn.classList.add("hidden");
    }
  }

  function bindMobileMenu() {
    const menuBtn = $("#mobileMenuBtn");
    const backBtn = $("#mobileBackBtn");
    const sidebar = $("#sidebar");
    const overlay = $("#sidebarOverlay");
    const scroll = $("#contentScroll");
    if (!menuBtn || !sidebar || !overlay) return;

    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("open");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });

    backBtn.addEventListener("click", () => {
      navigate(currentView);
    });

    let lastScrollY = 0;
    let fadeTimer = null;
    scroll.addEventListener("scroll", () => {
      const y = scroll.scrollTop;
      if (y > lastScrollY && y > 60) {
        menuBtn.classList.add("faded");
        backBtn.classList.add("faded");
      } else {
        menuBtn.classList.remove("faded");
        backBtn.classList.remove("faded");
      }
      lastScrollY = y;
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => {
        menuBtn.classList.remove("faded");
        backBtn.classList.remove("faded");
      }, 1500);
    }, { passive: true });
  }

  function bindThemeToggle() {
    const btn = $("#themeToggle");
    const label = btn.querySelector(".theme-label");

    function updateLabel() {
      const current = document.documentElement.getAttribute("data-theme");
      label.textContent = current === "dark" ? "Light Mode" : "Dark Mode";
    }
    updateLabel();

    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      updateLabel();
      navigate(currentView, currentApp);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
