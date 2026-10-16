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
      width: 320px;
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

    .header h1 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
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
      padding: 12px;
      position: relative;
      break-inside: avoid;
    }

    .entry-text {
      font-size: 13px;
      color: #333;
      word-break: break-word;
      margin-bottom: 8px;
      max-height: 120px;
      overflow: hidden;
    }

    .entry-meta {
      font-size: 10px;
      color: #888;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .entry-source {
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .entry-delete {
      background: none;
      border: none;
      color: #cc0000;
      cursor: pointer;
      font-size: 11px;
    }

    .entry-delete:hover {
      text-decoration: underline;
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

    .clear-btn {
      width: 100%;
      padding: 8px;
      background: #cc0000;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }

    .clear-btn:hover {
      background: #aa0000;
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
      <h1>Type Bucket</h1>
      <button class="close-btn" title="Close">&times;</button>
    </div>
    <div class="content">
      <div class="grid" id="entries"></div>
    </div>
    <div class="footer hidden" id="footer">
      <button class="clear-btn">Clear All</button>
    </div>
  `;

  shadow.appendChild(styles);
  shadow.appendChild(container);

  // Add to page
  document.body.appendChild(sidebar);
  document.body.style.marginLeft = "320px";

  // Get elements
  const entriesEl = shadow.getElementById("entries");
  const footerEl = shadow.getElementById("footer");
  const closeBtn = shadow.querySelector(".close-btn");
  const clearBtn = shadow.querySelector(".clear-btn");

  // Load entries
  function loadEntries() {
    chrome.runtime.sendMessage({ type: "GET_ENTRIES" }, (response) => {
      const entries = response?.entries || [];

      if (entries.length === 0) {
        entriesEl.innerHTML = `<div class="empty-state">No saved text yet.<br>Highlight text and right-click to save.</div>`;
        footerEl.classList.add("hidden");
        return;
      }

      footerEl.classList.remove("hidden");
      const sorted = [...entries].reverse();

      entriesEl.innerHTML = sorted.map(entry => `
        <div class="entry" data-id="${entry.id}">
          <div class="entry-text">${escapeHtml(entry.text)}</div>
          <div class="entry-meta">
            <span class="entry-source" title="${escapeHtml(entry.title || '')}">${escapeHtml(entry.title || 'Unknown')}</span>
            <button class="entry-delete" data-id="${entry.id}">Delete</button>
          </div>
        </div>
      `).join("");
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

  // Delete entry
  entriesEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("entry-delete")) {
      const id = Number(e.target.dataset.id);
      chrome.runtime.sendMessage({ type: "DELETE_ENTRY", id }, () => {
        loadEntries();
      });
    }
  });

  // Clear all
  clearBtn.addEventListener("click", () => {
    if (confirm("Delete all saved text?")) {
      chrome.runtime.sendMessage({ type: "CLEAR_ALL" }, () => {
        loadEntries();
      });
    }
  });

  // Listen for new entries
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "ENTRY_ADDED") {
      loadEntries();
    }
  });

  // Initial load
  loadEntries();
})();
