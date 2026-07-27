import assert from "node:assert/strict";
import { normalizeAIBaseUrl } from "../src/lib/aiEndpoint.ts";

assert.equal(
  normalizeAIBaseUrl("https://api.example.com/v1/"),
  "https://api.example.com/v1"
);
assert.equal(
  normalizeAIBaseUrl("http://localhost:11434/v1"),
  "http://localhost:11434/v1"
);
assert.equal(
  normalizeAIBaseUrl("http://127.0.0.1:8080/v1"),
  "http://127.0.0.1:8080/v1"
);
assert.throws(() => normalizeAIBaseUrl("http://api.example.com/v1"), /HTTPS/);
assert.throws(() => normalizeAIBaseUrl("not a URL"), /格式/);

console.log("AI endpoint security tests passed.");
