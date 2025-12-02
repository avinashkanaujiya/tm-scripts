# Sensibull Stock Ticker Tools

A powerful TamperMonkey script that enhances the Sensibull trading platform with productivity tools for traders.

## Features

- **Batch Chart Opening**: Open charts for Nifty 50 stocks in configurable batches with customizable delays
- **Saved Tickers**: Save current tickers and access them later with one-click chart opening
- **Quick Chart Tools**: One-click access to different chart types for current ticker
- **Import/Export**: Import/export your saved tickers as JSON or comma-separated values
- **Customizable Settings**: Adjust batch size and tab opening delay to suit your needs
- **Responsive Design**: Works well on different screen sizes with dark mode support

## Installation

1. Install the [TamperMonkey browser extension](https://www.tampermonkey.net/) for your browser (Chrome, Firefox, Edge, etc.)
2. Click on the sensibull.js file in this repository
3. Copy the entire content of the file
4. In TamperMonkey, click on "Add a new script"
5. Replace the default content with the copied code
6. Save the script (Ctrl+S)
7. Navigate to [https://web.sensibull.com/](https://web.sensibull.com/) to start using the tools

## Usage

### Main Panel
- Look for the 📊 button in the bottom-left corner of Sensibull pages
- Click it to open the main tools panel
- Press `Escape` or click outside the panel to close it

### Tabs
1. **Charts Tools**:
   - Shows a list of Nifty 50 stocks in configurable batches
   - Open charts for current ticker if detected in URL
   - Adjust batch size and tab delay settings
   - Save settings to persist your preferences

2. **Saved Tickers**:
   - Save the current ticker from the URL with "Save This Ticker"
   - Open all saved tickers in batch mode
   - Individual ticker management with options for each ticker
   - Import/export tickers functionality
   - Clear all saved tickers with one click

3. **Analysis**:
   - Quick access to different chart types for the current ticker
   - Open Option Chain, Live Options Chart, or Spot Chart
   - Only active when a ticker is detected in the current URL

### Settings
- Batch Size: Number of tabs to open in each batch (1-50)
- Tab Delay: Time delay in milliseconds between opening tabs (0-2000ms)
- Settings are saved automatically using TamperMonkey's storage API

## Supported URLs
The script is designed to work on all Sensibull pages:
- `https://web.sensibull.com/*`

## Requirements
- TamperMonkey browser extension
- Modern web browser (Chrome, Firefox, Edge, Safari)

## Permissions
This script requests the following permissions:
- `GM_openInTab`: To open new tabs for stock charts
- `GM_setValue` / `GM_getValue`: To save and retrieve user preferences and saved tickers

## Contributing
1. Fork the repository
2. Make your changes to the sensibull.js file
3. Test the script in your TamperMonkey environment
4. Submit a pull request with your changes

## License
This project is licensed under the terms specified in the LICENSE file.