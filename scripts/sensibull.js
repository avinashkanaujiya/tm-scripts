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
    "Financial Services": [
      "HDFCBANK",
      "ICICIBANK",
      "SBIN",
      "BAJFINANCE",
      "KOTAKBANK",
      "AXISBANK",
      "BAJAJFINSV",
      "SBILIFE",
      "JIOFIN",
      "HDFCLIFE",
      "SHRIRAMFIN",
    ],
    "Information Technology": ["TCS", "INFY", "HCLTECH", "WIPRO", "TECHM"],
    "Automobile and Auto Components": [
      "MARUTI",
      "M&M",
      "BAJAJ-AUTO",
      "EICHERMOT",
      "TMPV",
    ],
    "Oil Gas & Consumable Fuels": ["RELIANCE", "ONGC", "COALINDIA"],
    "Metals & Mining": ["JSWSTEEL", "ADANIENT", "TATASTEEL", "HINDALCO"],
    FMCG: ["HINDUNILVR", "ITC", "NESTLEIND", "TATACONSUM"],
    Healthcare: ["SUNPHARMA", "CIPLA", "DRREDDY", "MAXHEALTH", "APOLLOHOSP"],
    Power: ["NTPC", "POWERGRID"],
    "Construction Materials": ["ULTRACEMCO", "GRASIM"],
    Telecommunications: ["BHARTIARTL"],
    Construction: ["LT"],
    Services: ["ADANIPORTS", "INDIGO"],
    "Capital Goods": ["BEL"],
    "Consumer Services": ["ETERNAL", "TRENT"],
    "Consumer Durables": ["TITAN", "ASIANPAINT"],
  };

  const VALID_TICKER_PATTERN = /^[A-Z0-9&-]+$/;
  const MAX_TICKER_LENGTH = 20; // Maximum length for ticker symbols
  const MIN_BATCH_SIZE = 1;
  const MAX_BATCH_SIZE = 100;
  const MIN_TAB_DELAY = 0;
  const MAX_TAB_DELAY = 5000; // Maximum delay in milliseconds

  // UI Constants
  const TOAST_DURATION = 2000; // milliseconds

  // UI Class Names
  const UI_CLASS_NAMES = {
    WIDGET_ID: 'stock-ticker-widget',
    TOGGLE_BTN_ID: 'stock-toggle-btn',
    MAIN_PANEL_ID: 'stock-main-panel',
    TAB_BAR_ID: 'stock-tab-bar',
    PANEL_SCROLL_CLASS: 'stock-panel-scroll',
    PANEL_INNER_CLASS: 'stock-panel-inner',
    TAB_BTN_CLASS: 'stock-tab-btn',
    CURRENT_TICKER_CLASS: 'stock-current-ticker',
    BTN_CLASS: 'stock-btn',
    BATCH_BTN_CLASS: 'stock-batch-btn',
    CLEAR_BTN_CLASS: 'urls-clear-btn',
    BATCH_BTN_BATCH_CLASS: 'stock-btn.batch',
    DIVIDER_CLASS: 'divider',
    INFO_LABEL_CLASS: 'stock-info-label',
    CONFIG_ROW_CLASS: 'stock-config-row',
    ACTIVE_TAB_CLASS: 'active',
    VISIBLE_PANEL_CLASS: 'visible',
    BADGE_CLASS: 'badge',
    URLS_BUTTON_CONTAINER_CLASS: 'urls-button-container',
    URLS_ACTION_BTN_CLASS: 'urls-action-btn',
    URLS_IMPORT_CARD_CLASS: 'urls-import-card',
    URLS_IMPORT_SECTION_CLASS: 'urls-import-section',
    URLS_IMPORT_TEXT_CLASS: 'urls-import-text',
    URLS_IMPORT_BTN_CLASS: 'urls-import-btn',
    URLS_IMPORT_TOGGLE_CLASS: 'urls-import-toggle',
    URLS_LIST_TITLE_CLASS: 'urls-list-title',
    URLS_LIST_LABEL_CLASS: 'urls-list-label',
    URLS_LIST_CLASS: 'urls-list',
    URLS_IMPORT_ACTIONS_CLASS: 'urls-import-actions',
    URLS_IMPORT_HELPER_CLASS: 'urls-import-helper',
    URLS_LIST_ITEM_CLASS: 'ticker-row',
    TICKER_META_CLASS: 'ticker-meta',
    TICKER_INDEX_CLASS: 'ticker-index',
    TICKER_SYMBOL_CLASS: 'ticker-symbol',
    URL_TEXT_CONTAINER_CLASS: 'url-text-container',
    URL_TEXT_CLASS: 'url-text',
    URL_REMOVE_BTN_CLASS: 'url-remove-btn',
    URL_TRUNCATED_CLASS: 'truncated',
    TICKER_ACTIONS_CLASS: 'ticker-actions',
    TICKER_ACTION_BTN_CLASS: 'ticker-action-btn'
  };

  // UI IDs
  const UI_IDS = {
    TOAST_ID: 'stock-toast',
    TAB_DELAY_INPUT_ID: 'tab-delay-input'
  };

  let BATCH_SIZE;
  let TAB_DELAY;
  let SAVED_TICKERS;
  let LAST_TAB_INDEX;
  let PANEL_VISIBLE;

  try {
    BATCH_SIZE = Math.min(MAX_BATCH_SIZE, Math.max(MIN_BATCH_SIZE, GM_getValue("batchSize", 10)));
    TAB_DELAY = Math.min(MAX_TAB_DELAY, Math.max(MIN_TAB_DELAY, GM_getValue("tabDelay", 200)));
    SAVED_TICKERS = GM_getValue("savedTickers", []);
    LAST_TAB_INDEX = GM_getValue("lastTabIndex", 0);
    PANEL_VISIBLE = GM_getValue("panelVisible", false);
  } catch (error) {
    console.error("Error initializing GM values:", error);
    BATCH_SIZE = 10;
    TAB_DELAY = 200;
    SAVED_TICKERS = [];
    LAST_TAB_INDEX = 0;
    PANEL_VISIBLE = false;
  }


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
            opacity: 0.03;
            transition: opacity 0.3s ease;
        }
        #stock-main-panel.visible {display:flex;}
        #stock-main-panel:hover {
            opacity: 1.0;
        }
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
    const toast = document.getElementById(UI_IDS.TOAST_ID);
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, TOAST_DURATION);
  }

  // ================ GM API HELPERS ================
  function isGMFunctionAvailable() {
    return typeof GM_openInTab !== "undefined" &&
           typeof GM_setValue !== "undefined" &&
           typeof GM_getValue !== "undefined";
  }

  // ================ URL OPEN HELPERS ================
  function openUrl(url, options = { active: false, insert: true }) {
    if (isGMFunctionAvailable() && typeof GM_openInTab !== "undefined") {
      try {
        GM_openInTab(url, { active: options.active, insert: options.insert });
      } catch (error) {
        console.error("GM_openInTab failed:", error);
        // Fallback to regular window.open if GM function fails
        const win = window.open(url, "_blank");
        if (options.active && win) win.focus();
      }
    } else {
      const win = window.open(url, "_blank");
      if (options.active && win) win.focus();
    }
  }

  // Generic function to open chart types
  function openChart(chartTemplate, ticker, active = true) {
    if (!ticker) return;
    const encodedTicker = encodeTicker(ticker);
    openUrl(chartTemplate.replace("{TICKER}", encodedTicker), {
      active,
      insert: true,
    });
  }

  function openOptionChain(ticker, active = true) {
    openChart(OPTION_CHAIN_URL_TEMPLATE, ticker, active);
  }

  function openLiveOptionsChart(ticker, active = true) {
    openChart(LIVE_OPTIONS_CHARTS_URL_TEMPLATE, ticker, active);
  }

  function openSpotChart(ticker, active = true) {
    openChart(LIVE_SPOT_CHARTS_URL_TEMPLATE, ticker, active);
  }

  function openTickerOptionChain(ticker, active = true) {
    openOptionChain(ticker, active);
  }

  function openTickerLiveOptions(ticker, active = true) {
    openLiveOptionsChart(ticker, active);
  }

  function encodeTicker(ticker) {
    // Replace ampersand with %26 to handle special characters in URLs
    return ticker ? ticker.replace(/&/g, "%26") : ticker;
  }

  function openTickerSpotChart(ticker, active = true) {
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
      /tradingsymbol=([A-Z0-9%&-]+)(?:&|#|\?|$)/i,
      /tradingSymbol=([A-Z0-9%&-]+)(?:&|#|\?|$)/i,
      /symbol=([A-Z0-9%&-]+)(?:&|#|\?|$)/i,
      /\/([A-Z0-9%&-]+)(?:\/|\?|&|#|$)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // Decode any percent-encoded characters (like %26 for &)
        // decodeURIComponent automatically converts %26 to &
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
      .filter((value) => value &&
              VALID_TICKER_PATTERN.test(value) &&
              value.length <= MAX_TICKER_LENGTH);
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
      const encodedTicker = encodeTicker(ticker);
      const url = LIVE_OPTIONS_CHARTS_URL_TEMPLATE.replace(
        "{TICKER}",
        encodedTicker,
      );
      setTimeout(() => {
        if (isGMFunctionAvailable() && typeof GM_openInTab !== "undefined") {
          try {
            GM_openInTab(url, { active: false, insert: true });
          } catch (error) {
            console.error("GM_openInTab failed:", error);
            // Fallback to regular window.open if GM function fails
            window.open(url, "_blank");
          }
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
      setTimeout(() => opener(encodeTicker(ticker)), idx * TAB_DELAY);
    });
    showToast(`Opening ${tickers.length} ${label}`);
  }

  // ================ CHARTS TOOLS TAB PANEL ================
  function panelChartsTools() {
    const inner = document.createElement("div");
    inner.className = "stock-panel-inner";

    // Create a function to update ticker display (keeping only the top section)
    function updateTickerDisplay() {
      // Get current elements that we want to preserve (settings section at the bottom)
      const existingChildren = Array.from(inner.children);
      const settingsElements = [];
      let settingsSectionStarted = false;

      // Look for the 'Settings' label and capture all elements after it
      for (let i = 0; i < existingChildren.length; i++) {
        if (existingChildren[i].textContent && existingChildren[i].textContent.includes('Settings')) {
          settingsSectionStarted = true;
        }
        if (settingsSectionStarted) {
          settingsElements.push(existingChildren[i]);
        }
      }

      // Clear only the content that needs to be refreshed (the top section)
      inner.innerHTML = '';

      // Detect current ticker and show it prominently
      const currentTicker = extractTickerFromURL();

      // Show the detected ticker name prominently
      const tickerDisplay = document.createElement("div");
      tickerDisplay.className = "stock-current-ticker";
      tickerDisplay.innerHTML = currentTicker
        ? `<span>Detected Ticker: <strong>${currentTicker}</strong></span>`
        : `<span><strong>No ticker detected in URL</strong></span>`;
      tickerDisplay.style.justifyContent = "center";
      tickerDisplay.style.fontSize = "18px";
      tickerDisplay.style.fontWeight = "bold";
      inner.appendChild(tickerDisplay);

      // Add buttons for spot chart and option chain if ticker is available
      if (currentTicker) {
        // Button for spot chart
        const spotChartBtn = document.createElement("button");
        spotChartBtn.className = "stock-btn";
        spotChartBtn.textContent = "Open Spot Chart";
        spotChartBtn.style.marginBottom = "12px";
        spotChartBtn.addEventListener("click", () => {
          openCurrentTicker(currentTicker);
        });
        inner.appendChild(spotChartBtn);

        // Button for option chain
        const optionChainBtn = document.createElement("button");
        optionChainBtn.className = "stock-btn";
        optionChainBtn.textContent = "Open Option Chain";
        optionChainBtn.addEventListener("click", () => {
          openTickerOptionChain(currentTicker);
        });
        inner.appendChild(optionChainBtn);
      } else {
        // Message when no ticker is detected
        const noTickerMessage = document.createElement("div");
        noTickerMessage.className = "ticker-message";
        noTickerMessage.style.textAlign = "center";
        noTickerMessage.style.margin = "15px 0";
        noTickerMessage.style.color = "var(--color-primary)";
        noTickerMessage.style.fontStyle = "italic";
        noTickerMessage.textContent =
          "Navigate to a Sensibull chart to see options here";
        inner.appendChild(noTickerMessage);
      }

      inner.appendChild(divider());

      // Display sector-wise buttons - one button per sector to open all stocks
      for (const [sectorName, sectorTickers] of Object.entries(SECTOR_STOCKS)) {
        const totalTickers = sectorTickers.length;

        inner.appendChild(labelSpan(`${sectorName} • ${totalTickers} tickers`));

        const btn = document.createElement("button");
        btn.className = "stock-batch-btn";
        btn.innerHTML = `<span style="flex-shrink:0;">Open All Stocks</span><span class="badge">${totalTickers}</span>`;
        btn.addEventListener("click", () =>
          openBatch(sectorTickers, `${sectorName} (${totalTickers} stocks)`),
        );
        inner.appendChild(btn);

        inner.appendChild(divider());
      }

      // Add Settings section if it doesn't exist
      if (settingsElements.length === 0) {
        inner.appendChild(divider());
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
            try {
              GM_setValue("tabDelay", newTabDelay);
              TAB_DELAY = newTabDelay;
              showToast("Settings Saved!");
            } catch (error) {
              console.error("Failed to save tab delay:", error);
              showToast("Failed to save settings. Please try again.");
            }
          } else {
            showToast("Invalid tab delay value. Must be between 0 and 2000 ms.");
          }
        });
        inner.appendChild(saveBtn);
      } else {
        // Re-add the preserved settings elements at the bottom
        settingsElements.forEach(element => inner.appendChild(element));
      }
    }

    // Initial call to populate the content
    updateTickerDisplay();

    // Store reference to update function
    inner.updateTickerDisplay = updateTickerDisplay;

    return inner;
  }
  function panelAnalysisTools() {
    const inner = document.createElement("div");
    inner.className = "stock-panel-inner";

    // Create a function to update ticker display
    function updateTickerDisplay() {
      // Find and remove existing status and button elements (but keep any others)
      const existingChildren = Array.from(inner.children);
      for (const child of existingChildren) {
        if (child.className === 'stock-info-label' ||
            (child.className === 'stock-btn' &&
             child.textContent.startsWith('Open'))) {
          inner.removeChild(child);
        }
      }

      const currentTicker = extractTickerFromURL();
      const status = document.createElement("div");
      status.className = "stock-info-label";
      status.textContent = currentTicker
        ? `Ticker detected: ${currentTicker}`
        : "No ticker detected in current URL";
      inner.insertBefore(status, inner.firstChild);

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
    }

    // Initial call to populate the content
    updateTickerDisplay();

    // Store reference to update function
    inner.updateTickerDisplay = updateTickerDisplay;

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
      if (ticker.length > MAX_TICKER_LENGTH) {
        showToast("Ticker name is too long");
        return;
      }

      try {
        SAVED_TICKERS = GM_getValue("savedTickers", []);
        if (SAVED_TICKERS.includes(ticker)) {
          showToast("Ticker already saved");
          return;
        }
        SAVED_TICKERS.push(ticker);
        GM_setValue("savedTickers", SAVED_TICKERS);
        showToast("Ticker saved!");
        updateTickerList();
      } catch (error) {
        console.error("Failed to save ticker:", error);
        showToast("Failed to save ticker. Please try again.");
      }
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
      try {
        GM_setValue("savedTickers", []);
        SAVED_TICKERS = [];
        showToast("Saved tickers cleared");
        updateTickerList();
      } catch (error) {
        console.error("Failed to clear saved tickers:", error);
        showToast("Failed to clear saved tickers. Please try again.");
      }
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
        try {
          const current = new Set(GM_getValue("savedTickers", []));
          parsed.forEach((ticker) => current.add(ticker));
          SAVED_TICKERS = Array.from(current);
          GM_setValue("savedTickers", SAVED_TICKERS);
          showToast(`Imported ${parsed.length} tickers`);
          updateTickerList();
          textArea.value = "";
        } catch (error) {
          console.error("Failed to import tickers:", error);
          showToast("Failed to import tickers. Please try again.");
        }
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
      try {
        SAVED_TICKERS.splice(index, 1);
        GM_setValue("savedTickers", SAVED_TICKERS);
        updateTickerList();
        showToast("Ticker removed");
      } catch (error) {
        console.error("Failed to remove ticker:", error);
        showToast("Failed to remove ticker. Please try again.");
      }
    }
    updateTickerList();

    // Store reference to update function
    inner.updateTickerDisplay = updateTickerList;

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
      LAST_TAB_INDEX = index;
      if (persist) {
        try {
          GM_setValue("lastTabIndex", index);
        } catch (error) {
          console.error("Failed to save last tab index:", error);
        }
      }

      // Clear the panel first
      scrollPanel.innerHTML = "";

      let panel;
      if (index === 0) {
        panel = panelChartsTools();
      } else if (index === 1) {
        panel = panelSavedUrlsTools();
      } else {
        panel = panelAnalysisTools();
      }

      scrollPanel.appendChild(panel);

      // If the panel has an updateTickerDisplay function, call it
      if (panel.updateTickerDisplay && typeof panel.updateTickerDisplay === 'function') {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          panel.updateTickerDisplay();
        }, 10);
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
      try {
        GM_setValue("panelVisible", isVisible);
      } catch (error) {
        console.error("Failed to save panel visibility:", error);
      }

      // If the panel is now visible, update the ticker display for the current tab
      if (isVisible) {
        setTimeout(() => {
          const activePanel = scrollPanel.querySelector('.stock-panel-inner');
          if (activePanel && activePanel.updateTickerDisplay && typeof activePanel.updateTickerDisplay === 'function') {
            activePanel.updateTickerDisplay();
          }
        }, 10);
      }
    });
    widget.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        mainOuterPanel.classList.remove("visible");
        PANEL_VISIBLE = false;
        try {
          GM_setValue("panelVisible", false);
        } catch (error) {
          console.error("Failed to save panel visibility:", error);
        }
      }
    });
    document.addEventListener("click", (e) => {
      if (!widget.contains(e.target)) {
        mainOuterPanel.classList.remove("visible");
        PANEL_VISIBLE = false;
        try {
          GM_setValue("panelVisible", false);
        } catch (error) {
          console.error("Failed to save panel visibility:", error);
        }
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
