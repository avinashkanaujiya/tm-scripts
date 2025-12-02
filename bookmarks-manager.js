// ==UserScript==
// @name         Floating Bookmark Manager (Appear On Click In Zone)
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Floating button appears only when you click in the activation zone (not on hover), disappears when opening or clicking zone again. Modal centered. All features intact.
// @author       AI Assistant
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";
  let btnDiv,
    mainDiv,
    editingIdx = null,
    menuVisible = false,
    buttonCreated = false,
    managerOpen = false,
    outsideListenerSet = false;
  let buttonManuallyShown = false; // track whether currently visible
  let mouseOnBtn = false;

  function getBookmarks() {
    return JSON.parse(GM_getValue("bookmarks", "[]"));
  }
  function saveBookmarks(bookmarks) {
    GM_setValue("bookmarks", JSON.stringify(bookmarks));
  }
  function addBookmark(title, url) {
    const bookmarks = getBookmarks();
    if (!bookmarks.some((b) => b.url === url)) {
      bookmarks.push({ title, url, clicks: 0 });
      saveBookmarks(bookmarks);
    }
  }
  function removeBookmark(idx) {
    const bookmarks = getBookmarks();
    bookmarks.splice(idx, 1);
    saveBookmarks(bookmarks);
    if (editingIdx === idx) editingIdx = null;
  }
  function updateBookmarkName(idx, newName) {
    const bookmarks = getBookmarks();
    bookmarks[idx].title = newName;
    saveBookmarks(bookmarks);
    editingIdx = null;
  }
  function incrementClick(idx) {
    const bookmarks = getBookmarks();
    bookmarks[idx].clicks += 1;
    saveBookmarks(bookmarks);
  }
  function sortByClicks() {
    const bookmarks = getBookmarks();
    bookmarks.sort((a, b) => b.clicks - a.clicks);
    saveBookmarks(bookmarks);
  }
  function exportBookmarks() {
    const data = GM_getValue("bookmarks", "[]");
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 200);
  }
  function importBookmarks(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const newBookmarks = JSON.parse(e.target.result);
        if (Array.isArray(newBookmarks)) {
          saveBookmarks(newBookmarks);
          renderUI();
        } else {
          alert("Invalid bookmarks data!");
        }
      } catch {
        alert("Import failed: Invalid file.");
      }
    };
    reader.readAsText(file);
  }

  function injectTransitionStyles() {
    if (document.getElementById("bm-transition-styles")) return;
    const style = document.createElement("style");
    style.id = "bm-transition-styles";
    style.textContent = `
        #bookmark-btn-floating {
            transition: opacity 0.20s, transform 0.20s;
            will-change: opacity, transform;
            cursor: pointer !important;
            left: 50%;
            top: 18px;
            transform: translateX(-50%) scale(1);
        }
        #bookmark-btn-floating.hidden {
            opacity: 0 !important;
            pointer-events: none;
        }
        #bookmark-manager-floating {
            transition: opacity 0.23s, transform 0.27s;
            will-change: opacity, transform;
            left: 50% !important;
            top: 60px !important;
            transform: translateX(-50%) scale(1) translateY(0) !important;
        }
        #bookmark-manager-floating.bm-hide {
            opacity: 0 !important;
            transform: translateX(-50%) scale(0.85) translateY(-20px) !important;
            pointer-events: none !important;
        }
        #bookmark-manager-floating.bm-show {
            opacity: 1 !important;
            pointer-events: auto;
        }
        .bm-close-btn {
            background: none;
            border: none;
            color: #888;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.12s;
            outline: none;
            margin-left: 18px;
        }
        .bm-close-btn:hover { color: #f33; }
        `;
    document.head.appendChild(style);
  }

  function setButtonVisible(visible) {
    btnDiv.classList.toggle("hidden", !visible);
    btnDiv.style.opacity = visible ? "1" : "0";
    btnDiv.style.pointerEvents = visible ? "auto" : "none";
    buttonManuallyShown = visible;
  }

  function createFloatingButton() {
    injectTransitionStyles();
    if (buttonCreated) {
      setButtonVisible(false);
      return;
    }
    btnDiv = document.createElement("div");
    btnDiv.id = "bookmark-btn-floating";
    btnDiv.className = "hidden";
    btnDiv.style = `
            position: fixed;
            z-index: 999999;
            background: #0162ef;
            color: white;
            font-family: system-ui, sans-serif;
            border-radius: 24px;
            padding: 9px 14px;
            box-shadow: 0 2px 6px rgba(0,0,0,.12);
            font-size: 21px;
            display: flex;
            align-items: center;
            user-select: none;
            opacity: 0;
        `;
    btnDiv.tabIndex = 0;
    btnDiv.textContent = "📑";
    btnDiv.title = "Show Bookmark Manager";
    btnDiv.addEventListener("mouseenter", () => {
      mouseOnBtn = true;
    });
    btnDiv.addEventListener("mouseleave", () => {
      mouseOnBtn = false;
    });
    btnDiv.onclick = function (ev) {
      managerOpen = true;
      setButtonVisible(false);
      renderUI({ animate: true });
    };
    document.body.appendChild(btnDiv);

    // Listen for click in top-center activation zone to show/hide the button
    document.addEventListener("click", function (e) {
      if (managerOpen) return;
      const width = window.innerWidth;
      const centerStart = width * 0.4,
        centerEnd = width * 0.6;
      const inZone =
        e.clientY < 70 && e.clientX > centerStart && e.clientX < centerEnd;
      // Only trigger if not already visible, or if click is on the button itself
      if (inZone && !buttonManuallyShown) {
        setButtonVisible(true);
      } else if (inZone && buttonManuallyShown && !mouseOnBtn) {
        setButtonVisible(false);
      }
    });

    buttonCreated = true;
  }

  function restoreFloatingButton() {
    if (btnDiv) {
      setButtonVisible(false);
      managerOpen = false;
    }
  }

  function closeManagerUI() {
    if (!mainDiv || !mainDiv.parentNode) return;
    mainDiv.classList.remove("bm-show");
    mainDiv.classList.add("bm-hide");
    setTimeout(() => {
      if (mainDiv.parentNode) mainDiv.parentNode.removeChild(mainDiv);
      restoreFloatingButton();
      editingIdx = null;
      menuVisible = false;
      managerOpen = false;
      outsideListenerSet = false;
    }, 240);
  }

  function renderUI(opts = {}) {
    managerOpen = true;
    if (mainDiv && mainDiv.parentNode) mainDiv.parentNode.removeChild(mainDiv);

    mainDiv = document.createElement("div");
    mainDiv.id = "bookmark-manager-floating";
    mainDiv.className = opts.animate ? "bm-hide" : "bm-show";
    mainDiv.style = `
            position: fixed;
            left: 50%;
            top: 60px;
            background: white;
            color: #222;
            border-radius: 10px;
            padding: 14px 18px 14px 18px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.13);
            z-index: 999999;
            width: 350px;
            font-family: system-ui, sans-serif;
            box-sizing: border-box;
            opacity:${opts.animate ? 0 : 1};
        `;

    const t = document.createElement("div");
    t.style =
      "font-size:17px;font-weight:bold;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;";
    t.innerHTML = `<span>📑 Bookmark Manager</span>`;
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✖";
    closeBtn.className = "bm-close-btn";
    closeBtn.title = "Close";
    closeBtn.onclick = closeManagerUI;
    t.appendChild(closeBtn);
    mainDiv.appendChild(t);

    const bookmarks = getBookmarks();
    const list = document.createElement("div");
    list.style = "max-height:320px; overflow:auto;";
    if (bookmarks.length === 0) {
      list.innerHTML = "<i>No bookmarks yet.</i>";
    } else {
      bookmarks.forEach((bm, i) => {
        const bmDiv = document.createElement("div");
        bmDiv.style = "display:flex;align-items:center;margin-bottom:7px;";
        if (editingIdx === i) {
          bmDiv.innerHTML = `
                        <input type="text" id="bm-edit-input" value="${bm.title.replace(/"/g, "&quot;")}" style="flex:1 1 auto;padding:2px 6px;font-weight:bold;">
                        <button data-save style="margin-left:6px;">💾 Save</button>
                        <button style="margin-left:6px;" data-cancel>✖ Cancel</button>
                    `;
          const inputEl = bmDiv.querySelector("#bm-edit-input");
          inputEl.focus();
          inputEl.select();
          inputEl.onkeydown = (ev) => {
            if (ev.key === "Enter") {
              const newTitle = inputEl.value.trim();
              if (newTitle.length > 0) {
                updateBookmarkName(i, newTitle);
                renderUI();
              }
            }
          };
          bmDiv.querySelector("button[data-save]").onclick = () => {
            const newTitle = inputEl.value.trim();
            if (newTitle.length > 0) {
              updateBookmarkName(i, newTitle);
              renderUI();
            }
          };
          bmDiv.querySelector("button[data-cancel]").onclick = () => {
            editingIdx = null;
            renderUI();
          };
        } else {
          bmDiv.innerHTML = `
                        <a href="${bm.url}" target="_blank" style="text-decoration:none;color:#0162ef;font-weight:bold;flex:1 1 auto;">
                            ${bm.title.length > 40 ? bm.title.slice(0, 39) + "…" : bm.title}
                        </a>
                        <span style="color:#888;font-size:12px;margin-left:8px;">${bm.clicks} clicks</span>
                        <button title="Edit" style="margin-left:6px;" data-edit>✏️</button>
                        <button style="margin-left:6px;" data-del="${i}">🗑</button>
                    `;
          bmDiv.querySelector("a").onclick = () => {
            incrementClick(i);
            setTimeout(() => renderUI(), 250);
          };
          bmDiv.querySelector("button[data-edit]").onclick = () => {
            editingIdx = i;
            renderUI();
          };
          bmDiv.querySelector("button[data-del]").onclick = () => {
            removeBookmark(i);
            renderUI();
          };
        }
        list.appendChild(bmDiv);
      });
    }
    mainDiv.appendChild(list);

    // Menu toggle button (at bottom, after bookmarks)
    const toggleRow = document.createElement("div");
    toggleRow.style =
      "display:flex;justify-content:center;align-items:center;gap:8px;margin-top:12px;";
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "☰ Menu";
    toggleBtn.style = "padding:4px 12px;font-size:14px;";
    toggleBtn.onclick = (e) => {
      menuVisible = !menuVisible;
      renderUI();
      e.stopPropagation();
    };
    toggleRow.appendChild(toggleBtn);
    mainDiv.appendChild(toggleRow);

    function updateMenuRow() {
      let buttonRow = document.getElementById("bm-controls-row");
      if (buttonRow) buttonRow.remove();
      if (!menuVisible) return;
      buttonRow = document.createElement("div");
      buttonRow.id = "bm-controls-row";
      buttonRow.style =
        "margin-top:3px;display:flex;gap:7px;flex-wrap:wrap;justify-content:center;";
      buttonRow.innerHTML = `
                <button id="bm-add" style="padding:4px 8px;">Add Bookmark</button>
                <button id="bm-sort" style="padding:4px 8px;">Sort by Clicks</button>
                <button id="bm-export" style="padding:4px 8px;">Export</button>
                <label style="cursor:pointer;padding:4px 7px;background:#eaeaea;border-radius:4px;">
                    Import<input type="file" id="bm-import" accept="application/json" style="display:none;">
                </label>
            `;
      mainDiv.appendChild(buttonRow);
      buttonRow.querySelector("#bm-add").onclick = () => {
        let title =
          document.title || prompt("Bookmark title:", location.hostname);
        addBookmark(title, location.href);
        renderUI();
      };
      buttonRow.querySelector("#bm-sort").onclick = () => {
        sortByClicks();
        renderUI();
      };
      buttonRow.querySelector("#bm-export").onclick = () => exportBookmarks();
      buttonRow.querySelector("#bm-import").onchange = (e) =>
        importBookmarks(e);
    }
    updateMenuRow();

    document.body.appendChild(mainDiv);

    if (opts.animate)
      setTimeout(() => {
        mainDiv.classList.remove("bm-hide");
        mainDiv.classList.add("bm-show");
      }, 15);
    else {
      mainDiv.classList.remove("bm-hide");
      mainDiv.classList.add("bm-show");
    }

    if (!outsideListenerSet) {
      setTimeout(() => {
        document.addEventListener("mousedown", outsideClickHandler, true);
        outsideListenerSet = true;
      }, 30);
    }
  }

  function outsideClickHandler(e) {
    if (mainDiv && !mainDiv.contains(e.target)) {
      document.removeEventListener("mousedown", outsideClickHandler, true);
      outsideListenerSet = false;
      closeManagerUI();
    }
  }

  createFloatingButton();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mainDiv && mainDiv.parentNode) {
      document.removeEventListener("mousedown", outsideClickHandler, true);
      outsideListenerSet = false;
      closeManagerUI();
    }
  });
})();
