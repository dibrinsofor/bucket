// Prevent multiple injections
if (!window.__typeBucketContentLoaded) {
  window.__typeBucketContentLoaded = true;

  // Log helper - sends to background script
  function log(logType, message, data = {}) {
    chrome.runtime.sendMessage({ type: "LOG", logType, message, data });
  }

  // Font map: stores discovered fonts { fontFamily -> { url, weight, style } }
  const fontMap = new Map();

  // Parse CSS text to extract @font-face rules
  function parseFontFacesFromCSS(cssText, baseUrl) {
    const fonts = [];
    // Match @font-face blocks
    const fontFaceRegex = /@font-face\s*\{([^}]+)\}/gi;
    let match;

    while ((match = fontFaceRegex.exec(cssText)) !== null) {
      const block = match[1];

      // Extract font-family
      const familyMatch = block.match(/font-family\s*:\s*["']?([^"';\n]+)["']?/i);
      if (!familyMatch) continue;
      const family = familyMatch[1].trim();

      // Extract src URL (prefer woff2)
      const srcMatch = block.match(/src\s*:[^;]+url\(["']?([^"')]+\.woff2?)["']?\)/i);
      if (!srcMatch) continue;
      let url = srcMatch[1].trim();

      // Resolve relative URLs
      if (baseUrl && !url.startsWith('http') && !url.startsWith('data:')) {
        try {
          url = new URL(url, baseUrl).href;
        } catch (e) {
          log('error', 'Failed to resolve font URL', { url });
          continue;
        }
      }

      // Extract weight and style
      const weightMatch = block.match(/font-weight\s*:\s*(\d+|normal|bold)/i);
      const styleMatch = block.match(/font-style\s*:\s*(normal|italic|oblique)/i);

      fonts.push({
        family,
        url,
        weight: weightMatch ? weightMatch[1] : '400',
        style: styleMatch ? styleMatch[1] : 'normal'
      });
    }

    return fonts;
  }

  // Fetch CSS via background script and parse for fonts
  async function fetchAndParseCSSForFonts(cssUrl) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "FETCH_CSS",
        url: cssUrl
      });

      if (!response?.cssText) {
        return;
      }

      const fonts = parseFontFacesFromCSS(response.cssText, cssUrl);

      // Add to font map
      for (const font of fonts) {
        const key = font.family.toLowerCase();
        if (!fontMap.has(key)) {
          fontMap.set(key, []);
        }
        fontMap.get(key).push(font);
      }

      // Also check for @import rules in the CSS
      const importRegex = /@import\s+(?:url\()?["']?([^"')\s;]+)["']?\)?/gi;
      let importMatch;
      while ((importMatch = importRegex.exec(response.cssText)) !== null) {
        let importUrl = importMatch[1];
        if (!importUrl.startsWith('http')) {
          try {
            importUrl = new URL(importUrl, cssUrl).href;
          } catch (e) {
            continue;
          }
        }
        // Recursively fetch imported CSS
        await fetchAndParseCSSForFonts(importUrl);
      }
    } catch (e) {
      log('error', 'Error fetching CSS', { url: cssUrl, reason: e.message });
    }
  }

  // Scan page for external stylesheets and discover fonts
  async function discoverFonts() {

    // 1. Find all <link rel="stylesheet"> tags
    const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
    for (const link of linkTags) {
      if (link.href) {
        await fetchAndParseCSSForFonts(link.href);
      }
    }

    // 2. Scan inline <style> tags
    const styleTags = document.querySelectorAll('style');
    for (const style of styleTags) {
      const fonts = parseFontFacesFromCSS(style.textContent, window.location.href);
      for (const font of fonts) {
        const key = font.family.toLowerCase();
        if (!fontMap.has(key)) {
          fontMap.set(key, []);
        }
        fontMap.get(key).push(font);
      }
    }

    // 3. Try to scan document.styleSheets for @import rules we can access
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;

        for (const rule of rules) {
          if (rule instanceof CSSImportRule && rule.href) {
            await fetchAndParseCSSForFonts(rule.href);
          }
        }
      } catch (e) {
        // CORS blocked - we already handle this via <link> tags
      }
    }

  }

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
    const fontFaceInfo = findFontFace(fontName, fontInfo.fontWeight);

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
  function findFontFace(fontName, fontWeight) {
    if (!fontName) return null;

    // First check our discovered font map
    const key = fontName.toLowerCase();
    if (fontMap.has(key)) {
      const fonts = fontMap.get(key);

      // Try to match by weight, or return first
      const weightStr = String(fontWeight || '400');
      const matched = fonts.find(f => String(f.weight) === weightStr) || fonts[0];

      if (matched) {
        return {
          src: matched.url,
          fullSrc: matched.url
        };
      }
    }

    // Fallback: try document.styleSheets (for same-origin CSS)
    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;

          for (const rule of rules) {
            if (rule instanceof CSSFontFaceRule) {
              const family = rule.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
              const src = rule.style.getPropertyValue('src');

              if (family.toLowerCase() === fontName.toLowerCase()) {
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
          // CORS - skip
          continue;
        }
      }
    } catch (e) {
      // CORS or other error
    }

    log('error', 'Font not found', { fontFamily: fontName, reason: 'No @font-face rule found' });
    return null;
  }

  // Fetch font via background script (bypasses CORS)
  async function fetchFontAsBase64(url) {
    try {
      // Handle relative URLs
      const absoluteUrl = new URL(url, window.location.href).href;

      // Send to background script which has elevated permissions
      const response = await chrome.runtime.sendMessage({
        type: "FETCH_FONT",
        url: absoluteUrl
      });

      if (response?.fontData) {
        return response.fontData;
      }

      return null;
    } catch (e) {
      log('error', 'Error fetching font', { url: absoluteUrl, reason: e.message });
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

  // Discover fonts when page is ready
  if (document.readyState === 'complete') {
    discoverFonts();
  } else {
    window.addEventListener('load', discoverFonts);
  }

}
