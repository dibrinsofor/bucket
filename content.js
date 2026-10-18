// Prevent multiple injections
if (!window.__typeBucketContentLoaded) {
  window.__typeBucketContentLoaded = true;

  // Get comprehensive font info from selected text
  function getSelectionFontInfo() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;

    // Get the element (not text node)
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }

    if (!element) return null;

    const computed = window.getComputedStyle(element);

    const fontInfo = {
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
      fontVariant: computed.fontVariant,
      letterSpacing: computed.letterSpacing,
      lineHeight: computed.lineHeight,
      textTransform: computed.textTransform,
      fontSrc: null,
      fontData: null,
      isEmbedded: false,  // init false, set true only when embedding confirmed
      isProprietary: isProprietary(computed.fontFamily)
    };

    // Try to find @font-face rule and extract src
    const fontName = extractPrimaryFontName(fontInfo.fontFamily);
    const fontFaceInfo = findFontFace(fontName);

    if (fontFaceInfo) {
      fontInfo.fontSrc = fontFaceInfo.src;
    }

    return fontInfo;
  }

  // Extract primary font name from font-family string
  function extractPrimaryFontName(fontFamily) {
    if (!fontFamily) return null;
    // Get first font in the stack, remove quotes
    const first = fontFamily.split(',')[0].trim();
    return first.replace(/["']/g, '');
  }

  // Common system fonts
  const systemFonts = new Set([
    'arial', 'helvetica', 'helvetica neue', 'times', 'times new roman',
    'georgia', 'verdana', 'tahoma', 'trebuchet ms', 'courier', 'courier new',
    'lucida console', 'lucida sans', 'lucida grande', 'palatino', 'palatino linotype',
    'garamond', 'bookman', 'comic sans ms', 'impact', 'arial black',
    'system-ui', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'roboto',
    'oxygen', 'ubuntu', 'cantarell', 'fira sans', 'droid sans', 'noto sans',
    'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
    'sf pro', 'sf pro display', 'sf pro text', 'sf mono',
    'menlo', 'monaco', 'consolas', 'liberation mono', 'dejavu sans mono'
  ]);

  // Check if font is proprietary (not a common system font)
  function isProprietary(fontFamily) {
    if (!fontFamily) return false;
    const primaryFont = fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    return !systemFonts.has(primaryFont);
  }

  // Find @font-face rule for a given font name
  function findFontFace(fontName) {
    if (!fontName) return null;

    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;

          for (const rule of rules) {
            if (rule instanceof CSSFontFaceRule) {
              const family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
              if (family.toLowerCase() === fontName.toLowerCase()) {
                const src = rule.style.getPropertyValue('src');
                // Extract URL from src
                const urlMatch = src.match(/url\(["']?([^"')]+)["']?\)/);
                if (urlMatch) {
                  return {
                    src: urlMatch[1],
                    fullSrc: src
                  };
                }
              }
            }
          }
        } catch (e) {
          // CORS - can't access cross-origin stylesheet
          continue;
        }
      }
    } catch (e) {
      console.error('Error finding font-face:', e);
    }

    return null;
  }

  // Fetch font and convert to base64
  async function fetchFontAsBase64(url) {
    try {
      // Handle relative URLs
      const absoluteUrl = new URL(url, window.location.href).href;

      const response = await fetch(absoluteUrl, { mode: 'cors' });
      if (!response.ok) return null;

      const blob = await response.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Error fetching font:', e);
      return null;
    }
  }

  // Listen for font request from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_SELECTION_FONT") {
      const fontInfo = getSelectionFontInfo();

      // If we have a font source, try to fetch it
      if (fontInfo?.fontSrc) {
        fetchFontAsBase64(fontInfo.fontSrc).then(fontData => {
          fontInfo.fontData = fontData;
          sendResponse({ fontInfo });
        });
        return true; // Keep channel open for async response
      }

      sendResponse({ fontInfo });
      return true;
    }

    // Handle sidebar injection request
    if (message.type === "INJECT_SIDEBAR") {
      sendResponse({ ok: true });
    }
  });

  // Check if sidebar should be open on page load
  function checkAndOpenSidebar() {
    chrome.storage.local.get("sidebarOpen", ({ sidebarOpen }) => {
      if (sidebarOpen && !document.getElementById("type-bucket-sidebar")) {
        chrome.runtime.sendMessage({ type: "OPEN_SIDEBAR" });
      }
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(checkAndOpenSidebar, 100);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(checkAndOpenSidebar, 100);
    });
  }
}
