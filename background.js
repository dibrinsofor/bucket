// Logger - stores logs in storage for debugging
const Logger = {
  MAX_LOGS: 30,

  async log(type, message, data = {}) {
    const { logs = [] } = await browser.storage.local.get("logs");

    // Extract domain from URL if present
    let domain = null;
    if (data.url) {
      try {
        domain = new URL(data.url).hostname;
      } catch (e) {
        domain = data.url;
      }
    }

    logs.push({
      type,
      message,
      domain,
      fontFamily: data.fontFamily || null,
      reason: data.reason || null,
      timestamp: new Date().toISOString()
    });

    // Keep only last MAX_LOGS entries
    if (logs.length > this.MAX_LOGS) {
      logs.splice(0, logs.length - this.MAX_LOGS);
    }

    await browser.storage.local.set({ logs });
  },

  async getLogs() {
    const { logs = [] } = await browser.storage.local.get("logs");
    return logs;
  },

  async clear() {
    await browser.storage.local.set({ logs: [] });
  }
};

// Get unique key for a font (family + weight)
function getFontKey(fontInfo) {
  if (!fontInfo?.fontFamily) return null;
  const family = fontInfo.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
  const weight = fontInfo.fontWeight || '400';
  return `${family}:${weight}`;
}

// Create context menu on install
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "save-to-bucket",
    title: "Save to Type Bucket",
    contexts: ["selection"]
  });
});

// Handle context menu click
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-bucket" && info.selectionText) {
    // Get font info from content script
    let fontInfo = null;
    try {
      // Ensure content script is injected (needed for pre-existing tabs)
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });

      const response = await browser.tabs.sendMessage(tab.id, { type: "GET_SELECTION_FONT" });
      fontInfo = response?.fontInfo || null;
    } catch (e) {
      // Content script may not be loaded or page doesn't allow injection
    }

    const entry = {
      id: Date.now(),
      text: info.selectionText,
      url: tab.url,
      title: tab.title,
      fontInfo,
      savedAt: new Date().toISOString()
    };

    const { bucket = [] } = await browser.storage.local.get("bucket");

    // Check for duplicate font (same font family + weight = duplicate)
    const newFontKey = getFontKey(fontInfo);
    const isDuplicate = bucket.some(existing => {
      const existingKey = getFontKey(existing.fontInfo);
      return existingKey && newFontKey && existingKey === newFontKey;
    });

    if (isDuplicate) {
      Logger.log('info', 'Duplicate font skipped', { fontFamily: newFontKey });
      return;
    }

    bucket.push(entry);
    await browser.storage.local.set({ bucket });

    // Notify sidebar if open (content script injection)
    browser.tabs.sendMessage(tab.id, { type: "ENTRY_ADDED", entry }).catch(() => {});

    // Notify native sidebar panel (Firefox)
    browser.runtime.sendMessage({ type: "ENTRY_ADDED", entry }).catch(() => {});
  }
});

// Detect if running in Firefox
const isFirefox = typeof browser !== 'undefined' && browser.runtime.getBrowserInfo;

// Handle extension icon click - toggle sidebar
browser.action.onClicked.addListener(async (tab) => {
  if (isFirefox && browser.sidebarAction) {
    // Firefox: toggle native sidebar
    browser.sidebarAction.toggle();
  } else {
    // Chrome/others: inject sidebar into page
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["sidebar/sidebar.js"]
    });
  }
});

// Fetch font file (bypasses CORS due to host_permissions)
async function fetchFontFromBackground(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      Logger.log('error', 'Font fetch failed', { url, reason: `HTTP ${response.status}` });
      return null;
    }

    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        Logger.log('success', 'Font fetched', { url });
        resolve(reader.result);
      };
      reader.onerror = () => {
        Logger.log('error', 'Font read failed', { url, reason: 'FileReader error' });
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    Logger.log('error', 'Font fetch failed', { url, reason: e.message });
    return null;
  }
}

// Fetch CSS text (bypasses CORS due to host_permissions)
async function fetchCSSFromBackground(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      Logger.log('error', 'CSS fetch failed', { url, reason: `HTTP ${response.status}` });
      return null;
    }
    const text = await response.text();
    return text;
  } catch (e) {
    Logger.log('error', 'CSS fetch failed', { url, reason: e.message });
    return null;
  }
}

// Handle messages from sidebar and content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "LOG") {
    Logger.log(message.logType, message.message, message.data || {});
    return false;
  }

  if (message.type === "GET_LOGS") {
    Logger.getLogs().then(logs => sendResponse({ logs }));
    return true;
  }

  if (message.type === "FETCH_FONT") {
    // Fetch font with elevated permissions
    fetchFontFromBackground(message.url).then(fontData => {
      sendResponse({ fontData });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === "FETCH_CSS") {
    // Fetch CSS text with elevated permissions
    fetchCSSFromBackground(message.url).then(cssText => {
      sendResponse({ cssText });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === "GET_ENTRIES") {
    browser.storage.local.get("bucket").then(({ bucket = [] }) => {
      sendResponse({ entries: bucket });
    });
    return true;
  }

  if (message.type === "DELETE_ENTRY") {
    browser.storage.local.get("bucket").then(({ bucket = [] }) => {
      const updated = bucket.filter(e => e.id !== message.id);
      browser.storage.local.set({ bucket: updated }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === "CLEAR_ALL") {
    browser.storage.local.set({ bucket: [] }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "UPDATE_ENTRIES") {
    browser.storage.local.set({ bucket: message.entries }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "OPEN_SIDEBAR") {
    if (isFirefox && browser.sidebarAction) {
      // Firefox: open native sidebar
      browser.sidebarAction.open();
    } else {
      // Chrome/others: inject sidebar into page
      browser.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ["sidebar/sidebar.js"]
      });
    }
    return false;
  }
});
