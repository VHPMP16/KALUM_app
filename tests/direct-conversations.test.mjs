import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workspace = await readFile(new URL("../app/chat/chat-workspace.tsx", import.meta.url), "utf8");
const directoryMigration = await readFile(new URL("../supabase/migrations/20261118203939_expose_minimal_active_employee_directory.sql", import.meta.url), "utf8");
const conversationMigration = await readFile(new URL("../supabase/migrations/20261118203538_add_transactional_conversation_creation.sql", import.meta.url), "utf8");

test("active employees can discover colleagues through the minimal directory", () => {
  assert.match(directoryMigration, /status = 'active'/i);
  assert.match(directoryMigration, /grant select \(id, full_name, status, avatar_path\) on public\.profiles to authenticated/i);
  assert.match(workspace, /\.from\("profiles"\)[\s\S]*?\.select\("id,full_name"\)[\s\S]*?\.neq\("id", userId\)/i);
});

test("any active employee can initiate a one-to-one conversation from the directory", () => {
  assert.match(workspace, /async function createDirectConversation/);
  assert.match(workspace, /supabase\.rpc\("create_conversation",\s*\{\s*_type:\s*"direct",\s*_member_ids:\s*\[newParticipantId\]/);
  assert.match(workspace, /Iniciar conversa individual/);
  assert.match(workspace, /Selecione um funcionário ativo/);
});

test("global employee search also opens or reuses a direct conversation", () => {
  assert.match(workspace, /if \(result\.category === "Funcionários"\)/);
  assert.match(workspace, /_type:\s*"direct",[\s\S]*?_member_ids:\s*\[result\.id\]/);
});

test("database enforces active target and exactly one other participant for direct chats", () => {
  assert.match(conversationMigration, /if _type='direct' then[\s\S]*?if v_member_count <> 1 then raise exception/i);
  assert.match(conversationMigration, /private\.is_active_profile\(v_target_id\)/i);
  assert.match(conversationMigration, /Do not include the creator in member_ids/i);
  assert.match(conversationMigration, /An existing direct conversation is unavailable to this account/i);
});
