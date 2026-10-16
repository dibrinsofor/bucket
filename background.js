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
    const entry = {
      id: Date.now(),
      text: info.selectionText,
      url: tab.url,
      title: tab.title,
      savedAt: new Date().toISOString()
    };

    const { bucket = [] } = await browser.storage.local.get("bucket");
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
});
