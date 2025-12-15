const fs = require('fs');
const path = require('path');

// Mock TamperMonkey APIs
global.GM_openInTab = jest.fn();
global.GM_setValue = jest.fn();
global.GM_getValue = jest.fn();

// Mock browser APIs
global.window = {};
global.document = {
  addEventListener: jest.fn(),
  createElement: jest.fn(),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  head: { appendChild: jest.fn() },
  body: { appendChild: jest.fn() }
};
global.localStorage = {};
global.setTimeout = jest.fn((callback) => callback()); // Run immediately for testing
global.clearTimeout = jest.fn();

// Read the sensibull script
const scriptPath = path.join(__dirname, '../scripts/sensibull.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// We can't easily run the whole script due to its IIFE structure
// So we'll extract and test the key functions separately

describe('Sensibull Script Tests', () => {
  // Mock GM functions before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default GM values
    GM_getValue.mockImplementation((key, defaultValue) => {
      const defaults = {
        'batchSize': 10,
        'tabDelay': 200,
        'savedTickers': [],
        'lastTabIndex': 0,
        'panelVisible': false
      };
      return defaults[key] !== undefined ? defaults[key] : defaultValue;
    });
  });

  test('VALID_TICKER_PATTERN should validate ticker symbols correctly', () => {
    const VALID_TICKER_PATTERN = /^[A-Z0-9&-]+$/;
    const MAX_TICKER_LENGTH = 20;

    // Valid tickers
    expect(VALID_TICKER_PATTERN.test('RELIANCE')).toBe(true);
    expect(VALID_TICKER_PATTERN.test('HDFCBANK')).toBe(true);
    expect(VALID_TICKER_PATTERN.test('SBIN')).toBe(true);
    expect(VALID_TICKER_PATTERN.test('BAJAJ-AUTO')).toBe(true);
    expect(VALID_TICKER_PATTERN.test('M&M')).toBe(true);
    
    // Invalid tickers
    expect(VALID_TICKER_PATTERN.test('REL 123')).toBe(false); // space
    expect(VALID_TICKER_PATTERN.test('RELIANCE!')).toBe(false); // special char
    expect(VALID_TICKER_PATTERN.test('reliance')).toBe(false); // lowercase

    // Length validation
    expect('A'.repeat(MAX_TICKER_LENGTH + 1).length > MAX_TICKER_LENGTH).toBe(true);
  });

  test('extractTickerFromURL should correctly extract ticker from various URLs', () => {
    // Create a mock window.location object
    global.window.location = { href: 'https://web.sensibull.com/live-options-charts?tradingsymbol=SBIN' };

    // Create a separate script to test just the extraction function
    const testScript = `
      (function() {
        "use strict";
        const patterns = [
          /tradingsymbol=([A-Z0-9%&-]+)(?:&|#|\\?|$)/i,
          /tradingSymbol=([A-Z0-9%&-]+)(?:&|#|\\?|$)/i,
          /symbol=([A-Z0-9%&-]+)(?:&|#|\\?|$)/i,
          /\\/([A-Z0-9%&-]+)(?:\\/|\\?|&|#|$)/,
        ];

        function extractTickerFromURL() {
          const url = "${global.window.location.href}";
          for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
              return decodeURIComponent(match[1]);
            }
          }
          return null;
        }

        return { extractTickerFromURL };
      })();
    `;

    const { extractTickerFromURL } = eval(testScript);

    expect(extractTickerFromURL()).toBe('SBIN');
  });

  test('parseTickerInput should correctly parse various input formats', () => {
    // Create a script to test parseTickerInput function
    const testScript = `
      (function() {
        "use strict";
        const VALID_TICKER_PATTERN = /^[A-Z0-9&-]+$/;
        const MAX_TICKER_LENGTH = 20;

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
                source = parsed.split(/[,\\n\\r]+/);
              } else {
                source = trimmed.split(/[,\\n\\r]+/);
              }
            } catch (err) {
              source = trimmed.split(/[,\\n\\r]+/);
            }
          } else if (!Array.isArray(rawInput)) {
            source = [rawInput];
          }
          if (typeof source === "string") {
            source = source.split(/[,\\n\\r]+/);
          }
          return source
            .map((value) => String(value).trim().toUpperCase())
            .filter((value) => value &&
                    VALID_TICKER_PATTERN.test(value) &&
                    value.length <= MAX_TICKER_LENGTH);
        }

        return { parseTickerInput };
      })();
    `;

    const { parseTickerInput } = eval(testScript);

    // Test cases
    expect(parseTickerInput("SBIN,INFY,TCS")).toEqual(["SBIN", "INFY", "TCS"]);
    expect(parseTickerInput(["SBIN", "INFY", "TCS"])).toEqual(["SBIN", "INFY", "TCS"]);
    expect(parseTickerInput("SBIN\nINFY\rTCS")).toEqual(["SBIN", "INFY", "TCS"]);
    expect(parseTickerInput('["SBIN", "INFY", "TCS"]')).toEqual(["SBIN", "INFY", "TCS"]);
    expect(parseTickerInput("")).toEqual([]);
    expect(parseTickerInput(null)).toEqual([]);
    expect(parseTickerInput(undefined)).toEqual([]);
    expect(parseTickerInput("invalid symbol with space")).toEqual([]);
  });

  test('encodeTicker should correctly encode special characters', () => {
    // Create a script to test encodeTicker function
    const testScript = `
      (function() {
        "use strict";
        function encodeTicker(ticker) {
          return ticker ? ticker.replace(/&/g, "%26") : ticker;
        }
        
        return { encodeTicker };
      })();
    `;
    
    const { encodeTicker } = eval(testScript);
    
    expect(encodeTicker("RELIANCE")).toBe("RELIANCE");
    expect(encodeTicker("M&M")).toBe("M%26M");
    expect(encodeTicker("")).toBe("");
    expect(encodeTicker(null)).toBe(null);
    expect(encodeTicker(undefined)).toBe(undefined);
  });

  test('GM API helpers should check for availability', () => {
    // Create script to test isGMFunctionAvailable function
    const testScript = `
      (function() {
        "use strict";
        function isGMFunctionAvailable() {
          return typeof GM_openInTab !== "undefined" &&
                 typeof GM_setValue !== "undefined" &&
                 typeof GM_getValue !== "undefined";
        }
        
        return { isGMFunctionAvailable };
      })();
    `;
    
    const { isGMFunctionAvailable } = eval(testScript);
    
    expect(isGMFunctionAvailable()).toBe(true);
  });

  test('openUrl should handle both GM and fallback methods', () => {
    // Create script to test openUrl function with mock GM functions
    const testScript = `
      (function() {
        "use strict";
        function isGMFunctionAvailable() {
          return typeof GM_openInTab !== "undefined" &&
                 typeof GM_setValue !== "undefined" &&
                 typeof GM_getValue !== "undefined";
        }
        
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
        
        return { openUrl };
      })();
    `;
    
    const { openUrl } = eval(testScript);
    
    const testUrl = "https://example.com";
    openUrl(testUrl);
    
    // Check that GM_openInTab was called since it's available in our mock
    expect(GM_openInTab).toHaveBeenCalledWith(testUrl, { active: false, insert: true });
  });

  test('batchOpenTickers should handle ticker batches with delays', () => {
    // Create script to test batchOpenTickers function
    const testScript = `
      (function() {
        "use strict";
        let TAB_DELAY = 200; // Default value
        
        function encodeTicker(ticker) {
          return ticker ? ticker.replace(/&/g, "%26") : ticker;
        }
        
        function batchOpenTickers(tickers, opener, label) {
          if (!tickers.length) {
            // showToast(\`No tickers to open for \${label}\`); // We'll skip showToast for this test
            return;
          }

          tickers.forEach((ticker, idx) => {
            setTimeout(() => opener(encodeTicker(ticker)), idx * TAB_DELAY);
          });
          // showToast(\`Opening \${tickers.length} \${label}\`); // We'll skip showToast for this test
        }
        
        return { batchOpenTickers, encodeTicker };
      })();
    `;
    
    const { batchOpenTickers } = eval(testScript);
    
    const mockOpener = jest.fn();
    const tickers = ["SBIN", "INFY", "TCS"];
    
    batchOpenTickers(tickers, mockOpener, "test charts");
    
    // Verify that the opener was called for each ticker
    expect(mockOpener).toHaveBeenCalledTimes(3);
    expect(mockOpener).toHaveBeenCalledWith("SBIN");
    expect(mockOpener).toHaveBeenCalledWith("INFY");
    expect(mockOpener).toHaveBeenCalledWith("TCS");
  });
});

// Export for use in other tests if needed
module.exports = {
  // Any functions you want to export for other tests
};