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

    // Notify sidebar if open
    browser.tabs.sendMessage(tab.id, { type: "ENTRY_ADDED", entry }).catch(() => {});
  }
});

// Handle extension icon click - toggle sidebar
browser.action.onClicked.addListener(async (tab) => {
  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["sidebar/sidebar.js"]
  });
});

// Handle messages from sidebar
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    // Inject sidebar into the tab that sent the message
    browser.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ["sidebar/sidebar.js"]
    });
    return false;
  }
});
