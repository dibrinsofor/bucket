(() => {
  const SIDEBAR_ID = "type-bucket-sidebar";

  // Toggle sidebar
  const existing = document.getElementById(SIDEBAR_ID);
  if (existing) {
    existing.remove();
    document.body.style.marginLeft = "";
    return;
  }

  // Create sidebar container
  const sidebar = document.createElement("div");
  sidebar.id = SIDEBAR_ID;

  // Create shadow DOM to isolate styles
  const shadow = sidebar.attachShadow({ mode: "open" });

  // Inject styles
  const styles = document.createElement("style");
  styles.textContent = `
    :host {
      all: initial;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 335px;
      height: 100vh;
      background: #fff;
      border-right: 1px solid #ddd;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 8px rgba(0,0,0,0.1);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #eee;
      background: #fafafa;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header h1 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .trash-btn {
      background: none;
      border: 1px solid #cc0000;
      border-radius: 4px;
      cursor: pointer;
      color: #cc0000;
      padding: 4px 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .trash-btn:hover {
      background: rgba(204, 0, 0, 0.1);
    }

    .trash-btn svg {
      width: 16px;
      height: 16px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      line-height: 1;
      padding: 4px;
    }

    .close-btn:hover {
      color: #000;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .entry {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 14px;
      position: relative;
      break-inside: avoid;
      overflow: hidden;
      min-width: 0;
    }

    .entry-text {
      font-size: 14px !important;
      line-height: 1.4 !important;
      color: #333;
      word-break: break-word;
      margin-bottom: 12px;
      max-height: 100px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
    }

    .entry-font-info {
      font-size: 10px;
      color: #888;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #e5e5e5;
      line-height: 1.4;
    }

    .entry-font-info .font-line {
      color: #555;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .entry-font-info .font-details {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .entry-font-info .font-weight {
      color: #888;
    }

    .entry-font-info .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-left: 8px;
      box-shadow: 0 0 4px currentColor;
    }

    .entry-font-info .dot.system {
      background: #2a9d2a;
      color: #2a9d2a;
    }

    .entry-font-info .dot.proprietary {
      background: #cc0000;
      color: #cc0000;
    }

    .entry-meta {
      font-size: 10px;
      color: #888;
    }

    .entry-source {
      display: block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empty-state {
      color: #888;
      text-align: center;
      padding: 40px 20px;
      grid-column: 1 / -1;
    }

    .footer {
      padding: 12px 16px;
      border-top: 1px solid #eee;
      background: #fafafa;
    }

    .text-input {
      width: 100%;
      padding: 12px 20px;
      border: 1px solid #ddd;
      border-radius: 9999px;
      font-size: 13px;
      font-family: inherit;
    }

    .text-input:focus {
      outline: none;
      border-color: #666;
    }

    .hidden {
      display: none !important;
    }
  `;

  // Create HTML structure
  const container = document.createElement("div");
  container.className = "sidebar";
  container.innerHTML = `
    <div class="header">
      <div class="header-left">
        <h1>Type Bucket</h1>
      </div>
      <div class="header-right">
        <button class="trash-btn hidden" id="trash-btn" title="Clear All">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
        <button class="close-btn" title="Close">&times;</button>
      </div>
    </div>
    <div class="content">
      <div class="grid" id="entries"></div>
    </div>
    <div class="footer">
      <input type="text" class="text-input" id="text-input" placeholder="Type something instead">
    </div>
  `;

  shadow.appendChild(styles);
  shadow.appendChild(container);

  // Add to page
  document.body.appendChild(sidebar);
  document.body.style.marginLeft = "335px";

  // Get elements
  const entriesEl = shadow.getElementById("entries");
  const trashBtn = shadow.getElementById("trash-btn");
  const textInput = shadow.getElementById("text-input");
  const closeBtn = container.querySelector(".close-btn");

  // Track injected fonts to avoid duplicates
  const injectedFonts = new Set();

  // Inject embedded font as @font-face
  function injectFont(fontInfo, entryId) {
    if (!fontInfo?.fontData) return null;

    const fontName = `TypeBucket-${entryId}`;
    if (injectedFonts.has(fontName)) return fontName;

    const fontFace = `
      @font-face {
        font-family: "${fontName}";
        src: url(${fontInfo.fontData});
        font-weight: ${fontInfo.fontWeight || 'normal'};
        font-style: ${fontInfo.fontStyle || 'normal'};
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = fontFace;
    shadow.appendChild(styleEl);
    injectedFonts.add(fontName);

    console.log('[TypeBucket] Injected font:', fontName);
    return fontName;
  }

  // Normalize font info from old or new format
  function normalizeFontInfo(entry) {
    // New format
    if (entry.fontInfo) return entry.fontInfo;

    // Old format (just fontFamily string)
    if (entry.fontFamily) {
      return { fontFamily: entry.fontFamily };
    }

    return null;
  }

  // Normalize text - trim, collapse whitespace, limit length
  function normalizeText(text, maxLength = 200) {
    if (!text) return '';
    // Collapse all whitespace (including newlines) to single spaces, then trim
    let normalized = text.replace(/\s+/g, ' ').trim();
    // Limit length
    if (normalized.length > maxLength) {
      normalized = normalized.substring(0, maxLength) + '...';
    }
    return normalized;
  }

  // GREEN: has font data
  // RED: no font data
  function hasFontData(fontInfo) {
    return !!fontInfo?.fontData;
  }

  // Format font info for display
  function formatFontInfo(fontInfo) {
    if (!fontInfo) return '';

    const fontName = fontInfo.fontFamily?.split(',')[0]?.replace(/["']/g, '') || 'System';
    const weight = fontInfo.fontWeight || '400';
    const hasData = hasFontData(fontInfo);
    const dotClass = hasData ? 'system' : 'proprietary';

    return `
      <div class="entry-font-info">
        <div class="font-line">
          <span class="font-details">${escapeHtml(fontName)} <span class="font-weight">(${escapeHtml(weight)})</span></span>
          <span class="dot ${dotClass}"></span>
        </div>
      </div>
    `;
  }

  // Load entries
  function loadEntries() {
    chrome.runtime.sendMessage({ type: "GET_ENTRIES" }, (response) => {
      const entries = response?.entries || [];

      // DEBUG: Log current state
      console.log('[TypeBucket] Entries loaded:', entries.length);
      entries.forEach((entry, i) => {
        const fontInfo = entry.fontInfo || {};
        const hasData = !!fontInfo.fontData;
        console.log(`[TypeBucket] Entry ${i}:`, {
          text: entry.text?.substring(0, 30) + '...',
          fontFamily: fontInfo.fontFamily,
          hasFontData: hasData,
          indicator: hasData ? 'GREEN' : 'RED'
        });
      });

      if (entries.length === 0) {
        entriesEl.innerHTML = `<div class="empty-state">No saved text yet.<br>Highlight text and right-click to save.</div>`;
        trashBtn.classList.add("hidden");
        return;
      }

      trashBtn.classList.remove("hidden");
      const sorted = [...entries].reverse();

      entriesEl.innerHTML = sorted.map(entry => {
        const fontInfo = normalizeFontInfo(entry);
        const displayText = normalizeText(entry.text);
        return `
          <div class="entry" data-id="${entry.id}">
            <div class="entry-text">${escapeHtml(displayText)}</div>
            ${formatFontInfo(fontInfo)}
            <div class="entry-meta">
              <span class="entry-source" title="${escapeHtml(entry.title || '')}">${escapeHtml(entry.title || 'Unknown')}</span>
            </div>
          </div>
        `;
      }).join("");

      // Apply font styles via JS
      sorted.forEach((entry, index) => {
        const fontInfo = normalizeFontInfo(entry);
        if (!fontInfo) return;

        const entryEl = entriesEl.querySelectorAll('.entry')[index];
        const textEl = entryEl?.querySelector('.entry-text');
        if (!textEl) return;

        // Try to inject embedded font
        const embeddedFontName = injectFont(fontInfo, entry.id);

        if (embeddedFontName) {
          textEl.style.fontFamily = `"${embeddedFontName}", ${fontInfo.fontFamily}`;
        } else if (fontInfo.fontFamily) {
          textEl.style.fontFamily = fontInfo.fontFamily;
        }

        // Only apply safe styles (not fontSize, lineHeight, textTransform which can break layout)
        if (fontInfo.fontWeight) textEl.style.fontWeight = fontInfo.fontWeight;
        if (fontInfo.fontStyle) textEl.style.fontStyle = fontInfo.fontStyle;
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Close sidebar
  closeBtn.addEventListener("click", () => {
    sidebar.remove();
    document.body.style.marginLeft = "";
  });

  // Clear all
  trashBtn.addEventListener("click", () => {
    if (confirm("Delete all saved text?")) {
      console.log('[TypeBucket] Clearing all entries...');
      chrome.runtime.sendMessage({ type: "CLEAR_ALL" }, () => {
        console.log('[TypeBucket] All entries cleared');
        loadEntries();
      });
    }
  });

  // Listen for new entries
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "ENTRY_ADDED") {
      console.log('[TypeBucket] New entry added:', {
        text: message.entry?.text?.substring(0, 30) + '...',
        fontInfo: message.entry?.fontInfo
      });
      loadEntries();
    }
  });

  // Initial load
  loadEntries();
})();
