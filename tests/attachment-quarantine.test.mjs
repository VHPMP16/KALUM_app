import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../supabase/migrations/20261119205000_quarantine_attachment_upload_and_admin_controls.sql", import.meta.url), "utf8");
const chat = await readFile(new URL("../app/chat/chat-workspace.tsx", import.meta.url), "utf8");
const admin = await readFile(new URL("../app/admin/admin-workspace.tsx", import.meta.url), "utf8");
const deleteMigration = await readFile(new URL("../supabase/migrations/20261119205700_mark_messages_after_attachment_deletion.sql", import.meta.url), "utf8");
const securityMigration = await readFile(new URL("../supabase/migrations/20261119205500_move_public_definers_to_private.sql", import.meta.url), "utf8");
const storageCleanupMigration = await readFile(new URL("../supabase/migrations/20261119205800_require_storage_cleanup_before_attachment_metadata_delete.sql", import.meta.url), "utf8");

test("uploads are restricted to an authenticated member's own quarantine folder", () => {
  assert.match(migration, /bucket_id = 'chat-quarantine'/i);
  assert.match(migration, /storage\.foldername\(name\)\)\[2\] = \(select auth\.uid\(\)\)::text/i);
  assert.match(migration, /private\.is_conversation_member/i);
});

test("attachment registration validates MIME, size, hash and object path", () => {
  assert.match(migration, /application\/pdf','image\/jpeg/i);
  assert.match(migration, /_size_bytes > 5242880/i);
  assert.match(migration, /_sha256 !~ '\^\[0-9a-f\]\{64\}\$'/i);
  assert.match(migration, /scan_status\s*\)\s*values[\s\S]*?'pending'/i);
});

test("ordinary members receive attachment status but not quarantine object paths", () => {
  assert.match(migration, /case when a\.scan_status = 'clean' and a\.bucket = 'chat-attachments' then a\.object_path else null end/i);
  assert.match(migration, /revoke all on function private\.get_message_attachment_status\(uuid\) from public, anon/i);
});

test("administrator deletion requires role and reason and is audited", () => {
  assert.match(migration, /private\.admin_delete_attachment[\s\S]*?has_role\('it_admin'\)/i);
  assert.match(migration, /a deletion reason between 8 and 500 characters is required/i);
  assert.match(migration, /attachment\.deleted/i);
  assert.match(migration, /Administrators can delete attachment objects/i);
});

test("chat upload validates file signature and only enables clean downloads", () => {
  assert.match(chat, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(chat, /validPdf/);
  assert.match(chat, /validJpeg/);
  assert.match(chat, /create_attachment_message/);
  assert.match(chat, /scan_status !== "clean"/);
  assert.match(chat, /Baixar arquivo verificado/);
});

test("admin UI does not permit release without a configured scanner", () => {
  assert.match(admin, /Quarentena de anexos/);
  assert.match(admin, /Liberar \(scanner pendente\)/);
  assert.match(admin, /Excluir definitivamente/);
  assert.match(admin, /admin_delete_attachment/);
});

test("privileged conversation and attachment writers are hidden in the private schema", () => {
  assert.match(securityMigration, /create or replace function private\.create_conversation[\s\S]*?security definer/i);
  assert.match(securityMigration, /create or replace function public\.create_conversation[\s\S]*?security invoker/i);
  assert.match(securityMigration, /create or replace function private\.create_attachment_message[\s\S]*?security definer/i);
  assert.match(securityMigration, /create or replace function public\.create_attachment_message[\s\S]*?language sql volatile security invoker/i);
});

test("attachment metadata cannot be deleted while the Storage object still exists", () => {
  assert.match(storageCleanupMigration, /storage\.objects[\s\S]*?storage object must be removed before deleting attachment metadata/i);
});
