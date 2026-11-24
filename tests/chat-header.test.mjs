import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/chat/page.tsx", import.meta.url), "utf8");

test("chat header does not render escaped newline text", () => {
  assert.doesNotMatch(page, /\\n\s*\{adminRole/);
  assert.match(page, /AMBIENTE AUDITADO<\/span>\s*\{adminRole/);
});
