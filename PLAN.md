# Goal of this project

<Placeholder for the goal of the project>

## Coding Guidelines
- Setup proper testing infrastructure for testing the code.
- Write test code and test cases first before writing the features or new code. 
- Commit your code after every feature addition and after all the test cases pass. Commit the code with proper Git commit message semantics & traditional conventions. 
- Implement proper error handling and a logging feature. Every API call and user interaction should be logged in the SQLite database.
- Follow proper security best practices.
- Ensure code readability and maintainability by following coding standards and conventions.
- Use meaningful variable and function names.
- Follow the DRY (Don't Repeat Yourself) principle.
- Avoid code duplication and use abstraction to reduce complexity.
- Follow the SOLID principles.
- Follow the KISS (Keep It Simple, Stupid) principle.
- Follow the YAGNI (You Aren't Gonna Need It) principle.
- Make every aspect of the code configurable by centralizing all the configurations into a single file at the root. 
- Set up a good logging feature so that the user can verify the app is running fine. 
- Do not use any hard-coded data anywhere in the code, not even for temporary purposes. 

## Tech Stack
- Use Golang  
- Use SQLite for database storage.
- Platform support for macOS and Linux.
- Use Docker for easier deployment. 


## Initial Files Structure
- Keep the root of the project clean and minimal. Put all the code files inside a code or source directory.
- Write a .gitignore file 
- Create a config.yaml file at the root of the project to centralize all configurations.
- Create a README.md file at the root of the project to provide instructions on how to use the application.
- Create a LICENSE file at the root of the project to specify the license under which the code is distributed.
- Create a .env file at the root of the project to store environment variables.
- Create a .env.example file at the root of the project to provide example environment variables.
- Create a test environment file at the root of the project to be used during testing. 
- Create a .dockerignore file at the root of the project to specify files and directories to exclude from Docker builds.
- Create a .qwenignore file at the root of the project to specify files and directories to exclude from Qwen Code accessing. 
- Create a Dockerfile file at the root of the project to specify Docker build instructions.
- Create a .docker-compose.yml file at the root of the project to specify Docker Compose configuration.

## Code Review Process:
  
  - Trigger Points:
    - All PRs require minimum 1 review
    - Major architectural changes: 2+ reviewers
    - Security-sensitive code: Security team review
    - Database migrations: Architecture review
    
  - Review Checklist:
    - Functionality:
      - Tests cover happy path and edge cases
      - Error handling is explicit and logged
      - No hardcoded values
      - Configuration used correctly
      
    - Code Quality:
      - Follows SOLID principles
      - DRY (no duplication)
      - KISS (unnecessarily complex logic flagged)
      - YAGNI (no premature features)
      - Naming is clear and descriptive
      
    - Performance & Security:
      - No SQL injection risks (parameterized queries)
      - No secrets in logs
      - No unbounded loops/goroutines
      - Proper error handling (no silent failures)
      
    - Documentation:
      - Public functions have godoc comments
      - Complex logic has inline comments
      - README reflects any new features
      
  - Approval & Timeline:
    - Target: Review within 24 hours
    - Approval: Changes address all comments
    - Merge: Squash commits to atomic units
    - Post-merge: Verify deployment logs
    
  - Handling Conflicts:
    - Preference: Architecture owner decides
    - Escalate: If unresolved, discuss in team standup
    - Document: Record decision rationale


## Git Commit Strategy:
  - Message Format: Conventional Commits
    - Structure: <type>(<scope>): <subject>
    - Example: "feat(database): implement SQLite logging repository"
    
  - Types:
    - feat: New feature
    - fix: Bug fix
    - test: Test additions/modifications
    - refactor: Code restructuring (no behavior change)
    - docs: Documentation changes
    - chore: Dependencies, build config, tooling
    - perf: Performance improvements
    - ci: CI/CD configuration changes
    - BREAKING CHANGE: For breaking changes (in footer)
    
  - Rules:
    - Use imperative mood ("add" not "added" or "adds")
    - First line: max 50 characters
    - Body: wrapped at 72 characters
    - Reference issues: "Fixes #123" in footer
    - Atomic commits: One logical change per commit
    - Frequency: After every test suite pass (minimum)
    
  - Commit Cadence:
    - Feature: 1-3 commits per feature (small, atomic)
    - Bug fix: 1 commit (include test case)
    - Refactor: 1-2 commits (separate from features)
    - Never commit: Broken tests, linting errors, secrets
    
  - Pre-Commit Requirements:
    - All tests pass (unit + integration)
    - Code linting passes (golangci-lint)
    - No hardcoded values/secrets
    - Commit message follows convention


## Testing Strategy:
  - Unit Tests:
    - Target coverage: 75% minimum
    - Location: co-located with code (*_test.go)
    - Mocking: Use testify/mock for dependencies
    - Database: Use in-memory SQLite for isolation
    
  - Integration Tests:
    - Location: tests/integration/
    - Database: Separate test SQLite instance
    - External APIs: Use httptest package for mocks
    - Execution: Before commits (pre-commit hook)
    
  - End-to-End Tests:
    - Location: tests/e2e/
    - Environment: Docker-compose test stack
    - Frequency: CI/CD pipeline only
    - Timeout: No more than 5 minutes
    
  - Test Data:
    - Use fixtures in tests/fixtures/
    - Seed/teardown in test setup/cleanup
    - Use factories for object creation (testify/suite)
    
  - Coverage Enforcement:
    - Minimum: 75% code coverage
    - Excluded: main.go, generated code
    - CI check: Fail if coverage drops

## Testing Infrastructure:
  
  - Unit Testing:
    Framework: testify/assert + testify/suite
    Table-Driven: All parametric tests use table patterns
    In-Memory DB: Use sqlite with :memory: for isolation
    
  - Integration Testing:
    Database: Separate test.db file
    Cleanup: Transaction rollback after each test
    Fixtures: Seed from tests/fixtures/*.yaml
    
  - Mocking:
    External APIs: httptest.Server
    Database dependencies: testify/mock
    File I/O: Use os.TempDir()
    
  - Test Execution:
    Command: make test (includes all test types)
    Coverage: go test -cover -coverprofile=coverage.out
    Parallel: go test -parallel=4 (configurable)
    Timeout: -timeout=5m per test
    
  - Continuous Integration:
    - Unit tests: Run on every commit
    - Integration tests: Run on PR
    - E2E tests: Run on merge to main
    - Coverage: Fail if drops below 75%
    - Linting: golangci-lint (strict config)


## Logging Strategy:
  
  - Log Levels:
    DEBUG: Detailed execution flow, variable values (dev only)
    INFO: Application state changes, API calls initiated
    WARN: Potentially problematic (retries, deprecations)
    ERROR: Recoverable failures (validation failed, API timeout)
    FATAL: Unrecoverable errors (database corruption)
    
  - Format: Structured JSON
    Example: {"timestamp":"2025-12-02T18:30:00Z","level":"INFO","logger":"database","msg":"Query executed","duration_ms":125,"query_hash":"abc123","rows":15,"request_id":"req-789"}
    
  - Sensitive Data Filtering:
    - Redact: API keys, auth tokens, passwords, PII
    - Replace with: [REDACTED] or hash
    - Validation: No secrets in logs (pre-commit scan)
    
  - SQLite Logging Table:
    CREATE TABLE logs (
      id INTEGER PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      level TEXT NOT NULL,
      logger TEXT NOT NULL,
      message TEXT NOT NULL,
      request_id TEXT,
      user_id TEXT,
      metadata JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_logs_timestamp ON logs(timestamp);
    CREATE INDEX idx_logs_level ON logs(level);
    CREATE INDEX idx_logs_request_id ON logs(request_id);
    
  - Query Logging:
    - All SQL queries logged at DEBUG level
    - Include: Query (parameterized), duration, row count
    - Threshold: Warn if query > 1 second
    
  - Rotation:
    - SQLite: Prune logs older than 30 days daily
    - File logs: Rotate daily, keep 7 days
    
  - Request Tracing:
    - Every request gets unique request_id
    - Propagate through all logs for that request
    - Include in error responses for debugging

## Error Handling Pattern:

  - Error Categories:
    ValidationError: User input invalid (4xx HTTP)
    NotFoundError: Resource missing (404)
    ConflictError: State conflict (409)
    ExternalServiceError: Third-party API failed (5xx)
    InternalError: Application bug (500)
    
  - Error Wrapping:
    - Use fmt.Errorf with %w for error chains
    - Never lose error context
    - Example: return fmt.Errorf("fetching user %d: %w", userID, err)
    
  - Logging Failures:
    - Log stack trace for unexpected errors
    - Include request context
    - Don't log sensitive data
    
  - Retry Strategy:
    - Exponential backoff: 100ms → 1s → 10s
    - Max retries: 3 for transient failures
    - Circuit breaker: Fail fast after 5 consecutive errors
    
  - Recovery:
    - Panic recovery in HTTP handlers only
    - Log panic + stack trace
    - Return 500 response (never crash)


## Configuration Architecture:

  - Files:
    config.yaml: Application defaults (committed)
    config.local.yaml: Local overrides (gitignored)
    .env: Secrets only (gitignored, use .env.example as template)
    .env.test: Test-specific secrets
    
  - Validation:
    - On startup, validate all required configs present
    - Type-check config values
    - Exit with clear error if invalid
    
  - Priority Order (highest to lowest):
    1. Environment variables
    2. .env file
    3. config.local.yaml
    4. config.yaml
    5. Code defaults
    
  - Example config.yaml:
    app:
      name: MyApp
      version: 1.0.0
      environment: development
      
    database:
      path: ./data/app.db
      pool_size: 10
      max_open_conns: 25
      
    logging:
      level: info
      format: json
      retention_days: 30
      
    security:
      request_timeout_sec: 30
      max_concurrent_requests: 100

## CI/CD Requirements:

  - Pipeline Stages:
    1. Lint (golangci-lint)
    2. Test (unit + integration, 75% coverage)
    3. Build (Docker image, security scan)
    4. Deploy (staging, then prod on tag)
    
  - Automated Checks:
    - Linting failures: Fail PR
    - Test failures: Fail PR
    - Coverage drop: Fail PR
    - Security scan: Warn, don't block
    
  - Deployment:
    - Main branch: Deploy to staging (automatic)
    - Tags (v*.*.* ): Deploy to production (manual approval)
    - Rollback: Previous tag deployment

## Security Checklist:

  - Code-Level:
    - Use parameterized queries (never string concatenation)
    - Validate all inputs (type, length, range)
    - Sanitize outputs for logs/responses
    - No secrets in error messages
    
  - Secrets Management:
    - Store in .env, never in config.yaml
    - Scan commits: git-secrets or similar
    - Rotate keys regularly
    - Access logs: Who accessed which secret?
    
  - Dependencies:
    - Run: go mod tidy && go mod verify
    - Security scan: github/dependabot or Go security scanner
    - Update cadence: Weekly scan, update on critical
    
  - CI/CD Security:
    - Scan for secrets before merge
    - Scan for vulnerabilities in dependencies
    - Build and sign Docker images

## Docker Best Practices:

  - Dockerfile:
    - Multi-stage: builder + runtime
    - Runtime: Non-root user (USER app)
    - Health check: Every 30 seconds
    - Graceful shutdown: Handle SIGTERM
    
  - docker-compose.yml:
    - Define test database volume
    - Network isolation
    - Environment variable injection
    - Health check monitoring
    - Logging driver configuration
    
  - Deployment:
    - Graceful shutdown: Signal handling with timeout
    - Data persistence: Volume for SQLite
    - Log aggregation: Stdout/stderr to container logs
