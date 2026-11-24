import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../supabase/migrations/20261119203500_global_search_indexes_and_rpc.sql", import.meta.url), "utf8");
const workspace = await readFile(new URL("../app/chat/chat-workspace.tsx", import.meta.url), "utf8");

test("global search uses bounded full-text indexes for the three categories", () => {
  assert.match(migration, /profiles_global_search_idx[\s\S]*?to_tsvector\('simple'/i);
  assert.match(migration, /conversations_global_search_idx[\s\S]*?to_tsvector\('simple'/i);
  assert.match(migration, /messages_global_search_idx[\s\S]*?to_tsvector\('simple'/i);
});

test("global search validates query length and uses plainto_tsquery", () => {
  assert.match(migration, /char_length\(btrim\(_query\)\) < 2/i);
  assert.match(migration, /char_length\(_query\) > 100/i);
  assert.match(migration, /plainto_tsquery\('simple', btrim\(_query\)\)/i);
});

test("global search limits group and message results to active conversation members", () => {
  assert.match(migration, /mine\.profile_id = _actor[\s\S]*?mine\.left_at is null/i);
  assert.match(migration, /mine\.conversation_id = m\.conversation_id[\s\S]*?mine\.profile_id = _actor[\s\S]*?mine\.left_at is null/i);
});

test("global search is exposed only to authenticated users", () => {
  assert.match(migration, /revoke all on function private\.search_chatapp\(text, integer\) from public, anon/i);
  assert.match(migration, /grant execute on function private\.search_chatapp\(text, integer\) to authenticated/i);
  assert.match(migration, /revoke all on function public\.search_chatapp\(text, integer\) from public, anon/i);
});

test("global search UI debounces requests and groups highlighted results", () => {
  assert.match(workspace, /window\.setTimeout\(async \(\) => \{/);
  assert.match(workspace, /\}, 350\)/);
  assert.match(workspace, /supabase\.rpc\("search_chatapp"/);
  assert.match(workspace, /\["Funcionários", "Grupos", "Mensagens"\]/);
  assert.match(workspace, /<mark className=/);
});
