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
// ==/UserScript==

(function () {
    'use strict';

    // ================ CONFIGURATION ================
    const LIVE_OPTIONS_CHARTS_URL_TEMPLATE = 'https://web.sensibull.com/live-options-charts?tradingsymbol={TICKER}';
    const LIVE_SPOT_CHARTS_URL_TEMPLATE = 'https://web.sensibull.com/chart?tradingSymbol={TICKER}';
    const STOCK_TICKERS = [
        'HDFCBANK', 'RELIANCE', 'ICICIBANK', 'BHARTIARTL', 'INFY', 'LT', 'SBIN', 'AXISBANK',
        'ITC', 'M&M', 'TCS', 'KOTAKBANK', 'BAJFINANCE', 'HINDUNILVR', 'MARUTI', 'ETERNAL', 'SUNPHARMA',
        'HCLTECH', 'NTPC', 'BEL', 'TITAN', 'TATASTEEL', 'ULTRACEMCO', 'ASIANPAINT', 'POWERGRID', 'INDIGO',
        'BAJAJFINSV', 'HINDALCO', 'ADANIPORTS', 'SHRIRAMFIN', 'JIOFIN', 'BAJAJ-AUTO', 'JSWSTEEL', 'EICHERMOT',
        'ONGC', 'NESTLEIND', 'TECHM', 'TRENT', 'COALINDIA', 'SBILIFE', 'CIPLA', 'MAXHEALTH', 'GRASIM',
        'TATACONSUM', 'APOLLOHOSP', 'TMPV', 'DRREDDY', 'HDFCLIFE', 'WIPRO', 'ADANIENT'
    ];

    let BATCH_SIZE = GM_getValue('batchSize', 10);
    let TAB_DELAY = GM_getValue('tabDelay', 200);
    let SAVED_URLS = GM_getValue('savedUrls', []);

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
        #stock-ticker-widget {position:fixed;bottom:32px;left:32px;z-index:9999999;font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
        #stock-toggle-btn {width:56px;height:56px;border-radius:50%;background:var(--color-primary);color:#fff;border:none;cursor:pointer;font-size:25px;font-weight:700;box-shadow:0 2px 10px rgba(33,128,141,0.12);margin-bottom:8px;}
        #stock-toggle-btn:hover {background:#29b1c5;}
        #stock-main-panel {
            background:var(--color-surface);
            border:1px solid var(--color-border);
            border-radius:14px;
            min-width:330px;
            max-width:380px;
            max-height:560px;
            box-shadow:0 8px 21px rgba(33,128,141,.12);
            display:none;
        }
        #stock-main-panel.visible {display:block;}
        #stock-tab-bar {
            display:flex;
            width:100%;
            border-bottom:1px solid var(--color-border);
            background:var(--color-bg);
            position: sticky;
            top: 0;
            left: 0;
            z-index: 2;
        }
        .stock-panel-scroll {
            overflow-y: auto;
            min-height: 150px;
            max-height: 458px;
        }
        .stock-panel-inner {padding:20px 22px 24px 22px;}
        .stock-tab-btn {flex:1 1 0;padding:13px 0 11px 0;border:none;background:var(--color-bg);color:var(--color-primary);font-weight:600;font-size:16px;cursor:pointer;margin:0;transition:background 0.22s;}
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
        }
        .stock-batch-btn .badge { background:rgba(255,255,255,0.20);padding:2px 8px;border-radius:13px;font-size:12px;margin-left:auto;}
        .stock-batch-btn:last-child {margin-bottom:0;}
        .stock-info-label {display:block;margin-bottom:23px;color:var(--color-primary);font-size:15px;font-weight:500;}
        .stock-config-row {margin-bottom:19px;}
        .stock-config-row label {font-size:13px;color:var(--color-text);display:block;margin-bottom:7px;}
        .stock-config-row input {width:100%;padding:9px 13px;border-radius:7px;border:1px solid var(--color-border);font-size:15px;}
        .stock-config-row input:focus {outline:none;border-color:var(--color-primary);}
        .urls-list-title {font-size:15px;font-weight:600;color:var(--color-primary);margin-bottom:10px;display:inline-block;}
        .urls-list-label {font-size:13px;color:var(--color-text);font-weight:500;margin-bottom:0;}
        .urls-clear-btn {display:inline-block;margin:0 0 0 13px;color:#ca1f26;cursor:pointer;font-size:13px;background:transparent;border:none;font-weight:500;}
        .urls-list {margin:16px 0 0 0;padding:0;background:var(--color-list-bg);border-radius:8px;border:1px solid var(--color-border);max-height:120px;overflow-y:auto;box-sizing:border-box;}
        .urls-list li {font-size:13px;padding:7px 12px;color:var(--color-text);background:transparent;border-bottom:1px solid var(--color-border);}
        .urls-list li:last-child {border-bottom:none;}
        .toggle-settings-btn {background:var(--color-bg);color:var(--color-primary);border:1px solid var(--color-border);border-radius:7px;padding:7px 0;font-size:15px;font-weight:600;width:100%;margin-bottom:13px;cursor:pointer;transition:background 0.13s;}
        .toggle-settings-btn.active {background:var(--color-primary);color:#fff;}
        .settings-panel {background:var(--color-bg);border-radius:11px;padding:16px 12px 9px 12px;margin-bottom:18px;border:1px solid var(--color-border);box-shadow:0 1px 2px rgba(33,128,141,0.06);display:none;}
        .settings-panel.visible {display:block;}
        @media (max-width: 600px) {#stock-main-panel,.stock-panel-inner{min-width:98vw !important;max-width:99vw !important;padding:12px !important;}}
    `;

    // ================ UI HELPERS ================
    function divider() {
        const d = document.createElement('div');
        d.className = 'divider';
        return d;
    }
    function labelSpan(text) {
        const s = document.createElement('span');
        s.className = 'stock-info-label';
        s.textContent = text;
        return s;
    }
    function showToast(message) {
        const toast = document.getElementById('stock-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 2000);
    }
    function extractTickerFromURL() {
        const url = window.location.href;
        const patterns = [
            /tradingsymbol=([A-Z0-9&-]+)/i,
            /tradingSymbol=([A-Z0-9&-]+)/i,
            /symbol=([A-Z0-9&-]+)/i,
            /\/([A-Z0-9&-]+)(?:\/|\?|$)/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return decodeURIComponent(match[1]);
            }
        }
        return null;
    }
    function openCurrentTicker(ticker) {
        showToast(`Opening chart for ${ticker}`);
        const url = LIVE_SPOT_CHARTS_URL_TEMPLATE.replace('{TICKER}', ticker);
        if (typeof GM_openInTab !== 'undefined') {
            GM_openInTab(url, { active: true, insert: true });
        } else {
            window.open(url, '_blank').focus();
        }
    }
    function openBatch(tickers, batchNum) {
        showToast(`Batch ${batchNum}: Opening ${tickers.length} tabs`);
        tickers.forEach((ticker, index) => {
            const url = LIVE_OPTIONS_CHARTS_URL_TEMPLATE.replace('{TICKER}', ticker);
            setTimeout(() => {
                if (typeof GM_openInTab !== 'undefined') {
                    GM_openInTab(url, { active: false, insert: true });
                } else {
                    window.open(url, '_blank');
                }
            }, index * TAB_DELAY);
        });
    }
    function batchOpenSavedTabs() {
        SAVED_URLS = GM_getValue('savedUrls', []);
        if (!SAVED_URLS.length) {
            showToast('No URLs to open');
            return;
        }
        SAVED_URLS.forEach((url, idx) => {
            setTimeout(() => {
                if (typeof GM_openInTab !== 'undefined') {
                    GM_openInTab(url, { active: false, insert: true });
                } else {
                    window.open(url, '_blank');
                }
            }, idx * TAB_DELAY);
        });
        showToast('Opening ' + SAVED_URLS.length + ' tabs');
    }

    // ================ CHARTS TOOLS TAB PANEL ================
    function panelChartsTools() {
        const inner = document.createElement('div');
        inner.className = 'stock-panel-inner';

        // Current chart open (centered)
        const currentTicker = extractTickerFromURL();
        const currentTickerBtn = document.createElement('button');
        currentTickerBtn.className = 'stock-current-ticker';
        currentTickerBtn.innerHTML = currentTicker
            ? `<span style="margin-right:7px;">Open Chart For <span class="ticker-symbol">${currentTicker}</span></span><span>📈</span>`
            : `<span>No ticker detected in URL</span><span>⚠️</span>`;
        currentTickerBtn.disabled = !currentTicker;
        currentTickerBtn.addEventListener('click', () => {
            if (!currentTicker) return;
            openCurrentTicker(currentTicker);
        });
        inner.appendChild(currentTickerBtn);

        inner.appendChild(divider());

        inner.appendChild(labelSpan(`${STOCK_TICKERS.length} tickers • ${Math.ceil(STOCK_TICKERS.length/BATCH_SIZE)} batches of ${BATCH_SIZE}`));
        for (let i = 0; i < STOCK_TICKERS.length; i += BATCH_SIZE) {
            const batchNum = Math.floor(i/BATCH_SIZE) + 1,
                tickersInBatch = STOCK_TICKERS.slice(i, Math.min(i+BATCH_SIZE, STOCK_TICKERS.length));
            const btn = document.createElement('button');
            btn.className = 'stock-batch-btn';
            btn.innerHTML = `<span style="flex-shrink:0;">Batch ${batchNum}: ${tickersInBatch[0]} - ${tickersInBatch[tickersInBatch.length-1]}</span><span class="badge">${tickersInBatch.length}</span>`;
            btn.addEventListener('click', () => openBatch(tickersInBatch, batchNum));
            inner.appendChild(btn);
        }

        inner.appendChild(divider());

        // Settings toggle
        const settingsToggle = document.createElement('button');
        settingsToggle.className = 'toggle-settings-btn';
        settingsToggle.textContent = '⚙ Settings';
        settingsToggle.addEventListener('click', () => {
            settingsToggle.classList.toggle('active');
            settingsPanel.classList.toggle('visible');
        });
        inner.appendChild(settingsToggle);

        // config form wrapped inside a hidden panel
        const settingsPanel = document.createElement('div');
        settingsPanel.className = 'settings-panel';
        settingsPanel.appendChild(configForm(() => {
            settingsPanel.classList.remove('visible');
            settingsToggle.classList.remove('active');
        }));
        inner.appendChild(settingsPanel);

        return inner;
    }

    function configForm(closePanelCallback) {
        const wrap = document.createElement('div');
        // Batch Size
        const batchRow = document.createElement('div');
        batchRow.className = 'stock-config-row';
        batchRow.innerHTML = `<label>Batch Size</label>
            <input type="number" id="batch-size-input" value="${BATCH_SIZE}" min="1" max="50">`;
        wrap.appendChild(batchRow);
        // Tab Delay
        const delayRow = document.createElement('div');
        delayRow.className = 'stock-config-row';
        delayRow.innerHTML = `<label>Tab Delay (ms)</label>
            <input type="number" id="tab-delay-input" value="${TAB_DELAY}" min="0" max="2000" step="50">`;
        wrap.appendChild(delayRow);
        const saveBtn = document.createElement('button');
        saveBtn.className = 'stock-btn';
        saveBtn.textContent = 'Save Settings';
        saveBtn.addEventListener('click', () => {
            const newBatchSize = parseInt(document.getElementById('batch-size-input').value);
            const newTabDelay = parseInt(document.getElementById('tab-delay-input').value);
            if (newBatchSize > 0 && newBatchSize <= 50 && newTabDelay >= 0 && newTabDelay <= 2000) {
                GM_setValue('batchSize', newBatchSize);
                GM_setValue('tabDelay', newTabDelay);
                BATCH_SIZE = newBatchSize;
                TAB_DELAY = newTabDelay;
                showToast('Settings Saved!');
                if (closePanelCallback) closePanelCallback();
            } else {
                showToast('Invalid values.');
            }
        });
        wrap.appendChild(saveBtn);

        return wrap;
    }

    // ================ SAVED URLS TOOLS TAB PANEL ================
    function panelSavedUrlsTools() {
        const inner = document.createElement('div');
        inner.className = 'stock-panel-inner';

        // Save current tab button
        const saveThisTabBtn = document.createElement('button');
        saveThisTabBtn.className = 'stock-btn';
        saveThisTabBtn.textContent = 'Save This Tab';
        saveThisTabBtn.addEventListener('click', () => {
            const url = window.location.href.split('#')[0];
            SAVED_URLS = GM_getValue('savedUrls', []);
            if (SAVED_URLS.includes(url)) {
                showToast('Already saved');
                return;
            }
            SAVED_URLS.push(url);
            GM_setValue('savedUrls', SAVED_URLS);
            showToast('Tab URL saved!');
            updateUrlsList();
        });
        inner.appendChild(saveThisTabBtn);

        const openBtn = document.createElement('button');
        openBtn.className = 'stock-btn batch';
        openBtn.textContent = 'Batch Open Saved URLs';
        openBtn.addEventListener('click', () => batchOpenSavedTabs());
        inner.appendChild(openBtn);

        inner.appendChild(divider());

        // Settings toggle
        const settingsToggle = document.createElement('button');
        settingsToggle.className = 'toggle-settings-btn';
        settingsToggle.textContent = '⚙ Settings';
        settingsToggle.addEventListener('click', () => {
            settingsToggle.classList.toggle('active');
            settingsPanel.classList.toggle('visible');
        });
        inner.appendChild(settingsToggle);

        const settingsPanel = document.createElement('div');
        settingsPanel.className = 'settings-panel';
        settingsPanel.appendChild(configFormUrls(() => {
            settingsPanel.classList.remove('visible');
            settingsToggle.classList.remove('active');
        }));
        inner.appendChild(settingsPanel);

        // List label and clear
        const urlsListLabel = document.createElement('div');
        urlsListLabel.className = 'urls-list-label';
        urlsListLabel.textContent = 'Saved URLs: ';

        // Count
        const urlCountSpan = document.createElement('span');
        urlCountSpan.style.fontWeight = 'bold';
        urlCountSpan.style.marginLeft = '3px';
        urlsListLabel.appendChild(urlCountSpan);

        // Clear btn
        const clearBtn = document.createElement('button');
        clearBtn.className = 'urls-clear-btn';
        clearBtn.textContent = "Clear";
        clearBtn.addEventListener('click', () => {
            GM_setValue('savedUrls', []);
            SAVED_URLS = [];
            showToast('Saved URLs cleared');
            updateUrlsList();
        });
        urlsListLabel.appendChild(clearBtn);

        inner.appendChild(urlsListLabel);

        // List
        const urlsList = document.createElement('ul');
        urlsList.className = 'urls-list';
        inner.appendChild(urlsList);

        function updateUrlsList() {
            urlsList.innerHTML = '';
            SAVED_URLS = GM_getValue('savedUrls', []);
            urlCountSpan.textContent = `(${SAVED_URLS.length})`;
            SAVED_URLS.forEach(url => {
                const li = document.createElement('li');
                li.textContent = url;
                urlsList.appendChild(li);
            });
        }
        updateUrlsList();

        return inner;
    }

    function configFormUrls(closePanelCallback) {
        const wrap = document.createElement('div');
        // Delay
        const delayRow = document.createElement('div');
        delayRow.className = 'stock-config-row';
        delayRow.innerHTML = `<label>Tab Delay (ms)</label>
            <input type="number" id="tab-delay-urls-input" value="${TAB_DELAY}" min="0" max="2000" step="50">`;
        wrap.appendChild(delayRow);
        const saveBtn = document.createElement('button');
        saveBtn.className = 'stock-btn batch';
        saveBtn.textContent = 'Save Delay Setting';
        saveBtn.addEventListener('click', () => {
            const val = parseInt(document.getElementById('tab-delay-urls-input').value);
            if (val >= 0 && val <= 2000) {
                GM_setValue('tabDelay', val);
                TAB_DELAY = val;
                showToast('Saved!');
                if (closePanelCallback) closePanelCallback();
            } else {
                showToast('Invalid delay');
            }
        });
        wrap.appendChild(saveBtn);
        return wrap;
    }

    // ================ TAB BAR + PANEL INIT ================
    function createTabs() {
        const tabBar = document.createElement('div');
        tabBar.id = 'stock-tab-bar';

        const chartsTab = document.createElement('button');
        chartsTab.textContent = "Charts Tools";
        chartsTab.className = 'stock-tab-btn active';

        const urlsTab = document.createElement('button');
        urlsTab.textContent = "Saved URLs Tools";
        urlsTab.className = 'stock-tab-btn';

        tabBar.appendChild(chartsTab);
        tabBar.appendChild(urlsTab);

        let panelContent1 = panelChartsTools();
        let panelContent2 = panelSavedUrlsTools();

        const scrollPanel = document.createElement('div');
        scrollPanel.className = 'stock-panel-scroll';

        const switchTab = (index) => {
            chartsTab.classList.toggle('active', index === 0);
            urlsTab.classList.toggle('active', index === 1);
            scrollPanel.innerHTML = '';
            if (index === 0) scrollPanel.appendChild(panelContent1);
            else scrollPanel.appendChild(panelContent2);
        };
        chartsTab.addEventListener('click', () => switchTab(0));
        urlsTab.addEventListener('click', () => switchTab(1));

        return { tabBar, scrollPanel, switchTab };
    }

    // Main UI setup
    function createUI() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        const widget = document.createElement('div');
        widget.id = 'stock-ticker-widget';

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'stock-toggle-btn';
        toggleBtn.innerHTML = '📊';
        toggleBtn.title = 'Stock Ticker Tools';

        const mainOuterPanel = document.createElement('div');
        mainOuterPanel.id = 'stock-main-panel';

        const { tabBar, scrollPanel, switchTab } = createTabs();
        mainOuterPanel.appendChild(tabBar);
        mainOuterPanel.appendChild(scrollPanel);

        switchTab(0);

        const toast = document.createElement('div');
        toast.id = 'stock-toast';
        toast.textContent = '';
        document.body.appendChild(toast);

        toggleBtn.addEventListener('click', () => {
            mainOuterPanel.classList.toggle('visible');
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                mainOuterPanel.classList.remove('visible');
            }
        });
        document.addEventListener('click', (e) => {
            if (!widget.contains(e.target)) {
                mainOuterPanel.classList.remove('visible');
            }
        });

        widget.appendChild(toggleBtn);
        widget.appendChild(mainOuterPanel);
        document.body.appendChild(widget);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})();
