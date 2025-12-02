# TamperMonkey Scripts Collection - Project Context

## Project Overview

This repository is a collection of powerful TamperMonkey scripts for various websites and tools used in day-to-day activities to boost productivity and enhance user experience. The primary goal is to house multiple useful userscripts that can improve efficiency and usability for different web platforms.

The collection currently starts with a comprehensive script for the Sensibull trading platform, but is designed to accommodate additional scripts in the future. Each script is focused on solving specific problems or adding useful functionality to commonly used web applications.

### Current Scripts

**1. Sensibull Stock Ticker Tools (sensibull.js)**
- A powerful TamperMonkey script that enhances the Sensibull trading platform with productivity tools for traders
- Features include batch chart opening, saved tickers, quick chart tools, import/export functionality, and customizable settings
- Version 2.8 with responsive design and dark mode support

## Technical Architecture

### Technology Stack
- **Language:** Plain JavaScript for TamperMonkey userscript
- **APIs:** TamperMonkey's GM_* APIs (GM_openInTab, GM_setValue, GM_getValue)
- **Compatibility:** Modern browsers (Chrome, Firefox, Edge, Safari)

### File Structure
- `sensibull.js`: Main TamperMonkey script file with comprehensive functionality
- `README.md`: Documentation for the script collection with installation and usage instructions
- `PLAN.md`: Project goals, implementation plan and coding guidelines
- `LICENSE`: MIT License for code distribution
- `QWEN.md`: Contextual information for AI agents (this file)
- `.qwenignore`: Files to be ignored by Qwen Code

### Development Conventions

#### Coding Guidelines
- Focus on clean, readable JavaScript code suitable for browser environments
- Implement proper error handling for browser APIs and DOM manipulation
- Follow JavaScript best practices and maintainability standards
- Use meaningful variable and function names
- Follow the DRY (Don't Repeat Yourself) principle
- Avoid code duplication and use abstraction to reduce complexity
- Follow the KISS (Keep It Simple, Stupid) principle
- Follow the YAGNI (You Aren't Gonna Need It) principle
- Make every aspect of the script configurable through GM_getValue and GM_getValue
- Set up proper logging for debugging purposes
- Do not use any hard-coded data anywhere in the code, not even for temporary purposes

#### Git Commit Strategy
- Use conventional commits format: `<type>(<scope>): <subject>`
- Types include: feat (new feature), fix (bug fix), test (test additions), refactor (code restructuring), docs (documentation), chore (tooling), perf (performance improvements)
- Use imperative mood ("add" not "added" or "adds")
- Follow atomic commit principles: one logical change per commit
- Include descriptions when necessary, wrapped at 72 characters
- Reference issues with "Fixes #123" in footer when applicable

#### Security and Best Practices
- Use proper @grant permissions for GM_* functions
- Validate all user inputs and ticker symbols
- Sanitize data before using in DOM operations
- Avoid storing sensitive data in plain text
- Use proper selectors to avoid conflicts with website updates
- Ensure script doesn't interfere with website functionality
- Handle GM_* functions availability properly
- Use GM_openInTab safely with appropriate options
- Store user preferences securely with GM_setValue/GM_getValue

### Testing Strategy
- Manual testing on target websites (e.g., sensibull.com)
- Verify all features work properly in TamperMonkey environment
- Cross-browser testing (Chrome, Firefox, Edge)
- Test with different screen sizes and resolutions
- Test error handling for invalid inputs
- Verify functionality when TamperMonkey APIs are unavailable
- Test with various types of ticker symbols

## Installation and Usage

To use any script in this collection:
1. Install the [TamperMonkey browser extension](https://www.tampermonkey.net/)
2. Navigate to the specific .js file in this repository
3. Copy the entire content of the file
4. In TamperMonkey, click on "Add a new script"
5. Replace the default content with the copied code
6. Save the script (Ctrl+S)
7. Visit the target website to use the enhanced functionality

### Adding New Scripts

To add a new TamperMonkey script to this collection:
1. Create a new .js file with a descriptive name
2. Follow TamperMonkey script standards with proper @match, @grant, etc.
3. Add a section to the README describing the new script
4. Include installation and usage instructions specific to the new script

## Current Script Details (sensibull.js)

The sensibull.js script is a comprehensive enhancement for the Sensibull trading platform with the following capabilities:

### Features
- **Batch Chart Opening**: Open charts for Nifty 50 stocks in configurable batches with customizable delays
- **Saved Tickers**: Save current tickers and access them later with one-click chart opening
- **Quick Chart Tools**: One-click access to different chart types for current ticker
- **Import/Export**: Import/export your saved tickers as JSON or comma-separated values
- **Customizable Settings**: Adjust batch size and tab opening delay to suit your needs
- **Responsive Design**: Works well on different screen sizes with dark mode support

### Supported URLs
- `https://web.sensibull.com/*`

### Permissions Required
- `GM_openInTab`: To open new tabs for stock charts
- `GM_setValue` / `GM_getValue`: To save and retrieve user preferences and saved tickers

## License

This project is licensed under the MIT License, as specified in the LICENSE file.