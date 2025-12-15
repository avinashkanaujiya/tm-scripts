// ==UserScript==
// @name         Stock Ticker Tab Opener + Saved URLs (Sticky Tabs, Final)
// @namespace    http://tampermonkey.net/
// @version      2.8
// @description  Chart tools, save URLs (single), batch open, sticky tab bar, toggle settings. Robust and complete.
// @author       You
// @match        https://web.sensibull.com/*
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @require      file:///Users/avinashkanaujiya/Projects/tm-scripts/scripts/sensibull.js
// ==/UserScript==

(function () {
  "use strict";

  // ================ CONFIGURATION ================
  const LIVE_OPTIONS_CHARTS_URL_TEMPLATE =
    "https://web.sensibull.com/live-options-charts?tradingsymbol={TICKER}";
  const LIVE_SPOT_CHARTS_URL_TEMPLATE =
    "https://web.sensibull.com/chart?tradingSymbol={TICKER}";
  const OPTION_CHAIN_URL_TEMPLATE =
    "https://web.sensibull.com/option-chain?tradingsymbol={TICKER}";

  const SECTOR_STOCKS = {
    "Banking & Financial Services": ["HDFCBANK", "ICICIBANK"],
    "Information Technology": ["INFY", "TCS"],
    "Automobile & Auto Ancillary": ["MARUTI", "TCS"],
    "Oil & Gas": ["RELIANCE", "ONGC"],
    "Metals & Mining": ["TATASTEEL", "JSWSTEEL"],
    FMCG: ["HINDUNILVR", "ITC"],
    Pharmaceuticals: ["CIPLA", "DRREDDY"],
    "Power & Energy": ["NTPC", "POWERGRID"],
    "Construction Materials": ["ULTRACEMCO", "GRASIM"],
    Telecommunications: ["BHARTIARTL", "IDEA"],
    Chemicals: ["PIDILITE", "ATUL"],
    Infrastructure: ["LT", "JINDALSAW"],
    "Media & Entertainment": ["DISHTV", "GVF"],
    "Aviation & Logistics": ["INDIGO", "AIRTEL"],
  };

  const VALID_TICKER_PATTERN = /^[A-Z0-9&-]+$/;

  let BATCH_SIZE = GM_getValue("batchSize", 10);
  let TAB_DELAY = GM_getValue("tabDelay", 200);
  let SAVED_TICKERS = GM_getValue("savedTickers", []);
  let LAST_TAB_INDEX = GM_getValue("lastTabIndex", 0);
  let PANEL_VISIBLE = GM_getValue("panelVisible", false);

  // Extract all tickers from all sectors for backward compatibility or global operations
  const ALL_SECTOR_TICKERS = Object.values(SECTOR_STOCKS).flat();

  // ================ STYLES ================
  const styles = `
        :root {
            --color-primary: #21808d;
            --color-bg: #fcfcf9;
            --color-surface: #f9f9fb;
            --color-text: #13343b;
            --color-border: #d3d3d3;
            --color-list-bg: #f3f5f6;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --color-primary: #32b8c6;
                --color-bg: #212222;
                --color-surface: #262828;
                --color-text: #f5f5f5;
                --color-border: #414141;
                --color-list-bg: #232829;
            }
        }
        #stock-ticker-widget {
            position:fixed;
            bottom:32px;
            left:32px;
            z-index:9999999;
            font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            max-width: 95vw;
            overflow: visible;
        }
        #stock-toggle-btn {width:56px;height:56px;border-radius:50%;background:var(--color-primary);color:#fff;border:none;cursor:pointer;font-size:25px;font-weight:700;box-shadow:0 2px 10px rgba(33,128,141,0.12);margin-bottom:8px;}
        #stock-toggle-btn:hover {background:#29b1c5;}
        #stock-main-panel {
            background:var(--color-surface);
            border:1px solid var(--color-border);
            border-radius:14px;
            width: 380px;
            height:560px;
            box-shadow:0 8px 21px rgba(33,128,141,.12);
            display:none;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
        }
        #stock-main-panel.visible {display:flex;}
        #stock-tab-bar {
            display:flex;
            width:100%;
            height:48px;
            border-bottom:1px solid var(--color-border);
            background:var(--color-bg);
            flex-shrink: 0;
            position: relative;
            z-index: 2;
            overflow: hidden;
        }
        .stock-panel-scroll {
            overflow-y: auto;
            overflow-x: hidden;
            height: 512px;
            flex: 1;
            min-height: 512px;
            max-height: 512px;
            position: relative;
        }
        .stock-panel-inner {
            padding:20px 22px 24px 22px;
            width:100%;
            box-sizing:border-box;
            overflow: hidden;
            position: relative;
        }
        .stock-tab-btn {
            flex:1 1 0;
            height:48px;
            border:none;
            background:var(--color-bg);
            color:var(--color-primary);
            font-weight:600;
            font-size:16px;
            cursor:pointer;
            margin:0;
            transition:background 0.22s;
            display:flex;
            align-items:center;
            justify-content:center;
            box-sizing: border-box;
            overflow: hidden;
        }
        .stock-tab-btn.active {background:var(--color-primary);color:#fff;}
        .divider {height:1px;background:var(--color-border);margin:18px 0 19px 0;border-radius:2px;}
        .stock-current-ticker {
            width:100%;
            padding:13px 0 13px 0;
            background:rgba(33,128,141,0.10);
            color:var(--color-primary);
            border-radius:8px;
            font-size:17px;
            font-weight:500;
            margin-bottom:18px;
            border:none;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            text-align: center;
        }
        .stock-current-ticker span {display:inline-flex;align-items:center;}
        .stock-current-ticker:disabled {opacity:0.46;cursor:not-allowed;}
        .stock-btn, .stock-batch-btn, .urls-clear-btn, .stock-btn.batch {width:100%;padding:11px 0 11px 0;background-color:var(--color-primary);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:600;margin-bottom:17px;transition:background 0.16s;box-shadow:0 1px 5px rgba(33,128,141,0.09);}
        .stock-batch-btn, .stock-btn.batch {margin-bottom:13px;}
        .stock-btn:active, .stock-batch-btn:active {transform:scale(0.98);}
        .stock-btn:disabled {opacity:0.65;}
        .stock-batch-btn {
            background-color:var(--color-primary);
            display: flex;
            align-items: center;
            justify-content: flex-start;
            text-align: left;
            gap: 10px;
            padding-left: 15px;
            padding-right: 12px;
        }
        .stock-batch-btn .badge { background:rgba(255,255,255,0.20);padding:2px 8px;border-radius:13px;font-size:12px;margin-left:auto;}
        .stock-batch-btn:last-child {margin-bottom:0;}

        /* Horizontal button layout for URLs tab */
        .urls-button-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 17px;
            width: 100%;
            align-items: stretch;
        }
        .urls-action-btn {
            flex: 1;
            min-width: 0;
            padding: 11px 8px;
            font-size: 15px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .urls-action-btn.stock-btn.batch {
            margin-bottom: 17px;
            font-size: 15px;
        }
        .urls-import-card {
            border: 1px solid var(--color-border);
            border-radius: 10px;
            background: var(--color-list-bg);
            padding: 16px;
            margin-bottom: 18px;
        }
        .urls-import-card .urls-list-title {
            margin-bottom: 8px;
        }
        .urls-import-helper {
            font-size: 13px;
            color: var(--color-text);
            margin-bottom: 10px;
        }
        .urls-import-text {
            width: 100%;
            min-height: 90px;
            resize: vertical;
            border-radius: 8px;
            border: 1px solid var(--color-border);
            padding: 10px 12px;
            font-size: 14px;
            background: var(--color-surface);
            color: var(--color-text);
            box-sizing: border-box;
        }
        .urls-import-text::placeholder {
            color: var(--color-text);
            opacity: 0.6;
        }
        .urls-import-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
        }
        .urls-import-btn {
            flex: 1 1 180px;
            padding: 10px 12px;
            font-size: 15px;
        }
        .urls-import-toggle {
            width: 100%;
            margin-top: 16px;
        }
        .urls-import-section {
            display: none;
            margin-top: 14px;
        }
        .urls-import-section.visible {
            display: block;
        }
        .stock-info-label {display:block;margin-bottom:23px;color:var(--color-primary);font-size:15px;font-weight:500;}
        .stock-config-row {margin-bottom:19px;}
        .stock-config-row label {font-size:13px;color:var(--color-text);display:block;margin-bottom:7px;}
        .stock-config-row input {width:100%;padding:9px 13px;border-radius:7px;border:1px solid var(--color-border);font-size:15px;background:var(--color-surface);color:var(--color-text);}
        .stock-config-row input::placeholder {color:var(--color-text);opacity:0.6;}
        .stock-config-row input:focus {outline:none;border-color:var(--color-primary);}
        .urls-list-title {font-size:15px;font-weight:600;color:var(--color-primary);margin-bottom:10px;display:inline-block;}
        .urls-list-label {font-size:13px;color:var(--color-text);font-weight:500;margin-bottom:0;}
        .urls-clear-btn {display:inline-block;margin:0 0 0 13px;color:#ca1f26;cursor:pointer;font-size:13px;background:transparent;border:none;font-weight:500;}
        .urls-list {
            margin:16px 0 0 0;
            padding:0;
            background:var(--color-list-bg);
            border-radius:10px;
            border:1px solid var(--color-border);
            max-height:260px;
            overflow-y:auto;
            overflow-x:hidden;
            box-sizing:border-box;
            width: 100%;
            position: relative;
        }
        .urls-list li {
            font-size:13px;
            padding:12px 14px;
            color:var(--color-text);
            background:transparent;
            border-bottom:1px solid var(--color-border);
            display:flex;
            align-items:center;
            justify-content:space-between;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            min-height: 48px;
            transition: background 0.15s, border-color 0.15s;
            border-radius: 0;
        }
        .urls-list li:last-child {border-bottom:none;border-bottom-left-radius:10px;border-bottom-right-radius:10px;}
        .urls-list li:first-child {border-top-left-radius:10px;border-top-right-radius:10px;}
        .urls-list li:hover {
            background: rgba(33,128,141,0.08);
        }
        @media (prefers-color-scheme: dark) {
            .urls-list li:hover {
                background: rgba(50,184,198,0.12);
            }
        }
        .ticker-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            flex: 1 1 auto;
        }
        .ticker-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 120px;
        }
        .ticker-index {
            width: 26px;
            height: 26px;
            border-radius: 7px;
            background: rgba(33,128,141,0.18);
            color: var(--color-primary);
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        @media (prefers-color-scheme: dark) {
            .ticker-index {
                background: rgba(50,184,198,0.25);
                color: #0c1f23;
            }
        }
        .ticker-symbol {
            font-weight: 600;
            font-size: 15px;
            color: var(--color-text);
            letter-spacing: 0.3px;
        }
        .ticker-row .url-remove-btn {
            margin-left: auto;
        }
        @media (prefers-color-scheme: dark) {
            .ticker-symbol {
                color: #f5f7f9;
            }
        }
        .ticker-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: flex-end;
            flex: 1 1 auto;
        }
        .ticker-action-btn {
            padding: 6px 10px;
            font-size: 13px;
            background: transparent;
            border: 1px solid var(--color-border);
            color: var(--color-primary);
            border-radius: 6px;
            box-shadow: none;
            margin-bottom: 0;
            min-height: 32px;
        }
        .ticker-action-btn:hover {
            background: var(--color-primary);
            color: #fff;
        }
        .ticker-action-btn:focus {
            outline: 2px solid rgba(33,128,141,0.5);
            outline-offset: 1px;
        }
        @media (prefers-color-scheme: dark) {
            .ticker-action-btn {
                color: #e6f7fa;
                border-color: rgba(230,247,250,0.35);
            }
            .ticker-action-btn:hover {
                color: #0b1f24;
                background: #32b8c6;
            }
        }
        .urls-list li:last-child {border-bottom:none;}
        .url-text-container {
            flex:1;
            overflow:hidden;
            min-width:0;
            max-width: calc(100% - 30px);
            position: relative;
        }
        .url-text {
            display:block;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            max-width:100%;
            width: 100%;
            box-sizing: border-box;
        }
        .url-text.truncated {
            position:relative;
        }
        .url-text.truncated::after {
            content:"";
            position:absolute;
            right:0;
            top:0;
            width:20px;
            height:100%;
            background:linear-gradient(to right, transparent, var(--color-list-bg));
            pointer-events:none;
        }
        .url-remove-btn {
            background:transparent;
            border:none;
            color:var(--color-primary);
            cursor:pointer;
            font-size:14px;
            font-weight:bold;
            margin-left:8px;
            padding:2px 6px;
            border-radius:3px;
            transition:background 0.13s;
            opacity:0.7;
            flex-shrink: 0;
            width: 22px;
            height: 22px;
            min-width: 22px;
            min-height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            overflow: hidden;
        }
        .url-remove-btn:hover {
            background:var(--color-primary);
            color:#fff;
            opacity:1;
        }
        @media (max-width: 600px) {
            #stock-main-panel {
                width:95vw !important;
                height:70vh !important;
                padding:12px !important;
                max-width: 95vw !important;
                overflow: hidden !important;
            }
            .stock-panel-scroll {
                height:calc(70vh - 48px) !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
            }
            .urls-button-container {
                gap: 8px !important;
            }
            .urls-action-btn {
                font-size: 13px !important;
                padding: 10px 6px !important;
            }
            .url-text-container {
                max-width: calc(100% - 25px) !important;
            }
            .url-remove-btn {
                width: 20px !important;
                height: 20px !important;
                min-width: 20px !important;
                min-height: 20px !important;
            }
        }
    `;

  // ================ UI HELPERS ================
  function divider() {
    const d = document.createElement("div");
    d.className = "divider";
    return d;
  }
  function labelSpan(text) {
    const s = document.createElement("span");
    s.className = "stock-info-label";
    s.textContent = text;
    return s;
  }
  function showToast(message) {
    const toast = document.getElementById("stock-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 2000);
  }

  // ================ URL OPEN HELPERS ================
  function openUrl(url, options = { active: false, insert: true }) {
    if (typeof GM_openInTab !== "undefined") {
      GM_openInTab(url, { active: options.active, insert: options.insert });
    } else {
      const win = window.open(url, "_blank");
      if (options.active && win) win.focus();
    }
  }
  function openOptionChain(ticker, active = true) {
    openUrl(OPTION_CHAIN_URL_TEMPLATE.replace("{TICKER}", ticker), {
      active,
      insert: true,
    });
  }
  function openLiveOptionsChart(ticker, active = true) {
    openUrl(LIVE_OPTIONS_CHARTS_URL_TEMPLATE.replace("{TICKER}", ticker), {
      active,
      insert: true,
    });
  }
  function openSpotChart(ticker, active = true) {
    openUrl(LIVE_SPOT_CHARTS_URL_TEMPLATE.replace("{TICKER}", ticker), {
      active,
      insert: true,
    });
  }
  function openTickerOptionChain(ticker, active = true) {
    if (!ticker) return;
    openOptionChain(ticker, active);
  }
  function openTickerLiveOptions(ticker, active = true) {
    if (!ticker) return;
    openLiveOptionsChart(ticker, active);
  }
  function openTickerSpotChart(ticker, active = true) {
    if (!ticker) return;
    openSpotChart(ticker, active);
  }

  function createDelaySettingRow(id) {
    const row = document.createElement("div");
    row.className = "stock-config-row";
    const label = document.createElement("label");
    label.textContent = "Tab Delay (ms)";
    const input = document.createElement("input");
    input.type = "number";
    input.value = TAB_DELAY;
    input.min = "0";
    input.max = "2000";
    input.step = "50";
    input.id = id;
    row.appendChild(label);
    row.appendChild(input);
    return { row, input };
  }
  function extractTickerFromURL() {
    const url = window.location.href;
    const patterns = [
      /tradingsymbol=([A-Z0-9&-]+)/i,
      /tradingSymbol=([A-Z0-9&-]+)/i,
      /symbol=([A-Z0-9&-]+)/i,
      /\/([A-Z0-9&-]+)(?:\/|\?|$)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    return null;
  }
  function parseTickerInput(rawInput) {
    if (rawInput == null) return [];
    let source = rawInput;
    if (typeof rawInput === "string") {
      const trimmed = rawInput.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          source = parsed;
        } else if (typeof parsed === "string") {
          source = parsed.split(/[\n\r,]+/);
        } else {
          source = trimmed.split(/[\n\r,]+/);
        }
      } catch (err) {
        source = trimmed.split(/[\n\r,]+/);
      }
    } else if (!Array.isArray(rawInput)) {
      source = [rawInput];
    }
    if (typeof source === "string") {
      source = source.split(/[\n\r,]+/);
    }
    return source
      .map((value) => String(value).trim().toUpperCase())
      .filter((value) => value && VALID_TICKER_PATTERN.test(value));
  }
  function fallbackClipboardCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!successful) {
      throw new Error("Copy command failed");
    }
  }
  function copyTextToClipboard(text) {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        fallbackClipboardCopy(text);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  function openCurrentTicker(ticker) {
    showToast(`Opening chart for ${ticker}`);
    openSpotChart(ticker, true);
  }
  function openBatch(tickers, batchInfo) {
    showToast(`Opening batch: ${batchInfo} (${tickers.length} tabs)`);
    tickers.forEach((ticker, index) => {
      const url = LIVE_OPTIONS_CHARTS_URL_TEMPLATE.replace("{TICKER}", ticker);
      setTimeout(() => {
        if (typeof GM_openInTab !== "undefined") {
          GM_openInTab(url, { active: false, insert: true });
        } else {
          window.open(url, "_blank");
        }
      }, index * TAB_DELAY);
    });
  }
  function batchOpenTickers(tickers, opener, label) {
    if (!tickers.length) {
      showToast(`No tickers to open for ${label}`);
      return;
    }

    tickers.forEach((ticker, idx) => {
      setTimeout(() => opener(ticker), idx * TAB_DELAY);
    });
    showToast(`Opening ${tickers.length} ${label}`);
  }

  // ================ CHARTS TOOLS TAB PANEL ================
  function panelChartsTools() {
    const inner = document.createElement("div");
    inner.className = "stock-panel-inner";

    // Current chart open (centered)
    const currentTicker = extractTickerFromURL();
    const currentTickerBtn = document.createElement("button");
    currentTickerBtn.className = "stock-current-ticker";
    currentTickerBtn.innerHTML = currentTicker
      ? `<span>Open Chart For ${currentTicker}</span><span>📈</span>`
      : `<span>No ticker detected in URL</span><span>⚠️</span>`;
    currentTickerBtn.disabled = !currentTicker;
    currentTickerBtn.addEventListener("click", () => {
      if (!currentTicker) return;
      openCurrentTicker(currentTicker);
    });
    inner.appendChild(currentTickerBtn);

    inner.appendChild(divider());

    // Display sector-wise buttons - one button per sector to open all stocks
    for (const [sectorName, sectorTickers] of Object.entries(SECTOR_STOCKS)) {
      const totalTickers = sectorTickers.length;

      inner.appendChild(
        labelSpan(`${sectorName} • ${totalTickers} tickers`)
      );

      const btn = document.createElement("button");
      btn.className = "stock-batch-btn";
      btn.innerHTML = `<span style="flex-shrink:0;">Open All Stocks</span><span class="badge">${totalTickers}</span>`;
      btn.addEventListener("click", () => openBatch(sectorTickers, `${sectorName} (${totalTickers} stocks)`));
      inner.appendChild(btn);

      inner.appendChild(divider());
    }

    // Integrated Settings Section
    inner.appendChild(labelSpan("Settings"));

    const { row: delayRow, input: delayInput } =
      createDelaySettingRow("tab-delay-input");
    inner.appendChild(delayRow);
    delayRow.querySelector("label").textContent = "Tab Delay (ms)";

    // Save Settings Button
    const saveBtn = document.createElement("button");
    saveBtn.className = "stock-btn";
    saveBtn.textContent = "Save Settings";
    saveBtn.addEventListener("click", () => {
      const newTabDelay = parseInt(delayInput.value);
      if (newTabDelay >= 0 && newTabDelay <= 2000) {
        GM_setValue("tabDelay", newTabDelay);
        TAB_DELAY = newTabDelay;
        showToast("Settings Saved!");
      } else {
        showToast("Invalid values.");
      }
    });
    inner.appendChild(saveBtn);

    return inner;
  }
  function panelAnalysisTools() {
    const inner = document.createElement("div");
    inner.className = "stock-panel-inner";

    const currentTicker = extractTickerFromURL();
    const status = document.createElement("div");
    status.className = "stock-info-label";
    status.textContent = currentTicker
      ? `Ticker detected: ${currentTicker}`
      : "No ticker detected in current URL";
    inner.appendChild(status);

    const buttonLabels = [
      {
        label: "Open Option Chain",
        action: () => currentTicker && openOptionChain(currentTicker),
      },
      {
        label: "Open Live Options Chart",
        action: () => currentTicker && openLiveOptionsChart(currentTicker),
      },
      {
        label: "Open Spot Chart",
        action: () => currentTicker && openSpotChart(currentTicker, true),
      },
    ];

    buttonLabels.forEach(({ label, action }) => {
      const btn = document.createElement("button");
      btn.className = "stock-btn";
      btn.textContent = label;
      btn.disabled = !currentTicker;
      btn.addEventListener("click", () => {
        action(true);
      });
      inner.appendChild(btn);
    });

    return inner;
  }

  // ================ SAVED URLS TOOLS TAB PANEL ================
  function panelSavedUrlsTools() {
    const inner = document.createElement("div");
    inner.className = "stock-panel-inner";

    // Horizontal button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "urls-button-container";

    // Save current ticker button
    const saveThisTickerBtn = document.createElement("button");
    saveThisTickerBtn.className = "stock-btn urls-action-btn";
    saveThisTickerBtn.textContent = "Save This Ticker";
    saveThisTickerBtn.addEventListener("click", () => {
      const ticker = extractTickerFromURL();
      if (!ticker) {
        showToast("No ticker detected");
        return;
      }
      SAVED_TICKERS = GM_getValue("savedTickers", []);
      if (SAVED_TICKERS.includes(ticker)) {
        showToast("Ticker already saved");
        return;
      }
      SAVED_TICKERS.push(ticker);
      GM_setValue("savedTickers", SAVED_TICKERS);
      showToast("Ticker saved!");
      updateTickerList();
    });
    buttonContainer.appendChild(saveThisTickerBtn);

    const openBatchTickerBtn = document.createElement("button");
    openBatchTickerBtn.className = "stock-btn batch urls-action-btn";
    openBatchTickerBtn.textContent = "Open All Live Charts";
    openBatchTickerBtn.addEventListener("click", () => {
      SAVED_TICKERS = GM_getValue("savedTickers", []);
      batchOpenTickers(SAVED_TICKERS, openTickerSpotChart, "spot charts");
    });
    buttonContainer.appendChild(openBatchTickerBtn);

    inner.appendChild(buttonContainer);

    inner.appendChild(divider());

    const listHeader = document.createElement("div");
    listHeader.className = "urls-list-label";
    listHeader.textContent = "Saved Tickers: ";

    const tickerCountSpan = document.createElement("span");
    tickerCountSpan.style.fontWeight = "bold";
    tickerCountSpan.style.marginLeft = "3px";
    listHeader.appendChild(tickerCountSpan);

    const clearBtn = document.createElement("button");
    clearBtn.className = "urls-clear-btn";
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", () => {
      GM_setValue("savedTickers", []);
      SAVED_TICKERS = [];
      showToast("Saved tickers cleared");
      updateTickerList();
    });
    listHeader.appendChild(clearBtn);

    inner.appendChild(listHeader);

    const tickerList = document.createElement("ul");
    tickerList.className = "urls-list";
    inner.appendChild(tickerList);

    inner.appendChild(buildImportExportCard());

    function actionButton(label, handler) {
      const btn = document.createElement("button");
      btn.className = "urls-action-btn ticker-action-btn";
      btn.textContent = label;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        handler();
      });
      return btn;
    }

    function buildImportExportCard() {
      const card = document.createElement("div");
      card.className = "urls-import-card";

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "stock-btn urls-import-toggle";
      toggleBtn.textContent = "Show Import / Export";

      const section = document.createElement("div");
      section.className = "urls-import-section";

      const importTitle = document.createElement("span");
      importTitle.className = "urls-list-title";
      importTitle.textContent = "Import / Export";
      section.appendChild(importTitle);

      const helper = document.createElement("div");
      helper.className = "urls-import-helper";
      helper.textContent =
        "Paste JSON array or comma/newline separated tickers. Export copies current list to clipboard.";
      section.appendChild(helper);

      const textArea = document.createElement("textarea");
      textArea.className = "urls-import-text";
      textArea.placeholder = 'TATASTEEL, SBIN, INFY or ["TATASTEEL","SBIN"]';
      section.appendChild(textArea);

      const importActions = document.createElement("div");
      importActions.className = "urls-import-actions";

      const importBtn = document.createElement("button");
      importBtn.className = "stock-btn urls-import-btn";
      importBtn.textContent = "Import";
      importBtn.addEventListener("click", () => {
        const parsed = parseTickerInput(textArea.value);
        if (!parsed.length) {
          showToast("No valid tickers to import");
          return;
        }
        const current = new Set(GM_getValue("savedTickers", []));
        parsed.forEach((ticker) => current.add(ticker));
        SAVED_TICKERS = Array.from(current);
        GM_setValue("savedTickers", SAVED_TICKERS);
        showToast(`Imported ${parsed.length} tickers`);
        updateTickerList();
        textArea.value = "";
      });
      importActions.appendChild(importBtn);

      const exportBtn = document.createElement("button");
      exportBtn.className = "stock-btn urls-import-btn";
      exportBtn.textContent = "Export";
      exportBtn.addEventListener("click", async () => {
        SAVED_TICKERS = GM_getValue("savedTickers", []);
        if (!SAVED_TICKERS.length) {
          showToast("No tickers to export");
          return;
        }
        try {
          await copyTextToClipboard(JSON.stringify(SAVED_TICKERS, null, 2));
          showToast("Tickers copied to clipboard");
        } catch (error) {
          console.error("Clipboard copy failed", error);
          showToast("Clipboard not available");
        }
      });
      importActions.appendChild(exportBtn);

      toggleBtn.addEventListener("click", () => {
        const isVisible = section.classList.toggle("visible");
        toggleBtn.textContent = isVisible
          ? "Hide Import / Export"
          : "Show Import / Export";
      });

      section.appendChild(importActions);
      card.appendChild(toggleBtn);
      card.appendChild(section);

      return card;
    }

    function updateTickerList() {
      tickerList.innerHTML = "";
      SAVED_TICKERS = GM_getValue("savedTickers", []);
      tickerCountSpan.textContent = `(${SAVED_TICKERS.length})`;
      SAVED_TICKERS.forEach((ticker, index) => {
        const li = document.createElement("li");
        li.classList.add("ticker-row");

        const meta = document.createElement("div");
        meta.className = "ticker-meta";

        const countBadge = document.createElement("span");
        countBadge.className = "ticker-index";
        countBadge.textContent = index + 1;

        const label = document.createElement("span");
        label.className = "url-text ticker-symbol";
        label.textContent = ticker;

        meta.appendChild(countBadge);
        meta.appendChild(label);
        li.appendChild(meta);

        const actionsWrapper = document.createElement("div");
        actionsWrapper.className = "ticker-actions";
        actionsWrapper.appendChild(
          actionButton("Option Chain", () => openTickerOptionChain(ticker)),
        );
        actionsWrapper.appendChild(
          actionButton("Live Options", () => openTickerLiveOptions(ticker)),
        );
        actionsWrapper.appendChild(
          actionButton("Spot Chart", () => openTickerSpotChart(ticker)),
        );

        const removeBtn = document.createElement("button");
        removeBtn.className = "url-remove-btn";
        removeBtn.textContent = "×";
        removeBtn.title = `Remove ${ticker}`;
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removeTicker(index);
        });

        li.appendChild(actionsWrapper);
        li.appendChild(removeBtn);
        tickerList.appendChild(li);
      });

      const existingCard = inner.querySelector(".urls-import-card");
      if (!existingCard) {
        const card = buildImportExportCard();
        inner.appendChild(card);
      } else if (!existingCard.isConnected) {
        inner.appendChild(existingCard);
      }
    }

    function removeTicker(index) {
      SAVED_TICKERS.splice(index, 1);
      GM_setValue("savedTickers", SAVED_TICKERS);
      updateTickerList();
      showToast("Ticker removed");
    }
    updateTickerList();

    return inner;
  }

  // ================ TAB BAR + PANEL INIT ================
  function createTabs() {
    const tabBar = document.createElement("div");
    tabBar.id = "stock-tab-bar";

    const chartsTab = document.createElement("button");
    chartsTab.textContent = "Charts Tools";
    chartsTab.className = "stock-tab-btn active";

    const urlsTab = document.createElement("button");
    urlsTab.textContent = "Saved Tickers";
    urlsTab.className = "stock-tab-btn";

    const analysisTab = document.createElement("button");
    analysisTab.textContent = "Analysis";
    analysisTab.className = "stock-tab-btn";

    tabBar.appendChild(chartsTab);
    tabBar.appendChild(urlsTab);
    tabBar.appendChild(analysisTab);

    const scrollPanel = document.createElement("div");
    scrollPanel.className = "stock-panel-scroll";

    const switchTab = (index, persist = true) => {
      chartsTab.classList.toggle("active", index === 0);
      urlsTab.classList.toggle("active", index === 1);
      analysisTab.classList.toggle("active", index === 2);
      scrollPanel.innerHTML = "";
      LAST_TAB_INDEX = index;
      if (persist) GM_setValue("lastTabIndex", index);
      if (index === 0) {
        scrollPanel.appendChild(panelChartsTools());
      } else if (index === 1) {
        scrollPanel.appendChild(panelSavedUrlsTools());
      } else {
        scrollPanel.appendChild(panelAnalysisTools());
      }
    };
    chartsTab.addEventListener("click", () => switchTab(0));
    urlsTab.addEventListener("click", () => switchTab(1));
    analysisTab.addEventListener("click", () => switchTab(2));

    return { tabBar, scrollPanel, switchTab };
  }

  // Main UI setup
  function createUI() {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    const widget = document.createElement("div");
    widget.id = "stock-ticker-widget";

    const toggleBtn = document.createElement("button");
    toggleBtn.id = "stock-toggle-btn";
    toggleBtn.innerHTML = "📊";
    toggleBtn.title = "Stock Ticker Tools";

    const mainOuterPanel = document.createElement("div");
    mainOuterPanel.id = "stock-main-panel";

    const { tabBar, scrollPanel, switchTab } = createTabs();
    mainOuterPanel.appendChild(tabBar);
    mainOuterPanel.appendChild(scrollPanel);

    switchTab(LAST_TAB_INDEX, false);

    if (PANEL_VISIBLE) {
      mainOuterPanel.classList.add("visible");
    }

    const toast = document.createElement("div");
    toast.id = "stock-toast";
    toast.textContent = "";
    document.body.appendChild(toast);

    toggleBtn.addEventListener("click", () => {
      const isVisible = mainOuterPanel.classList.toggle("visible");
      PANEL_VISIBLE = isVisible;
      GM_setValue("panelVisible", isVisible);
    });
    widget.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        mainOuterPanel.classList.remove("visible");
        PANEL_VISIBLE = false;
        GM_setValue("panelVisible", false);
      }
    });
    document.addEventListener("click", (e) => {
      if (!widget.contains(e.target)) {
        mainOuterPanel.classList.remove("visible");
        PANEL_VISIBLE = false;
        GM_setValue("panelVisible", false);
      }
    });

    widget.appendChild(toggleBtn);
    widget.appendChild(mainOuterPanel);
    document.body.appendChild(widget);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }
})();
