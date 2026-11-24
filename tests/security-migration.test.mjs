import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readMigration = (name) => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");
const privateFunctions = await readMigration("20261119011619_revoke_public_private_function_execute.sql");
const anonPrivileges = await readMigration("20261119011810_revoke_anon_table_and_excess_authenticated_privileges.sql");
const profileRead = await readMigration("20261119011824_grant_authenticated_profile_select.sql");
const defaultFunctions = await readMigration("20261119011915_revoke_default_public_function_execute.sql");
const auditRpc = await readMigration("20261119011943_restrict_conversation_audit_rpc.sql");

test("revokes default function execution from PUBLIC and anon in private schema", () => {
  assert.match(privateFunctions, /REVOKE\s+ALL\s+ON\s+ALL\s+FUNCTIONS\s+IN\s+SCHEMA\s+private\s+FROM\s+PUBLIC\s*;/i);
  assert.match(privateFunctions, /REVOKE\s+ALL\s+ON\s+ALL\s+FUNCTIONS\s+IN\s+SCHEMA\s+private\s+FROM\s+anon\s*;/i);
});

test("grants authenticated the RLS helper functions required by policies", () => {
  for (const signature of [
    "can_manage_conversation(uuid)",
    "can_view_profile(uuid)",
    "has_role(text)",
    "is_active_profile(uuid)",
    "is_active_user()",
    "is_conversation_member(uuid)"
  ]) {
    assert.ok(privateFunctions.includes(`GRANT EXECUTE ON FUNCTION private.${signature} TO authenticated;`));
  }
});

test("removes anonymous table and sequence privileges and maintenance rights", () => {
  assert.match(anonPrivileges, /REVOKE\s+ALL\s+PRIVILEGES\s+ON\s+ALL\s+TABLES\s+IN\s+SCHEMA\s+public\s+FROM\s+anon\s*;/i);
  assert.match(anonPrivileges, /REVOKE\s+ALL\s+PRIVILEGES\s+ON\s+ALL\s+SEQUENCES\s+IN\s+SCHEMA\s+public\s+FROM\s+anon\s*;/i);
  assert.match(anonPrivileges, /REVOKE\s+TRUNCATE,\s*REFERENCES,\s*TRIGGER,\s*MAINTAIN\s+ON\s+ALL\s+TABLES\s+IN\s+SCHEMA\s+public\s+FROM\s+authenticated/i);
  assert.match(anonPrivileges, /ALTER\s+DEFAULT\s+PRIVILEGES\s+FOR\s+ROLE\s+postgres\s+IN\s+SCHEMA\s+public/i);
});

test("allows authenticated profile reads while retaining RLS policies", () => {
  assert.match(profileRead, /GRANT\s+SELECT\s+ON\s+TABLE\s+public\.profiles\s+TO\s+authenticated\s*;/i);
});

test("restricts future public/private function execution by default", () => {
  assert.equal((defaultFunctions.match(/REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;/g) ?? []).length, 2);
  assert.equal((defaultFunctions.match(/REVOKE EXECUTE ON FUNCTIONS FROM anon;/g) ?? []).length, 2);
  assert.equal((defaultFunctions.match(/REVOKE EXECUTE ON FUNCTIONS FROM authenticated;/g) ?? []).length, 2);
});

test("prevents direct authenticated execution of the audit event helper", () => {
  assert.match(auditRpc, /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+private\.log_conversation_event\(text,\s*uuid,\s*jsonb\)\s+FROM\s+authenticated/i);
});
