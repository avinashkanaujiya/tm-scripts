// ==UserScript==
// @name         ChatGPT Summarize Popup: Bigger Text, Same Height
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Increase popup readability without changing its on-screen height/width. Works when iframe is present in page DOM.
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// @require      file:///Users/avinashkanaujiya/Projects/tm-scripts/scripts/chatgpt-summarize.js
// ==/UserScript==

(function () {
  "use strict";

  const cfg = {
    bp1: 900,
    bp2: 1400,
    marginSmall: 100,
    marginMedium: 150,
    marginLarge: 200,
    scaleSmall: 1.08, // mild increase
    scaleMedium: 1.16, // moderate
    scaleLarge: 1.24, // stronger
    iframeSelector: "#chatgpt-summarize-popup",
    observeInterval: 1500,
  };

  function getSettingsForWidth(w) {
    if (w < cfg.bp1) return { margin: cfg.marginSmall, scale: cfg.scaleSmall };
    if (w < cfg.bp2)
      return { margin: cfg.marginMedium, scale: cfg.scaleMedium };
    return { margin: cfg.marginLarge, scale: cfg.scaleLarge };
  }

  // Save original size on the element for stable recalculations
  function ensureOriginalSize(iframe) {
    if (!iframe.dataset.origWidth || !iframe.dataset.origHeight) {
      const rect = iframe.getBoundingClientRect();
      const ow = iframe.offsetWidth || Math.round(rect.width) || 1;
      const oh = iframe.offsetHeight || Math.round(rect.height) || 1;
      iframe.dataset.origWidth = String(ow);
      iframe.dataset.origHeight = String(oh);
      // also preserve inline style width/height if present
      iframe.dataset.inlineWidth = iframe.style.width || "";
      iframe.dataset.inlineHeight = iframe.style.height || "";
    }
  }

  function applyTransformKeepingBox(iframe, scale, rightMargin) {
    if (!iframe) return;
    ensureOriginalSize(iframe);

    const origW = Number(iframe.dataset.origWidth);
    const origH = Number(iframe.dataset.origHeight);
    if (!origW || !origH) return;

    // Inverse width/height so the scaled visual box equals the original box
    const cssWidth = Math.max(1, Math.round(origW / scale));
    const cssHeight = Math.max(1, Math.round(origH / scale));

    // Use transform for internal scaling, and shrink CSS box to compensate
    iframe.style.position = "fixed";
    iframe.style.right = `${rightMargin}px`;
    iframe.style.width = cssWidth + 100 + "px";
    iframe.style.height = cssHeight + "px";
    iframe.style.transformOrigin = "top right";
    iframe.style.transform = `scale(${scale})`;
    iframe.style.transition =
      "transform 160ms ease, right 160ms ease, width 160ms ease, height 160ms ease";
    iframe.style.zIndex = 2147483647;

    // ensure overflow visible so scaled content renders fully
    iframe.style.overflow = "visible";
  }

  function resetTransform(iframe) {
    if (!iframe) return;
    // restore inline styles if any existed
    if (iframe.dataset.inlineWidth !== undefined)
      iframe.style.width = iframe.dataset.inlineWidth;
    if (iframe.dataset.inlineHeight !== undefined)
      iframe.style.height = iframe.dataset.inlineHeight;
    iframe.style.transform = "";
    iframe.style.transformOrigin = "";
    iframe.style.overflow = "";
  }

  function applyForCurrentWindowSize() {
    const frame = document.querySelector(cfg.iframeSelector);
    if (!frame) return;
    const { margin, scale } = getSettingsForWidth(window.innerWidth);
    applyTransformKeepingBox(frame, scale, margin);
  }

  function observeAndKeepApplying() {
    // immediate attempt
    applyForCurrentWindowSize();

    // observe added nodes (useful if iframe is injected later)
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!node) continue;
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && node.matches(cfg.iframeSelector)) {
              applyForCurrentWindowSize();
              return;
            }
            if (node.querySelector && node.querySelector(cfg.iframeSelector)) {
              applyForCurrentWindowSize();
              return;
            }
          }
        }
      }
    });
    mo.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });

    // periodic re-apply in case the extension resets styles
    setInterval(() => {
      applyForCurrentWindowSize();
    }, cfg.observeInterval);

    // handle resize
    window.addEventListener("resize", () => {
      applyForCurrentWindowSize();
    });
  }

  // Public start
  observeAndKeepApplying();
})();
