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
      console.log('[TypeBucket] Duplicate font, skipping:', newFontKey);
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
  console.log('[TypeBucket] Background fetching font:', url);
  try {
    const response = await fetch(url);
    console.log('[TypeBucket] Fetch response:', response.status, response.ok);
    if (!response.ok) return null;

    const blob = await response.blob();
    console.log('[TypeBucket] Font blob size:', blob.size);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('[TypeBucket] Font converted to base64, length:', reader.result?.length);
        resolve(reader.result);
      };
      reader.onerror = () => {
        console.error('[TypeBucket] FileReader error');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('[TypeBucket] Background fetch error:', e);
    return null;
  }
}

// Fetch CSS text (bypasses CORS due to host_permissions)
async function fetchCSSFromBackground(url) {
  console.log('[TypeBucket] Background fetching CSS:', url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('[TypeBucket] CSS fetch failed:', response.status);
      return null;
    }
    const text = await response.text();
    console.log('[TypeBucket] CSS fetched, length:', text.length);
    return text;
  } catch (e) {
    console.error('[TypeBucket] CSS fetch error:', e);
    return null;
  }
}

// Handle messages from sidebar and content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
