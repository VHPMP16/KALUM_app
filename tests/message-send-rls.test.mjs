import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../supabase/migrations/20261120153000_fix_message_insert_rls_recursion.sql", import.meta.url), "utf8");
const workspace = await readFile(new URL("../app/chat/chat-workspace.tsx", import.meta.url), "utf8");

test("message insert policy delegates parent-message validation to a private SECURITY DEFINER helper", () => {
  assert.match(migration, /create or replace function private\.can_reference_message/i);
  assert.match(migration, /security definer[\s\S]*?set search_path = ''/i);
  assert.match(migration, /revoke all on function private\.can_reference_message\(uuid, uuid\) from public, anon/i);
  assert.match(migration, /grant execute on function private\.can_reference_message\(uuid, uuid\) to authenticated/i);
});

test("message insert RLS keeps authenticated sender, active account and conversation membership checks", () => {
  assert.match(migration, /sender_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /private\.is_active_user\(\)/i);
  assert.match(migration, /private\.is_conversation_member\(conversation_id\)/i);
  assert.match(migration, /private\.can_reference_message\(reply_to_id, conversation_id\)/i);
});

test("message sending preserves draft on failure and blocks duplicate submissions", () => {
  assert.match(workspace, /sendingRef\.current/);
  assert.match(workspace, /finally\s*\{[\s\S]*?sendingRef\.current = false/);
  assert.match(workspace, /setDraft\(\(current\) => current === body \? "" : current\)/);
  assert.match(workspace, /console\.error\("ChatApp message send failed"/);
});
