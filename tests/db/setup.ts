// Shared test-suite hooks. Currently a no-op — individual test files manage
// their own state via beforeAll/afterAll. A global afterEach TRUNCATE was
// considered but it conflicts with tests that need persistence across `it`
// blocks within the same suite (e.g. votes.unique).
export {};
