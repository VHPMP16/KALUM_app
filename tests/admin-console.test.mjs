import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../supabase/migrations/20261119204000_admin_audit_logs_and_persisted_settings.sql", import.meta.url), "utf8");
const workspace = await readFile(new URL("../app/admin/admin-workspace.tsx", import.meta.url), "utf8");

test("administrative settings stay in a private RLS-protected table", () => {
  assert.match(migration, /create table if not exists private\.admin_settings/i);
  assert.match(migration, /alter table private\.admin_settings enable row level security/i);
  assert.match(migration, /revoke all on table private\.admin_settings from public, anon, authenticated/i);
});

test("settings are validated and every change is audited", () => {
  assert.match(migration, /company_name must contain 2 to 80 characters/i);
  assert.match(migration, /support_email must be a valid e-mail or empty/i);
  assert.match(migration, /max_group_members must be an integer between 2 and 50/i);
  assert.match(migration, /insert into private\.audit_logs[\s\S]*?admin\.setting_updated/i);
  assert.match(migration, /insert into private\.admin_actions[\s\S]*?setting\.updated/i);
});

test("audit and activity queries enforce admin roles and server-side pagination", () => {
  assert.match(migration, /private\.admin_search_audit_logs[\s\S]*?private\.has_role\('it_admin'\)/i);
  assert.match(migration, /private\.admin_search_activity_logs[\s\S]*?private\.has_role\('security_admin'\)/i);
  assert.match(migration, /limit _size offset/i);
  assert.match(migration, /count\(\*\) over\(\)/i);
});

test("group settings are enforced by the transactional conversation RPC", () => {
  assert.match(migration, /private\.group_creation_is_enabled\(\)/i);
  assert.match(migration, /private\.group_max_members\(\)/i);
  assert.match(migration, /security definer[\s\S]*?Group creation is disabled by IT administration/i);
});

test("admin workspace exposes employees, audit, logs, and persisted settings", () => {
  for (const label of ["Funcionários", "Auditoria", "Registros", "Configurações"]) assert.ok(workspace.includes(label));
  for (const rpc of ["admin_search_audit_logs", "admin_search_activity_logs", "admin_get_settings", "admin_update_settings"]) assert.ok(workspace.includes(rpc));
  assert.match(workspace, /<details className=/);
  assert.match(workspace, /setTimeout\(\(\) => \{ void loadAudit\(\); \}, 250\)/);
});
