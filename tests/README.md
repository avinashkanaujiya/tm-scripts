# Tests for TamperMonkey Scripts

This directory contains tests for the various TamperMonkey scripts in this repository.

## Running Tests

To run all tests:
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

To run a specific test file:
```bash
npx jest tests/test-sensibull.js
```

## Test Structure

Each test file is named following the pattern `test-{script-name}.js` and contains:

- Unit tests for individual functions
- Mock implementations of browser and TamperMonkey APIs
- Various test cases to ensure proper functionality

## Sensibull Script Tests

The `test-sensibull.js` file tests various functions from the sensibull.js script:

- `VALID_TICKER_PATTERN` - Validates ticker symbols
- `extractTickerFromURL` - Extracts ticker from URL
- `parseTickerInput` - Parses different input formats
- `encodeTicker` - Encodes special characters
- `isGMFunctionAvailable` - Checks GM API availability
- `openUrl` - Opens URLs using GM API or fallback
- `batchOpenTickers` - Opens multiple tickers with delays

## Adding New Tests

When adding new tests for TamperMonkey scripts, follow these best practices:

1. Create a new test file in the format `test-{script-name}.js`
2. Mock the necessary browser and GM APIs as done in the existing tests
3. Write unit tests for individual functions
4. Test different input scenarios and edge cases
5. Update this README if new test files are added
