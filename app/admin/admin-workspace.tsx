"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Json, Tables } from "@/lib/supabase/database.types";

type Profile = Pick<Tables<"profiles">, "id" | "full_name" | "corporate_email" | "employee_code" | "status" | "disabled_at">;
type Tab = "employees" | "audit" | "logs" | "settings" | "attachments";
type AuditRow = {
  id: string; actor_profile_id: string | null; actor_name: string; action: string;
  resource_type: string; resource_id: string | null; reason: string | null;
  metadata: Json; occurred_at: string; total_count: number;
};
type ActivityRow = {
  id: string; source: string; actor_profile_id: string | null; actor_name: string;
  event_type: string; outcome: string; target_profile_id: string | null;
  target_name: string | null; reason: string | null; metadata: Json;
  occurred_at: string; total_count: number;
};
type AttachmentRow = { id: string; conversation_id: string; message_id: string; uploader_id: string; uploader_name: string; original_name: string; mime_type: string; size_bytes: number; scan_status: string; bucket: string; object_path: string; created_at: string; total_count: number };
type SettingsForm = {
  company_name: string;
  support_email: string;
  maintenance_notice: string;
  group_creation_enabled: boolean;
  max_group_members: number;
};
const DEFAULT_SETTINGS: SettingsForm = {
  company_name: "Calunga",
  support_email: "",
  maintenance_notice: "",
  group_creation_enabled: true,
  max_group_members: 50
};
const PAGE_SIZE = 20;

function dateFilter(value: string, end = false) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (end) date.setDate(date.getDate() + 1);
  return date.toISOString();
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-500">{total} registro(s) · página {page} de {pages}</p>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Anterior</button>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Próxima</button>
      </div>
    </div>
  );
}

