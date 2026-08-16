// A minimal in-browser test harness — no framework, no dependencies, so it
// runs the same way the app itself does (plain ES modules, no build step).
// Test files import `test`/`assert*` from here and call `test(name, fn)` to
// register; `run-tests.js` then calls `runAll()` once every test file has
// been imported (import side effects populate the shared `tests` array,
// since ES modules are singletons per URL).
const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(message || `expected ${expected} ± ${tolerance}, got ${actual}`);
  }
}

export function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || `expected a truthy value, got ${JSON.stringify(value)}`);
  }
}

export async function runAll() {
  const results = [];
  for (const { name, fn } of tests) {
    try {
      await fn();
      results.push({ name, status: "pass" });
    } catch (err) {
      results.push({ name, status: "fail", message: err.message });
    }
  }
  return results;
}
