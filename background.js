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

    // Get existing entries
    const { bucket = [] } = await browser.storage.local.get("bucket");

    // Add new entry
    bucket.push(entry);
    await browser.storage.local.set({ bucket });

    console.log("Saved to bucket:", entry);
  }
});
