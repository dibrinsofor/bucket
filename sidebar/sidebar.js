(() => {
  const SIDEBAR_ID = "type-bucket-sidebar";

  function init() {
    // Toggle sidebar - check if already exists
    const existing = document.getElementById(SIDEBAR_ID);
    if (existing) {
      existing.remove();
      document.body.style.marginLeft = "";
      return;
    }

    createSidebar();
  }

  function createSidebar() {

  // Create sidebar container
  const sidebar = document.createElement("div");
  sidebar.id = SIDEBAR_ID;

  // Create shadow DOM to isolate styles
  const shadow = sidebar.attachShadow({ mode: "open" });

  // Inject styles
  const styles = document.createElement("style");
  styles.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');

    :host {
      all: initial;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .sidebar {
      --mat: #2F5F50;
      --cream: #F5F2E8;
      --ink: #1a3a30;
      --grid-small: rgba(255,255,255,0.08);
      --grid-large: rgba(255,255,255,0.15);
      position: fixed;
      top: 0;
      left: 0;
      width: 335px;
      height: 100vh;
      background-color: var(--mat);
      background-image:
        /* Large grid (100px) */
        repeating-linear-gradient(
          0deg,
          var(--grid-large) 0px,
          var(--grid-large) 1px,
          transparent 1px,
          transparent 100px
        ),
        repeating-linear-gradient(
          90deg,
          var(--grid-large) 0px,
          var(--grid-large) 1px,
          transparent 1px,
          transparent 100px
        ),
        /* Small grid (20px) */
        repeating-linear-gradient(
          0deg,
          var(--grid-small) 0px,
          var(--grid-small) 1px,
          transparent 1px,
          transparent 20px
        ),
        repeating-linear-gradient(
          90deg,
          var(--grid-small) 0px,
          var(--grid-small) 1px,
          transparent 1px,
          transparent 20px
        );
      border-right: 1px solid var(--ink);
      font-family: 'Rubik', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      color: var(--cream);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header h1 {
      font-size: 16px;
      font-weight: 600;
      color: var(--cream);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .trash-btn {
      background: #F5F0DF;
      border: none;
      cursor: pointer;
      color: #ff6b6b;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .trash-btn:hover {
      opacity: 0.8;
    }

    .trash-btn svg {
      width: 16px;
      height: 16px;
    }

    .close-btn {
      background: #F5F0DF;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--ink);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      padding-bottom: 2px;
    }

    .close-btn:hover {
      opacity: 0.8;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding-top: 6px;
    }

    .entry {
      background: #F5F0DF;
      border: none;
      border-radius: 0;
      padding: 20px;
      padding-top: 28px;
      position: relative;
      break-inside: avoid;
      overflow: visible;
      min-width: 0;
      margin-top: 14px;
    }

    .entry::before {
      content: '';
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 70px;
      height: 22px;
      background-color: #BC974A;
      opacity: 0.9;
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 70 22'%3E%3Cpath d='M0,0 L3,3 L0,6 L3,9 L0,12 L3,15 L0,18 L3,22 L67,22 L70,18 L67,15 L70,12 L67,9 L70,6 L67,3 L70,0 Z' fill='black'/%3E%3C/svg%3E");
      mask-size: 100% 100%;
      mask-repeat: no-repeat;
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 70 22'%3E%3Cpath d='M0,0 L3,3 L0,6 L3,9 L0,12 L3,15 L0,18 L3,22 L67,22 L70,18 L67,15 L70,12 L67,9 L70,6 L67,3 L70,0 Z' fill='black'/%3E%3C/svg%3E");
      -webkit-mask-size: 100% 100%;
      -webkit-mask-repeat: no-repeat;
    }

    .entry-text {
      font-size: 14px !important;
      line-height: 1.4 !important;
      color: var(--ink);
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
      color: rgba(26,58,48,0.6);
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid rgba(26,58,48,0.15);
      line-height: 1.4;
    }

    .entry-font-info .font-line {
      color: rgba(26,58,48,0.8);
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
      color: rgba(26,58,48,0.6);
    }

    /* Faded tape for entries without font data */
    .entry.no-font-data::before {
      background-color: transparent;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 70 22'%3E%3Cpath d='M0,0 L3,3 L0,6 L3,9 L0,12 L3,15 L0,18 L3,22 L67,22 L70,18 L67,15 L70,12 L67,9 L70,6 L67,3 L70,0 Z' fill='%23A3AA9B' opacity='0.25'/%3E%3Cpath d='M0,0 L3,3 L0,6 L3,9 L0,12 L3,15 L0,18 L3,22 L67,22 L70,18 L67,15 L70,12 L67,9 L70,6 L67,3 L70,0 Z' fill='none' stroke='%23A3AA9B' stroke-width='0.5' stroke-dasharray='3,2' opacity='0.5'/%3E%3C/svg%3E");
      background-size: 100% 100%;
      background-repeat: no-repeat;
      mask-image: none;
      -webkit-mask-image: none;
      opacity: 1;
    }

    .entry-meta {
      font-size: 10px;
      color: rgba(26,58,48,0.5);
    }

    .entry-source {
      display: block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empty-state {
      color: rgba(245,242,232,0.6);
      text-align: center;
      padding: 40px 20px;
      grid-column: 1 / -1;
    }

    .input-area {
      padding: 12px 16px;
    }

    .text-input {
      width: 100%;
      min-height: 56px;
      padding: 16px 20px;
      border: none;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      background: #f5f0df;
      color: var(--ink);
    }

    .text-input::placeholder {
      color: rgba(26,58,48,0.5);
      font-weight: 600;
    }

    .text-input:focus {
      outline: none;
    }

    .footer {
      padding: 12px 16px;
      border-top: 1px solid var(--ink);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }

    .info-btn {
      background: #F5F0DF;
      border: none;
      cursor: pointer;
      color: #1a1a1a;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      font-style: italic;
      font-family: Georgia, serif;
    }

    .info-btn:hover {
      opacity: 0.8;
    }

    .info-popup {
      position: absolute;
      bottom: 52px;
      left: 50%;
      transform: translateX(-50%);
      background: #F5F0DF;
      border-radius: 12px;
      padding: 12px 16px;
      display: none;
      flex-direction: row;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      white-space: nowrap;
    }

    .info-popup.show {
      display: flex;
    }

    .info-popup a {
      color: var(--ink);
      text-decoration: none;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-popup a:hover {
      opacity: 0.7;
    }

    .info-popup .credit-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .info-popup .credit-label {
      font-size: 9px;
      color: rgba(26,58,48,0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-popup .logo-img {
      height: 20px;
      width: auto;
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f46b55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7c0-2.8 2.2-5 5-5h2c2.8 0 5 2.2 5 5"/><path d="M5 11h14"/><path d="m18 11-.8 9c-.1 1.1-1.1 2-2.2 2H9c-1.1 0-2.1-.9-2.2-2L6 11"/></svg>
        <h1>Type Bucket</h1>
      </div>
      <div class="header-right">
        <button class="close-btn" title="Close">&times;</button>
      </div>
    </div>
    <div class="input-area">
      <input type="text" class="text-input" id="text-input" placeholder="Type something instead">
    </div>
    <div class="content">
      <div class="grid" id="entries"></div>
    </div>
    <div class="footer hidden" id="footer">
      <button class="trash-btn" id="trash-btn" title="Clear All">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
      <button class="info-btn" id="info-btn" title="Info">i</button>
      <div class="info-popup" id="info-popup">
        <div class="credit-item">
          <span class="credit-label">Design Inspiration</span>
          <a href="https://mochi-icons.com" target="_blank">mochi-icons.com</a>
        </div>
        <div class="credit-item">
          <span class="credit-label">Built by</span>
          <a href="https://dibrinsofor.github.io" target="_blank">
            <img src="https://dibrinsofor.github.io/images/footer.png" alt="Dibri Nsofor" class="logo-img">
          </a>
        </div>
      </div>
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
  const footerEl = shadow.getElementById("footer");
  const textInput = shadow.getElementById("text-input");
  const closeBtn = container.querySelector(".close-btn");
  const infoBtn = shadow.getElementById("info-btn");
  const infoPopup = shadow.getElementById("info-popup");

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

    return `
      <div class="entry-font-info">
        <div class="font-line">
          <span class="font-details">${escapeHtml(fontName)} <span class="font-weight">(${escapeHtml(weight)})</span></span>
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
        footerEl.classList.add("hidden");
        return;
      }

      footerEl.classList.remove("hidden");
      const sorted = [...entries].reverse();

      entriesEl.innerHTML = sorted.map(entry => {
        const fontInfo = normalizeFontInfo(entry);
        const displayText = normalizeText(entry.text);
        const noFontDataClass = !hasFontData(fontInfo) ? 'no-font-data' : '';
        return `
          <div class="entry ${noFontDataClass}" data-id="${entry.id}">
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

  // Toggle info popup
  infoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    infoPopup.classList.toggle("show");
  });

  // Close popup when clicking outside
  container.addEventListener("click", (e) => {
    if (!infoPopup.contains(e.target) && e.target !== infoBtn) {
      infoPopup.classList.remove("show");
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

  // Store original texts for restoration
  let originalTexts = [];

  // Preview typed text in all cells
  textInput.addEventListener('input', (e) => {
    const previewText = e.target.value;
    const textEls = entriesEl.querySelectorAll('.entry-text');

    // Store original texts on first input
    if (originalTexts.length === 0) {
      textEls.forEach(el => originalTexts.push(el.textContent));
    }

    // Update all cells with preview text, or restore originals if empty
    textEls.forEach((el, i) => {
      el.textContent = previewText || originalTexts[i] || '';
    });
  });

  // Clear stored texts when entries reload
  const originalLoadEntries = loadEntries;
  loadEntries = function() {
    originalTexts = [];
    textInput.value = '';
    originalLoadEntries();
  };

  // Initial load
  loadEntries();
  }

  // Wait for body to be ready
  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
