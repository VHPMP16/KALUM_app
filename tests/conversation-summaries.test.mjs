import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../supabase/migrations/20261119204500_conversation_list_summaries.sql", import.meta.url), "utf8");
const workspace = await readFile(new URL("../app/chat/chat-workspace.tsx", import.meta.url), "utf8");

test("conversation summaries are limited to active memberships", () => {
  assert.match(migration, /mine\.profile_id = _actor[\s\S]*?mine\.left_at is null/i);
  assert.match(migration, /private\.is_active_user\(\)/i);
});

test("conversation summaries return latest message, sender, participant and attachment status", () => {
  for (const field of ["participant_name", "active_member_count", "last_message_body", "last_message_sender_name", "last_message_created_at", "last_attachment_mime_type", "last_attachment_scan_status"]) {
    assert.ok(migration.includes(field));
  }
  assert.match(migration, /order by m\.created_at desc, m\.id desc[\s\S]*?limit 1/i);
});

test("summary RPC is not executable by anonymous users", () => {
  assert.match(migration, /revoke all on function private\.get_conversation_summaries\(\) from public, anon/i);
  assert.match(migration, /revoke all on function public\.get_conversation_summaries\(\) from public, anon/i);
});

test("conversation list displays preview, sender, smart date and quarantine status", () => {
  assert.match(workspace, /formatConversationTime/);
  assert.match(workspace, /last_message_sender_name/);
  assert.match(workspace, /Anexo em análise/);
  assert.match(workspace, /Anexo bloqueado/);
  assert.match(workspace, /visibleConversations\.map/);
  assert.match(workspace, /last_message_created_at/);
});

test("chat workspace keeps a mobile-first layout with desktop conversation columns", () => {
  assert.match(workspace, /grid-cols-1[\s\S]*?lg:grid-cols-\[350px_minmax\(0,1fr\)\]/);
  assert.match(workspace, /max-h-\[min\(70vh,520px\)\]/);
});
