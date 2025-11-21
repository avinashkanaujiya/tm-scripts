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
        'ADANIPORTS', 'ASIANPAINT', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV',
        'BANDHANBNK', 'BANKBARODA', 'BEL', 'BHARTIARTL', 'BPCL', 'BRITANNIA', 'CIPLA', 
        'COALINDIA', 'DIVISLAB', 'DRREDDY', 'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK',
        'HDFCLIFE', 'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'INDIGO', 
        'INDUSINDBK', 'INFY', 'ITC', 'JSWSTEEL', 'KOTAKBANK', 'LT', 'M&M', 'MARUTI',
        'NESTLEIND', 'NTPC', 'ONGC', 'POWERGRID', 'RELIANCE', 'SBIN', 'SHREECEM',
        'SBILIFE', 'SUNPHARMA', 'TATACONSUM', 'TATASTEEL', 'TCS', 'TECHM', 'TITAN',
        'ULTRACEMCO', 'WIPRO'
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
            border-radius:8px;
            border:1px solid var(--color-border);
            max-height:120px;
            overflow-y:auto;
            overflow-x:hidden;
            box-sizing:border-box;
            width: 100%;
            position: relative;
        }
        .urls-list li {
            font-size:13px;
            padding:7px 12px;
            color:var(--color-text);
            background:transparent;
            border-bottom:1px solid var(--color-border);
            display:flex;
            align-items:center;
            justify-content:space-between;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            min-height: 32px;
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
        .url-text.truncated {position:relative;}
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
        .url-tooltip {
            position:relative;
            display:inline-block;
            cursor:help;
            max-width: 100%;
            overflow: hidden;
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
            ? `<span>Open Chart For ${currentTicker}</span><span>📈</span>`
            : `<span>No ticker detected in URL</span><span>⚠️</span>`;
        currentTickerBtn.disabled = !currentTicker;
        currentTickerBtn.addEventListener('click', () => {
            if (!currentTicker) return;
            openCurrentTicker(currentTicker);
        });
        inner.appendChild(currentTickerBtn);

        inner.appendChild(divider());

        inner.appendChild(labelSpan(`Nifty ${STOCK_TICKERS.length} tickers • ${Math.ceil(STOCK_TICKERS.length/BATCH_SIZE)} batches of ${BATCH_SIZE}`));
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

        // Integrated Settings Section
        inner.appendChild(labelSpan('Settings'));
        
        // Batch Size Configuration
        const batchRow = document.createElement('div');
        batchRow.className = 'stock-config-row';
        const batchLabel = document.createElement('label');
        batchLabel.textContent = 'Batch Size';
        const batchInput = document.createElement('input');
        batchInput.type = 'number';
        batchInput.value = BATCH_SIZE;
        batchInput.min = '1';
        batchInput.max = '50';
        batchInput.id = 'batch-size-input-charts';
        batchRow.appendChild(batchLabel);
        batchRow.appendChild(batchInput);
        inner.appendChild(batchRow);

        // Tab Delay Configuration
        const delayRow = document.createElement('div');
        delayRow.className = 'stock-config-row';
        const delayLabel = document.createElement('label');
        delayLabel.textContent = 'Tab Delay (ms)';
        const delayInput = document.createElement('input');
        delayInput.type = 'number';
        delayInput.value = TAB_DELAY;
        delayInput.min = '0';
        delayInput.max = '2000';
        delayInput.step = '50';
        delayInput.id = 'tab-delay-input-charts';
        delayRow.appendChild(delayLabel);
        delayRow.appendChild(delayInput);
        inner.appendChild(delayRow);

        // Save Settings Button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'stock-btn';
        saveBtn.textContent = 'Save Settings';
        saveBtn.addEventListener('click', () => {
            const newBatchSize = parseInt(batchInput.value);
            const newTabDelay = parseInt(delayInput.value);
            if (newBatchSize > 0 && newBatchSize <= 50 && newTabDelay >= 0 && newTabDelay <= 2000) {
                GM_setValue('batchSize', newBatchSize);
                GM_setValue('tabDelay', newTabDelay);
                BATCH_SIZE = newBatchSize;
                TAB_DELAY = newTabDelay;
                showToast('Settings Saved!');
            } else {
                showToast('Invalid values.');
            }
        });
        inner.appendChild(saveBtn);

        return inner;
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

        // Integrated Settings Section
        inner.appendChild(labelSpan('Settings'));
        
        // Tab Delay Configuration
        const delayRow = document.createElement('div');
        delayRow.className = 'stock-config-row';
        const delayLabel = document.createElement('label');
        delayLabel.textContent = 'Tab Delay (ms)';
        const delayInput = document.createElement('input');
        delayInput.type = 'number';
        delayInput.value = TAB_DELAY;
        delayInput.min = '0';
        delayInput.max = '2000';
        delayInput.step = '50';
        delayInput.id = 'tab-delay-input-urls';
        delayRow.appendChild(delayLabel);
        delayRow.appendChild(delayInput);
        inner.appendChild(delayRow);

        // Save Settings Button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'stock-btn batch';
        saveBtn.textContent = 'Save Delay Setting';
        saveBtn.addEventListener('click', () => {
            const val = parseInt(delayInput.value);
            if (val >= 0 && val <= 2000) {
                GM_setValue('tabDelay', val);
                TAB_DELAY = val;
                showToast('Saved!');
            } else {
                showToast('Invalid delay');
            }
        });
        inner.appendChild(saveBtn);

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
            SAVED_URLS.forEach((url, index) => {
                const li = document.createElement('li');
                
                // Create URL text container
                const urlTextContainer = document.createElement('div');
                urlTextContainer.className = 'url-text-container';
                
                // Create URL tooltip
                const urlTooltip = document.createElement('div');
                urlTooltip.className = 'url-tooltip';
                urlTooltip.setAttribute('tabindex', '0');
                urlTooltip.setAttribute('role', 'button');
                urlTooltip.setAttribute('aria-expanded', 'false');
                
                // Create truncated URL text
                const urlText = document.createElement('span');
                urlText.className = 'url-text';
                urlText.textContent = url;
                urlText.setAttribute('aria-describedby', `url-tooltip-${index}`);
                
                // Optimized DOM assembly for immediate rendering
                urlTooltip.appendChild(urlText);
                urlTooltip.title = url;
                urlTooltip.setAttribute('aria-label', url);
                urlTextContainer.appendChild(urlTooltip);
                
                // Fast truncation check without timing delays
                if (urlText.scrollWidth > urlText.clientWidth) {
                    urlText.classList.add('truncated');
                }
                
                // Create remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'url-remove-btn';
                removeBtn.textContent = '×';
                removeBtn.title = 'Remove URL';
                removeBtn.setAttribute('aria-label', `Remove URL: ${url}`);
                
                // Add click handler for remove functionality
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeUrl(index);
                });
                
                // Add to list item
                li.appendChild(urlTextContainer);
                li.appendChild(removeBtn);
                urlsList.appendChild(li);
            });
        }
        
        function removeUrl(index) {
            SAVED_URLS.splice(index, 1);
            GM_setValue('savedUrls', SAVED_URLS);
            updateUrlsList();
            showToast('URL removed');
        }
        updateUrlsList();

        return inner;
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
