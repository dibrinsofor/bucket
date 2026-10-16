const entriesContainer = document.getElementById("entries");
const emptyState = document.getElementById("empty-state");
const clearAllBtn = document.getElementById("clear-all");

async function loadEntries() {
  const { bucket = [] } = await browser.storage.local.get("bucket");

  if (bucket.length === 0) {
    emptyState.classList.remove("hidden");
    clearAllBtn.classList.add("hidden");
    entriesContainer.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");
  clearAllBtn.classList.remove("hidden");

  // Show newest first
  const sorted = [...bucket].reverse();

  entriesContainer.innerHTML = sorted.map(entry => `
    <div class="entry" data-id="${entry.id}">
      <div class="entry-text">${escapeHtml(entry.text)}</div>
      <div class="entry-meta">
        <span class="entry-source" title="${escapeHtml(entry.title)}">${escapeHtml(entry.title)}</span>
        <button class="entry-delete" data-id="${entry.id}">Delete</button>
      </div>
    </div>
  `).join("");
}

async function deleteEntry(id) {
  const { bucket = [] } = await browser.storage.local.get("bucket");
  const updated = bucket.filter(entry => entry.id !== id);
  await browser.storage.local.set({ bucket: updated });
  loadEntries();
}

async function clearAll() {
  if (confirm("Delete all saved text?")) {
    await browser.storage.local.set({ bucket: [] });
    loadEntries();
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
entriesContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("entry-delete")) {
    deleteEntry(Number(e.target.dataset.id));
  }
});

clearAllBtn.addEventListener("click", clearAll);

// Load on open
loadEntries();
