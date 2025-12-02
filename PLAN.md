# Goal of this project

Create a powerful and user-friendly TamperMonkey script that enhances the Sensibull trading platform with features like batch opening of stock charts, saved tickers, sticky tabs, and other productivity tools for traders.

## Coding Guidelines
- Focus on clean, readable JavaScript code suitable for browser environments.
- Implement proper error handling for browser APIs and DOM manipulation.
- Follow JavaScript best practices and maintainability standards.
- Use meaningful variable and function names.
- Follow the DRY (Don't Repeat Yourself) principle.
- Avoid code duplication and use abstraction to reduce complexity.
- Follow the KISS (Keep It Simple, Stupid) principle.
- Follow the YAGNI (You Aren't Gonna Need It) principle.
- Make every aspect of the script configurable through GM_getValue and GM_setValue.
- Set up proper logging for debugging purposes.
- Do not use any hard-coded data anywhere in the code, not even for temporary purposes.

## Tech Stack
- Plain JavaScript for TamperMonkey userscript
- Use TamperMonkey's GM_* APIs for storage and functionality
- Compatible with modern browsers (Chrome, Firefox, Edge)

## Initial Files Structure
- Keep the root of the project clean and minimal
- Single sensibull.js file containing the complete TamperMonkey script
- README.md file with usage instructions
- PLAN.md file with project goals and implementation plan
- LICENSE file with distribution terms

## Git Commit Strategy:
  - Message Format: Conventional Commits
    - Structure: <type>(<scope>): <subject>
    - Example: "feat(script): add batch opening functionality"

  - Types:
    - feat: New feature in the userscript
    - fix: Bug fix in the script
    - test: Test additions/modifications
    - refactor: Code restructuring (no behavior change)
    - docs: Documentation changes
    - chore: Dependencies, build config, tooling
    - perf: Performance improvements

  - Rules:
    - Use imperative mood ("add" not "added" or "adds")
    - First line: max 50 characters
    - Body: wrapped at 72 characters
    - Reference issues: "Fixes #123" in footer
    - Atomic commits: One logical change per commit

  - Commit Cadence:
    - Feature: 1 commit per feature (small, atomic)
    - Bug fix: 1 commit (include description)
    - Refactor: 1 commit (separate from features)

  - Pre-Commit Requirements:
    - Script functionality verified manually
    - No hardcoded values/secrets
    - Commit message follows convention

## Testing Strategy:
  - Manual Testing:
    - Test script functionality on target website (sensibull.com)
    - Verify all features work properly in TamperMonkey environment
    - Cross-browser testing (Chrome, Firefox, Edge)
    - Test with different screen sizes and resolutions

  - Error Handling Testing:
    - Verify error messages for invalid inputs
    - Test functionality when TamperMonkey APIs are unavailable
    - Test with various types of ticker symbols

## Security and Best Practices:

  - TamperMonkey Script Security:
    - Use proper @grant permissions for GM_* functions
    - Validate all user inputs and ticker symbols
    - Sanitize data before using in DOM operations
    - No sensitive data stored in plain text

  - DOM Manipulation Safety:
    - Use proper selectors to avoid conflicts with website updates
    - Clean up event listeners when possible
    - Ensure script doesn't interfere with website functionality

  - TamperMonkey API Usage:
    - Properly handle GM_* function availability
    - Use GM_openInTab safely with appropriate options
    - Securely store user preferences with GM_setValue/GM_getValue