export function AdminWorkspace({ currentUserId }: { currentUserId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("employees");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [profileFilter, setProfileFilter] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ id: string; status: "active" | "disabled" } | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);

  const [settings, setSettings] = useState<SettingsForm>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [attachmentRows, setAttachmentRows] = useState<AttachmentRow[]>([]);
  const [attachmentPage, setAttachmentPage] = useState(1);
  const [attachmentTotal, setAttachmentTotal] = useState(0);
  const [attachmentStatusFilter, setAttachmentStatusFilter] = useState("pending");
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [pendingAttachmentDelete, setPendingAttachmentDelete] = useState<AttachmentRow | null>(null);
  const [attachmentDeleteBusy, setAttachmentDeleteBusy] = useState(false);

  const loadProfiles = useCallback(async () => {
    const [profilesResult, rolesResult] = await Promise.all([
      supabase.from("profiles")
        .select("id,full_name,corporate_email,employee_code,status,disabled_at")
        .order("full_name"),
      supabase.from("profile_roles").select("profile_id,roles!inner(code)")
    ]);
    if (profilesResult.error || rolesResult.error) {
      setError("Falha ao carregar contas. Verifique suas permissões.");
      return;
    }
    setProfiles(profilesResult.data ?? []);
    const next: Record<string, string[]> = {};
    for (const item of rolesResult.data ?? []) {
      const role = item.roles as unknown as { code: string };
      (next[item.profile_id] ??= []).push(role.code);
    }
    setRoles(next);
  }, [supabase]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    const { data, error: queryError } = await supabase.rpc("admin_search_audit_logs", {
      _from: dateFilter(fromDate),
      _to: dateFilter(toDate, true),
      _actor: actorFilter || null,
      _action: auditActionFilter.trim() || null,
      _page: auditPage,
      _page_size: PAGE_SIZE
    });
    if (queryError) {
      setError("Não foi possível carregar a auditoria. Verifique seu perfil de acesso.");
      setAuditRows([]);
      setAuditTotal(0);
    } else {
      setAuditRows((data ?? []) as AuditRow[]);
      setAuditTotal(data?.[0]?.total_count ?? 0);
    }
    setAuditLoading(false);
  }, [supabase, fromDate, toDate, actorFilter, auditActionFilter, auditPage]);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    const { data, error: queryError } = await supabase.rpc("admin_search_activity_logs", {
      _from: dateFilter(fromDate),
      _to: dateFilter(toDate, true),
      _actor: actorFilter || null,
      _event: eventFilter.trim() || null,
      _outcome: outcomeFilter || null,
      _page: activityPage,
      _page_size: PAGE_SIZE
    });
    if (queryError) {
      setError("Não foi possível carregar os registros. Verifique seu perfil de acesso.");
      setActivityRows([]);
      setActivityTotal(0);
    } else {
      setActivityRows((data ?? []) as ActivityRow[]);
      setActivityTotal(data?.[0]?.total_count ?? 0);
    }
    setActivityLoading(false);
  }, [supabase, fromDate, toDate, actorFilter, eventFilter, outcomeFilter, activityPage]);

  const loadAttachments = useCallback(async () => {
    setAttachmentLoading(true);
    const { data, error: queryError } = await supabase.rpc("admin_list_attachments", {
      _status: attachmentStatusFilter === "all" ? null : attachmentStatusFilter,
      _page: attachmentPage,
      _page_size: PAGE_SIZE
    });
    if (queryError) {
      setError("Não foi possível carregar a fila de anexos.");
      setAttachmentRows([]);
      setAttachmentTotal(0);
    } else {
      setAttachmentRows((data ?? []) as AttachmentRow[]);
      setAttachmentTotal(data?.[0]?.total_count ?? 0);
    }
    setAttachmentLoading(false);
  }, [supabase, attachmentStatusFilter, attachmentPage]);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    const { data, error: queryError } = await supabase.rpc("admin_get_settings");
    if (queryError) {
      setError("Não foi possível carregar as configurações administrativas.");
    } else {
      const next = { ...DEFAULT_SETTINGS };
      for (const item of data ?? []) {
        const value = item.setting_value;
        switch (item.setting_key) {
          case "company_name": next.company_name = typeof value === "string" ? value : next.company_name; break;
          case "support_email": next.support_email = typeof value === "string" ? value : ""; break;
          case "maintenance_notice": next.maintenance_notice = typeof value === "string" ? value : ""; break;
          case "group_creation_enabled": next.group_creation_enabled = value === true; break;
          case "max_group_members": next.max_group_members = typeof value === "number" ? value : 50; break;
        }
      }
      setSettings(next);
    }
    setSettingsLoading(false);
  }, [supabase]);

  useEffect(() => { void Promise.resolve().then(loadProfiles); }, [loadProfiles]);

  useEffect(() => {
    if (tab !== "audit") return;
    const timer = window.setTimeout(() => { void loadAudit(); }, 250);
    return () => window.clearTimeout(timer);
  }, [tab, loadAudit]);

  useEffect(() => {
    if (tab !== "logs") return;
    const timer = window.setTimeout(() => { void loadActivity(); }, 250);
    return () => window.clearTimeout(timer);
  }, [tab, loadActivity]);

  useEffect(() => {
    if (tab !== "attachments") return;
    const timer = window.setTimeout(() => { void loadAttachments(); }, 200);
    return () => window.clearTimeout(timer);
  }, [tab, loadAttachments]);

  useEffect(() => {
    if (tab === "settings") void Promise.resolve().then(loadSettings);
  }, [tab, loadSettings]);

  async function statusChange(id: string, status: "active" | "disabled") {
    if (id === currentUserId || busy) return;
    if (reason.trim().length < 8) {
      setError("Informe um motivo com pelo menos 8 caracteres.");
      return;
    }
    setBusy(id);
    setError(null);
    setNotice(null);
    const result = await supabase.rpc("admin_set_profile_status", {
      _profile_id: id, _status: status, _reason: reason.trim()
    });
    if (result.error) setError(result.error.message);
    else {
      setNotice(status === "disabled" ? "Conta desativada." : "Conta reativada.");
      setReason("");
      await loadProfiles();
    }
    setBusy(null);
  }

  async function roleChange(id: string, code: string, grant: boolean) {
    if (id === currentUserId || busy) return;
    if (reason.trim().length < 8) {
      setError("Informe um motivo com pelo menos 8 caracteres.");
      return;
    }
    setBusy(id);
    setError(null);
    setNotice(null);
    const result = await supabase.rpc("admin_set_profile_role", {
      _profile_id: id, _role_code: code, _grant: grant, _reason: reason.trim()
    });
    if (result.error) setError(result.error.message);
    else {
      setNotice(grant ? "Permissão concedida." : "Permissão removida.");
      setReason("");
      await loadProfiles();
    }
    setBusy(null);
  }

  async function resendInvite(profileId: string) {
    if (inviteBusy) return;
    setInviteBusy(true);
    setError(null);
    setNotice(null);
    const { data, error: resendError } = await supabase.functions.invoke("invite-employee", {
      body: { action: "resend", profile_id: profileId }
    });
    if (resendError) setError("Não foi possível reenviar o convite. Verifique a conexão e tente novamente.");
    else if (data?.error) {
      setError(data.error === "email_already_confirmed"
        ? "Este e-mail já foi confirmado. Não é necessário reenviar o convite."
        : data.error === "profile_not_pending"
          ? "Este funcionário não possui um convite pendente."
          : "Falha ao reenviar o convite. Tente novamente mais tarde.");
    } else setNotice("Convite reenviado. O funcionário receberá um novo e-mail para concluir o cadastro.");
    setInviteBusy(false);
  }

  async function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviteBusy) return;
    setInviteBusy(true);
    setError(null);
    setNotice(null);
    const { data, error: inviteError } = await supabase.functions.invoke("invite-employee", {
      body: { email: inviteEmail.trim().toLowerCase(), full_name: inviteName.trim() }
    });
    if (inviteError) setError("Não foi possível enviar o convite. Verifique a configuração da função e o domínio corporativo permitido.");
    else if (data?.error) {
      setError(data.error === "domain_allowlist_not_configured"
        ? "Configure ALLOWED_EMAIL_DOMAINS na função de convite."
        : data.error === "email_domain_not_allowed"
          ? "O domínio do e-mail não está autorizado."
          : "Convite não enviado: verifique os dados e tente novamente.");
    } else {
      setNotice("Convite enviado. O perfil será criado como pendente e precisará ser ativado pela TI após o primeiro acesso.");
      setInviteName("");
      setInviteEmail("");
      await loadProfiles();
    }
    setInviteBusy(false);
  }

  async function deleteAttachment() {
    if (!pendingAttachmentDelete || reason.trim().length < 8 || attachmentDeleteBusy) return;
    setAttachmentDeleteBusy(true);
    setError(null);
    setNotice(null);
    const attachment = pendingAttachmentDelete;
    const { error: storageError } = await supabase.storage.from(attachment.bucket).remove([attachment.object_path]);
    if (storageError) {
      setError("Não foi possível remover o objeto do Storage. O registro foi preservado.");
      setAttachmentDeleteBusy(false);
      return;
    }
    const { error: deleteError } = await supabase.rpc("admin_delete_attachment", {
      _attachment_id: attachment.id,
      _reason: reason.trim()
    });
    if (deleteError) {
      setError("O arquivo foi removido do Storage, mas o registro não foi excluído. Tente novamente para concluir a limpeza.");
    } else {
      setNotice("Anexo excluído definitivamente e ação registrada na auditoria.");
      setReason("");
      setPendingAttachmentDelete(null);
      await loadAttachments();
    }
    setAttachmentDeleteBusy(false);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsSaving(true);
    setError(null);
    setNotice(null);
    const payload: Json = {
      company_name: settings.company_name.trim(),
      support_email: settings.support_email.trim().toLowerCase(),
      maintenance_notice: settings.maintenance_notice.trim(),
      group_creation_enabled: settings.group_creation_enabled,
      max_group_members: settings.max_group_members
    };
    const { error: saveError } = await supabase.rpc("admin_update_settings", { _settings: payload });
    if (saveError) setError(saveError.message);
    else setNotice("Configurações salvas e registradas na auditoria.");
    setSettingsSaving(false);
  }

  const visibleProfiles = profiles.filter((profile) => {
    const query = profileFilter.trim().toLocaleLowerCase("pt-BR");
    return !query || [profile.full_name, profile.corporate_email, profile.employee_code ?? ""]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "employees", label: "Funcionários" },
    { id: "audit", label: "Auditoria" },
    { id: "logs", label: "Registros" },
    { id: "settings", label: "Configurações" },
    { id: "attachments", label: "Anexos" }
  ];

  return (
    <section className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">Administração corporativa</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Painel de TI Calunga</h1>
        <p className="mt-1 text-sm text-slate-500">Gerenciamento de acessos, trilhas de auditoria e parâmetros do ambiente.</p>
      </div>

      <nav aria-label="Seções administrativas" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {tabs.map((item) => (
          <button key={item.id} type="button" aria-current={tab === item.id ? "page" : undefined}
            onClick={() => { setTab(item.id); setError(null); setNotice(null); }}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === item.id ? "bg-red-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            {item.label}
          </button>
        ))}
      </nav>

      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}

      {tab === "employees" ? (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">Convidar funcionário</h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">O convite é enviado pelo Supabase Auth. A conta permanece pendente até a ativação pela TI.</p>
            <form onSubmit={sendInvite} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input required minLength={2} maxLength={120} value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Nome completo" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="E-mail corporativo" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <button disabled={inviteBusy} className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{inviteBusy ? "Enviando..." : "Enviar convite"}</button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <label htmlFor="employee-search" className="mb-2 block text-sm font-semibold text-slate-700">Localizar funcionário</label>
            <input id="employee-search" value={profileFilter} onChange={(event) => setProfileFilter(event.target.value)} placeholder="Nome, e-mail ou matrícula" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <p className="mt-2 text-xs text-slate-500">{visibleProfiles.length} de {profiles.length} funcionário(s)</p>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4"><h2 className="font-semibold text-slate-900">Contas e permissões</h2></div>
            <div className="divide-y divide-slate-100">
              {visibleProfiles.map((profile) => {
                const assigned = roles[profile.id] ?? [];
                const self = profile.id === currentUserId;
                return (
                  <article key={profile.id} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">{profile.full_name}</h3>
                        <p className="mt-0.5 break-all text-xs text-slate-500">{profile.corporate_email}</p>
                        <p className="mt-1 text-xs text-slate-500">{profile.employee_code ? `Matrícula: ${profile.employee_code} · ` : ""}{profile.status}</p>
                        <p className="mt-1 text-xs text-slate-600">Papéis: {assigned.join(", ") || "nenhum"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.status === "pending_invitation" ? (
                          <button type="button" disabled={inviteBusy} onClick={() => void resendInvite(profile.id)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 disabled:opacity-50">{inviteBusy ? "Enviando..." : "Reenviar e-mail"}</button>
                        ) : null}
                        {profile.status === "disabled" ? (
                          <button type="button" disabled={self || busy === profile.id} onClick={() => setPendingStatus({ id: profile.id, status: "active" })} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-40">Reativar</button>
                        ) : (
                          <button type="button" disabled={self || busy === profile.id} onClick={() => setPendingStatus({ id: profile.id, status: "disabled" })} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40">Desativar</button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(["employee", "it_admin", "security_admin"] as const).map((code) => {
                        const granted = assigned.includes(code);
                        return (
                          <button key={code} type="button" disabled={self || profile.status !== "active" || busy === profile.id}
                            onClick={() => void roleChange(profile.id, code, !granted)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${granted ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                            {granted ? "Remover " : "Conceder "}{code}
                          </button>
                        );
                      })}
                    </div>
                    {self ? <p className="text-xs text-slate-400">Sua própria conta administrativa não pode ser alterada aqui.</p> : null}
                  </article>
                );
              })}
              {visibleProfiles.length === 0 ? <p className="p-6 text-sm text-slate-500">Nenhum funcionário corresponde à pesquisa.</p> : null}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "audit" ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold text-slate-600">Data inicial<input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setAuditPage(1); }} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-600">Data final<input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setAuditPage(1); }} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-600">Usuário<select value={actorFilter} onChange={(event) => { setActorFilter(event.target.value); setAuditPage(1); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"><option value="">Todos</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600">Tipo de ação<input value={auditActionFilter} onChange={(event) => { setAuditActionFilter(event.target.value); setAuditPage(1); }} placeholder="Ex.: message.created" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
          </div>
          <div className="divide-y divide-slate-100">
            {auditLoading ? <p className="p-6 text-sm text-slate-500">Carregando auditoria...</p> : auditRows.map((row) => (
              <article key={row.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-semibold text-slate-900">{row.action}</p><p className="mt-1 text-xs text-slate-500">{row.actor_name} · {row.resource_type}{row.resource_id ? ` · ${row.resource_id}` : ""}</p></div>
                  <time className="text-xs text-slate-500">{formatDate(row.occurred_at)}</time>
                </div>
                {row.reason ? <p className="mt-2 text-sm text-slate-600">{row.reason}</p> : null}
                <details className="mt-2 text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Detalhes do evento</summary><pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3">{JSON.stringify(row.metadata, null, 2)}</pre></details>
              </article>
            ))}
            {!auditLoading && auditRows.length === 0 ? <p className="p-6 text-sm text-slate-500">Nenhum evento encontrado para os filtros informados.</p> : null}
          </div>
          <Pagination page={auditPage} total={auditTotal} onPage={setAuditPage} />
        </section>
      ) : null}

      {tab === "logs" ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-semibold text-slate-600">Data inicial<input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setActivityPage(1); }} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-600">Data final<input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setActivityPage(1); }} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-600">Usuário<select value={actorFilter} onChange={(event) => { setActorFilter(event.target.value); setActivityPage(1); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"><option value="">Todos</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600">Evento<input value={eventFilter} onChange={(event) => { setEventFilter(event.target.value); setActivityPage(1); }} placeholder="Tipo de evento" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
            <label className="text-xs font-semibold text-slate-600">Resultado<select value={outcomeFilter} onChange={(event) => { setOutcomeFilter(event.target.value); setActivityPage(1); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"><option value="">Todos</option><option value="success">Sucesso</option><option value="denied">Negado</option><option value="failure">Falha</option><option value="recorded">Registrado</option></select></label>
          </div>
          <div className="divide-y divide-slate-100">
            {activityLoading ? <p className="p-6 text-sm text-slate-500">Carregando registros...</p> : activityRows.map((row) => (
              <article key={`${row.source}-${row.id}`} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-semibold text-slate-900">{row.event_type}</p><p className="mt-1 text-xs text-slate-500">{row.actor_name} · {row.source}{row.target_name ? ` · ${row.target_name}` : ""}</p></div>
                  <div className="text-right"><p className="text-xs font-semibold text-slate-700">{row.outcome}</p><time className="text-xs text-slate-500">{formatDate(row.occurred_at)}</time></div>
                </div>
                {row.reason ? <p className="mt-2 text-sm text-slate-600">{row.reason}</p> : null}
                <details className="mt-2 text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Detalhes do registro</summary><pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3">{JSON.stringify(row.metadata, null, 2)}</pre></details>
              </article>
            ))}
            {!activityLoading && activityRows.length === 0 ? <p className="p-6 text-sm text-slate-500">Nenhum registro encontrado para os filtros informados.</p> : null}
          </div>
          <Pagination page={activityPage} total={activityTotal} onPage={setActivityPage} />
        </section>
      ) : null}

      {tab === "settings" ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="mb-5"><h2 className="font-semibold text-slate-900">Configurações administrativas</h2><p className="mt-1 text-sm text-slate-500">As alterações são validadas no banco e registradas automaticamente na auditoria.</p></div>
          {settingsLoading ? <p className="text-sm text-slate-500">Carregando configurações...</p> : (
            <form onSubmit={saveSettings} className="max-w-2xl space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Nome institucional<input required minLength={2} maxLength={80} value={settings.company_name} onChange={(event) => setSettings((current) => ({ ...current, company_name: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
              <label className="block text-sm font-semibold text-slate-700">E-mail de suporte<input type="email" maxLength={254} value={settings.support_email} onChange={(event) => setSettings((current) => ({ ...current, support_email: event.target.value }))} placeholder="suporte@empresa.com.br" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
              <label className="block text-sm font-semibold text-slate-700">Aviso administrativo<textarea maxLength={300} rows={3} value={settings.maintenance_notice} onChange={(event) => setSettings((current) => ({ ...current, maintenance_notice: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" placeholder="Mensagem opcional para a equipe de TI" /></label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={settings.group_creation_enabled} onChange={(event) => setSettings((current) => ({ ...current, group_creation_enabled: event.target.checked }))} className="h-4 w-4 accent-red-700" />Permitir criação de grupos pelos funcionários</label>
              <label className="block text-sm font-semibold text-slate-700">Máximo de participantes por grupo (incluindo o criador)<input type="number" min={2} max={50} value={settings.max_group_members} onChange={(event) => setSettings((current) => ({ ...current, max_group_members: Number(event.target.value) }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal sm:max-w-xs" /></label>
              <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">A alteração do limite e da criação de grupos é aplicada também pela função transacional do banco, não apenas pela interface.</p>
              <button type="submit" disabled={settingsSaving || settingsLoading} className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{settingsSaving ? "Salvando..." : "Salvar configurações"}</button>
            </form>
          )}
        </section>
      ) : null}

      {tab === "attachments" ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-4">
            <div><h2 className="font-semibold text-slate-900">Quarentena de anexos</h2><p className="mt-1 text-sm text-slate-500">Arquivos pendentes e bloqueados não podem ser visualizados ou baixados por usuários comuns.</p></div>
            <label className="text-xs font-semibold text-slate-600">Status
              <select value={attachmentStatusFilter} onChange={(event) => { setAttachmentStatusFilter(event.target.value); setAttachmentPage(1); }} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                <option value="pending">Em análise</option><option value="rejected">Bloqueados</option><option value="clean">Liberados</option><option value="all">Todos</option>
              </select>
            </label>
          </div>
          <div className="divide-y divide-slate-100">
            {attachmentLoading ? <p className="p-6 text-sm text-slate-500">Carregando anexos...</p> : attachmentRows.map((attachment) => (
              <article key={attachment.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold text-slate-900">{attachment.original_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{attachment.uploader_name} · {attachment.mime_type} · {(attachment.size_bytes / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(attachment.created_at)} · {attachment.bucket}</p>
                  <p className="mt-2 text-xs font-semibold">{attachment.scan_status === "pending" ? "⏳ Em análise — quarentena" : attachment.scan_status === "clean" ? "✓ Liberado após verificação" : "⛔ Bloqueado"}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {attachment.scan_status === "clean" ? (
                    <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Já liberado</span>
                  ) : (
                    <button type="button" disabled title="A liberação depende de um scanner antimalware real, ainda não configurado." className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400 disabled:cursor-not-allowed">Liberar (scanner pendente)</button>
                  )}
                  <button type="button" onClick={() => setPendingAttachmentDelete(attachment)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100">Excluir definitivamente</button>
                </div>
              </article>
            ))}
            {!attachmentLoading && attachmentRows.length === 0 ? <p className="p-6 text-sm text-slate-500">Nenhum anexo encontrado para este filtro.</p> : null}
          </div>
          <Pagination page={attachmentPage} total={attachmentTotal} onPage={setAttachmentPage} />
        </section>
      ) : null}

      {pendingAttachmentDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="attachment-delete-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="attachment-delete-title" className="text-lg font-bold text-slate-900">Excluir anexo definitivamente?</h2>
            <p className="mt-2 break-all text-sm text-slate-600">{pendingAttachmentDelete.original_name}</p>
            <p className="mt-2 text-sm text-slate-600">O objeto será removido do Storage e o registro será excluído, com trilha de auditoria.</p>
            <label className="mt-4 block text-sm font-semibold text-slate-700">Justificativa obrigatória<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Informe o motivo (mínimo 8 caracteres)" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button type="button" disabled={attachmentDeleteBusy} onClick={() => setPendingAttachmentDelete(null)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button>
              <button type="button" disabled={attachmentDeleteBusy || reason.trim().length < 8} onClick={() => void deleteAttachment()} className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{attachmentDeleteBusy ? "Excluindo..." : "Confirmar exclusão"}</button>
            </div>
          </section>
        </div>
      ) : null}
      {pendingStatus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="status-confirm-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="status-confirm-title" className="text-lg font-bold text-slate-900">{pendingStatus.status === "disabled" ? "Confirmar desativação" : "Confirmar reativação"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Você está prestes a {pendingStatus.status === "disabled" ? "desativar" : "reativar"} o acesso de <strong>{profiles.find((profile) => profile.id === pendingStatus.id)?.full_name ?? "este funcionário"}</strong>. {pendingStatus.status === "disabled" ? "O acesso será bloqueado; mensagens e arquivos existentes permanecem preservados." : "O funcionário voltará a acessar os recursos autorizados ao seu perfil."}</p>
            <label className="mt-4 block text-sm font-semibold text-slate-700">Justificativa obrigatória<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Informe o motivo (mínimo 8 caracteres)" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button type="button" onClick={() => setPendingStatus(null)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button>
              <button type="button" disabled={busy !== null || reason.trim().length < 8} onClick={() => { const action = pendingStatus; setPendingStatus(null); void statusChange(action.id, action.status); }} className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Confirmar ação</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
