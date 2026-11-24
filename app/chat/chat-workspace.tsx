"use client";

import { useCallback, useEffect, useMemo, useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type Conversation = Tables<"conversations">;
type Message = Tables<"messages">;
type DirectoryProfile = Pick<Tables<"profiles">, "id" | "full_name">;
type GlobalSearchResult = { category: string; id: string; title: string; subtitle: string | null; snippet: string | null; conversation_id: string | null; created_at: string };
type MessageAttachmentStatus = { message_id: string; attachment_id: string; original_name: string; mime_type: string; size_bytes: number; scan_status: string; bucket: string; object_path: string | null };
type ConversationSummary = {
  conversation_id: string;
  conversation_type: "direct" | "group";
  conversation_title: string | null;
  created_at: string;
  participant_name: string | null;
  participant_avatar_path: string | null;
  active_member_count: number;
  last_message_body: string | null;
  last_message_sender_name: string | null;
  last_message_created_at: string | null;
  last_attachment_mime_type: string | null;
  last_attachment_scan_status: string | null;
};

function formatConversationTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function getInitials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toLocaleUpperCase("pt-BR") || "C";
}

type ChatWorkspaceProps = {
  userId: string;
  userName: string;
};

export function ChatWorkspace({ userId, userName }: ChatWorkspaceProps) {
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationSummaries, setConversationSummaries] = useState<ConversationSummary[]>([]);
  const [directory, setDirectory] = useState<DirectoryProfile[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [newParticipantId, setNewParticipantId] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [activeMemberIds, setActiveMemberIds] = useState<string[]>([]);
  const [myMemberRole, setMyMemberRole] = useState<string | null>(null);
  const [newGroupMemberId, setNewGroupMemberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [updatingMembers, setUpdatingMembers] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [conversationFilter, setConversationFilter] = useState<"all" | "direct" | "group" | "unread">("all");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [receipts, setReceipts] = useState<Tables<"message_receipts">[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResult[]>([]);
  const [globalSearchBusy, setGlobalSearchBusy] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);
  const [attachmentStatuses, setAttachmentStatuses] = useState<Record<string, MessageAttachmentStatus>>({});
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<Record<string, string>>({});

  const refreshConversationSummaries = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_conversation_summaries");
    if (!error) setConversationSummaries((data ?? []) as ConversationSummary[]);
  }, [supabase]);

  const markMessagesRead = useCallback(async (items: Message[]) => {
    const incoming = items.filter((item) => item.sender_id !== userId);
    if (incoming.length === 0) return;
    const now = new Date().toISOString();
    const rows = incoming.map((item) => ({
      message_id: item.id, profile_id: userId, delivered_at: now, read_at: now
    }));
    const { error } = await supabase.from("message_receipts").upsert(rows, {
      onConflict: "message_id,profile_id", ignoreDuplicates: false
    });
    if (error) {
      setErrorMessage("Não foi possível atualizar as confirmações de leitura.");
      return;
    }
    const { data } = await supabase.from("message_receipts")
      .select("message_id,profile_id,delivered_at,read_at")
      .in("message_id", incoming.map((item) => item.id));
    if (data) setReceipts((current) => [
      ...current.filter((receipt) => !incoming.some((item) => item.id === receipt.message_id && receipt.profile_id === userId)),
      ...data
    ]);
  }, [supabase, userId]);

  const refreshUnreadCounts = useCallback(async () => {
    const ids = conversations.map((item) => item.id);
    if (ids.length === 0) { setUnreadCounts({}); return; }
    const { data: recentMessages, error } = await supabase.from("messages")
      .select("id,conversation_id,sender_id,client_message_id,body,reply_to_id,created_at")
      .in("conversation_id", ids).neq("sender_id", userId)
      .order("created_at", { ascending: false }).limit(500);
    if (error || !recentMessages) return;
    const messageIds = recentMessages.map((item) => item.id);
    const { data: readReceipts } = messageIds.length
      ? await supabase.from("message_receipts").select("message_id,read_at").eq("profile_id", userId).in("message_id", messageIds)
      : { data: [] as Pick<Tables<"message_receipts">, "message_id" | "read_at">[] };
    const readSet = new Set((readReceipts ?? []).filter((item) => item.read_at).map((item) => item.message_id));
    const counts: Record<string, number> = {};
    for (const item of recentMessages) if (!readSet.has(item.id)) counts[item.conversation_id] = (counts[item.conversation_id] ?? 0) + 1;
    setUnreadCounts(counts);
  }, [conversations, supabase, userId]);

  async function requestNotifications() {
    if (!("Notification" in window)) return;
    setNotificationPermission(await Notification.requestPermission());
  }

  useEffect(() => {
    const term = globalSearchTerm.trim();
    if (term.length < 2) return;

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setGlobalSearchBusy(true);
      setGlobalSearchError(null);
      const { data, error } = await supabase.rpc("search_chatapp", { _query: term, _limit: 6 });
      if (!active) return;
      if (error) {
        setGlobalSearchResults([]);
        setGlobalSearchError("Não foi possível concluir a pesquisa. Tente novamente.");
      } else {
        setGlobalSearchResults((data ?? []) as GlobalSearchResult[]);
      }
      setGlobalSearchBusy(false);
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [globalSearchTerm, supabase]);

  function highlightSearchTerm(value: string, term: string) {
    const index = value.toLocaleLowerCase("pt-BR").indexOf(term.toLocaleLowerCase("pt-BR"));
    if (index < 0 || !term) return value;
    return (
      <>
        {value.slice(0, index)}
        <mark className="rounded bg-amber-100 px-0.5 text-inherit">{value.slice(index, index + term.length)}</mark>
        {value.slice(index + term.length)}
      </>
    );
  }

  async function openGlobalSearchResult(result: GlobalSearchResult) {
    setGlobalSearchOpen(false);
    if (result.category === "Funcionários") {
      if (result.id === userId) return;
      const { data: conversationId, error } = await supabase.rpc("create_conversation", {
        _type: "direct",
        _member_ids: [result.id]
      });
      if (error || !conversationId) {
        setErrorMessage("Não foi possível abrir uma conversa com este funcionário.");
        return;
      }
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .select("id,type,title,created_by,direct_key,created_at,archived_at")
        .eq("id", conversationId)
        .single();
      if (conversationError || !conversation) {
        setErrorMessage("A conversa foi localizada, mas não foi possível carregá-la.");
        return;
      }
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
      setSelectedConversationId(conversation.id);
      void refreshConversationSummaries();
    } else if (result.conversation_id) {
      setSelectedConversationId(result.conversation_id);
    }
    setGlobalSearchTerm("");
    setGlobalSearchResults([]);
  }

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      setLoading(true);
      setErrorMessage(null);

      const [membershipsResult, directoryResult] = await Promise.all([
        supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("profile_id", userId)
          .is("left_at", null),
        supabase
          .from("profiles")
          .select("id,full_name")
          .neq("id", userId)
          .order("full_name", { ascending: true })
      ]);

      if (!active) return;

      if (membershipsResult.error || directoryResult.error) {
        setErrorMessage("Não foi possível carregar as conversas ou o diretório de funcionários.");
        setLoading(false);
        return;
      }

      const conversationIds = [...new Set(membershipsResult.data.map((item) => item.conversation_id))];
      const conversationsResult = conversationIds.length
        ? await supabase
            .from("conversations")
            .select("id,type,title,created_by,direct_key,created_at,archived_at")
            .in("id", conversationIds)
            .is("archived_at", null)
            .order("created_at", { ascending: false })
        : { data: [] as Conversation[], error: null };

      if (!active) return;

      if (conversationsResult.error) {
        setErrorMessage("Não foi possível carregar a lista de conversas.");
      } else {
        const nextConversations = conversationsResult.data ?? [];
        setConversations(nextConversations);
        setSelectedConversationId((current) =>
          current && nextConversations.some((item) => item.id === current)
            ? current
            : nextConversations[0]?.id ?? null
        );
      }

      setDirectory(directoryResult.data ?? []);
      await refreshConversationSummaries();
      if (!active) return;
      setLoading(false);
    }

    void loadWorkspace();
    return () => {
      active = false;
    };
  }, [supabase, userId, refreshConversationSummaries]);

  useEffect(() => {
    if (!selectedConversationId) return;
    const conversationId = selectedConversationId;
    let active = true;
    async function loadAttachmentStatuses() {
      const { data, error } = await supabase.rpc("get_message_attachment_status", {
        _conversation_id: conversationId
      });
      if (!active || error) return;
      const next: Record<string, MessageAttachmentStatus> = {};
      for (const item of data ?? []) next[item.message_id] = item as MessageAttachmentStatus;
      setAttachmentStatuses(next);
    }
    void Promise.resolve().then(loadAttachmentStatuses);
    return () => { active = false; };
  }, [supabase, selectedConversationId, messages.length]);

  useEffect(() => {
    let active = true;
    async function loadCleanImagePreviews() {
      const cleanImages = Object.values(attachmentStatuses).filter((item) =>
        item.scan_status === "clean" && item.mime_type === "image/jpeg"
        && item.bucket === "chat-attachments" && item.object_path
      );
      const entries = await Promise.all(cleanImages.map(async (item) => {
        const { data, error } = await supabase.storage.from(item.bucket).createSignedUrl(item.object_path!, 60);
        return !error && data?.signedUrl ? [item.message_id, data.signedUrl] as const : null;
      }));
      if (!active) return;
      setAttachmentPreviewUrls(Object.fromEntries(entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null)));
    }
    void Promise.resolve().then(loadCleanImagePreviews);
    return () => { active = false; };
  }, [attachmentStatuses, supabase]);

  useEffect(() => {
    const activeConversationId = selectedConversationId ?? "";
    if (!activeConversationId) return;

    let active = true;
    const channel = supabase
      .channel(`conversation-messages-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) =>
            current.some((item) => item.id === incoming.id)
              ? current
              : [...current, incoming].sort((a, b) => a.created_at.localeCompare(b.created_at))
          );
          if (incoming.sender_id !== userId) {
            void markMessagesRead([incoming]);
            if (document.hidden && "Notification" in window && Notification.permission === "granted") {
              const conversation = conversations.find((item) => item.id === activeConversationId);
              new Notification(conversation?.title ?? "Nova mensagem", { body: incoming.body.slice(0, 140), tag: incoming.id });
            }
          }
          void refreshUnreadCounts();
          void refreshConversationSummaries();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_receipts" },
        (payload) => {
          const changed = (payload.new ?? payload.old) as Tables<"message_receipts">;
          setReceipts((current) => [
            ...current.filter((item) => !(item.message_id === changed.message_id && item.profile_id === changed.profile_id)),
            ...(payload.eventType === "DELETE" ? [] : [changed])
          ]);
        }
      )
      .subscribe((status) => {
        if (active) setRealtimeStatus(status.toLowerCase());
      });

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("id,conversation_id,sender_id,client_message_id,body,reply_to_id,created_at")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!active) return;
      if (error) {
        setErrorMessage("Não foi possível carregar o histórico desta conversa.");
        return;
      }
      setMessages([...(data ?? [])].reverse());
      setHasMoreMessages((data ?? []).length === 100);
      await markMessagesRead(data ?? []);
      const loadedIds = (data ?? []).map((item) => item.id);
      if (loadedIds.length) {
        const { data: receiptRows } = await supabase.from("message_receipts")
          .select("message_id,profile_id,delivered_at,read_at").in("message_id", loadedIds);
        if (receiptRows) setReceipts(receiptRows);
      }
      await refreshUnreadCounts();
    }

    void loadMessages();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, selectedConversationId, userId, conversations, markMessagesRead, refreshUnreadCounts, refreshConversationSummaries]);

  useEffect(() => {
    const channel = supabase
      .channel("conversation-list-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages"
      }, () => {
        void refreshConversationSummaries();
        void refreshUnreadCounts();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, refreshConversationSummaries, refreshUnreadCounts]);

  useEffect(() => { void Promise.resolve().then(refreshUnreadCounts); }, [refreshUnreadCounts, selectedConversationId]);

  useEffect(() => {
    if (conversations.length === 0) return;
    const conversationIds = new Set(conversations.map((item) => item.id));
    const channel = supabase.channel("user-conversation-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const incoming = payload.new as Message;
        if (incoming.sender_id === userId || !conversationIds.has(incoming.conversation_id) || incoming.conversation_id === selectedConversationId) return;
        void refreshUnreadCounts();
        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
          const conversation = conversations.find((item) => item.id === incoming.conversation_id);
          new Notification(conversation?.title ?? "Nova mensagem", {
            body: incoming.body.slice(0, 140),
            tag: incoming.id
          });
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, conversations, selectedConversationId, userId, refreshUnreadCounts]);

  useEffect(() => {
    const conversationId = selectedConversationId ?? "";
    if (!conversationId) return;

    let active = true;
    async function loadMembers() {
      const { data, error } = await supabase
        .from("conversation_members")
        .select("profile_id,member_role")
        .eq("conversation_id", conversationId)
        .is("left_at", null);

      if (!active) return;
      if (error) {
        setErrorMessage("Não foi possível carregar os participantes desta conversa.");
        return;
      }
      setActiveMemberIds(data.map((member) => member.profile_id));
      setMyMemberRole(data.find((member) => member.profile_id === userId)?.member_role ?? null);
    }

    void loadMembers();
    return () => {
      active = false;
    };
  }, [supabase, selectedConversationId, userId]);

  async function searchMessages(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = searchTerm.trim();
    if (term.length < 2 || searching) return;

    const conversationIds = conversations.map((conversation) => conversation.id);
    if (conversationIds.length === 0) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setErrorMessage(null);
    const escapedTerm = term;
    const { data, error } = await supabase
      .from("messages")
      .select("id,conversation_id,sender_id,client_message_id,body,reply_to_id,created_at")
      .in("conversation_id", conversationIds)
      .ilike("body", `%${escapedTerm}%`)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      setErrorMessage("Não foi possível pesquisar as mensagens. Tente novamente.");
      setSearchResults([]);
    } else {
      setSearchResults(data ?? []);
    }
    setSearching(false);
  }

  async function loadOlderMessages() {
    if (!selectedConversationId || !messages[0] || loadingOlderMessages || !hasMoreMessages) return;
    setLoadingOlderMessages(true);
    const { data, error } = await supabase.from("messages")
      .select("id,conversation_id,sender_id,client_message_id,body,reply_to_id,created_at")
      .eq("conversation_id", selectedConversationId)
      .lt("created_at", messages[0].created_at)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      setErrorMessage("Não foi possível carregar mensagens anteriores.");
    } else {
      const older = [...(data ?? [])].reverse();
      setMessages((current) => [...older, ...current]);
      setHasMoreMessages((data ?? []).length === 100);
    }
    setLoadingOlderMessages(false);
  }

  async function uploadAttachment(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || !selectedConversationId || uploadingAttachment) return;

    setUploadingAttachment(true);
    setAttachmentNotice(null);
    setErrorMessage(null);
    try {
      if (file.size < 1 || file.size > 5 * 1024 * 1024) {
        throw new Error("O arquivo deve ter até 5 MB.");
      }
      if (file.type !== "application/pdf" && file.type !== "image/jpeg") {
        throw new Error("Formato não permitido. Envie somente PDF ou JPEG.");
      }
      const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      const validPdf = file.type === "application/pdf"
        && new TextDecoder().decode(signature.slice(0, 5)) === "%PDF-";
      const validJpeg = file.type === "image/jpeg"
        && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
      if (!validPdf && !validJpeg) {
        throw new Error("O conteúdo do arquivo não corresponde ao formato informado.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if ((file.type === "application/pdf" && extension !== "pdf")
        || (file.type === "image/jpeg" && !["jpg", "jpeg"].includes(extension))) {
        throw new Error("A extensão do arquivo não corresponde ao formato permitido.");
      }

      const bytes = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const sha256 = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0")).join("");
      const rawBaseName = file.name.slice(0, file.name.lastIndexOf("."));
      const safeBaseName = rawBaseName.normalize("NFKC").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80) || "anexo";
      const safeName = `${safeBaseName}.${extension}`;
      const objectPath = `${selectedConversationId}/${userId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from("chat-quarantine").upload(objectPath, file, {
        cacheControl: "0",
        contentType: file.type,
        upsert: false
      });
      if (uploadError) throw new Error("Não foi possível enviar o arquivo para a quarentena.");

      const { data, error: registerError } = await supabase.rpc("create_attachment_message", {
        _conversation_id: selectedConversationId,
        _client_message_id: crypto.randomUUID(),
        _original_name: file.name.slice(0, 180),
        _mime_type: file.type,
        _size_bytes: file.size,
        _sha256: sha256,
        _object_path: objectPath
      });
      if (registerError || !data?.[0]) {
        const { error: cleanupError } = await supabase.storage.from("chat-quarantine").remove([objectPath]);
        if (cleanupError) {
          throw new Error("O registro do anexo falhou e o arquivo temporário permanece em quarentena. Solicite a limpeza à TI.");
        }
        throw new Error("O arquivo foi enviado, mas não foi possível registrar o anexo. O envio temporário foi removido.");
      }

      const createdMessage = data[0] as Message;
      setMessages((current) => [...current, createdMessage]);
      setAttachmentNotice("Arquivo recebido e mantido em quarentena. Ele ficará indisponível até a verificação de segurança.");
      void refreshConversationSummaries();
    } catch (uploadError) {
      setErrorMessage(uploadError instanceof Error ? uploadError.message : "Falha ao enviar o anexo.");
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function downloadCleanAttachment(attachment: MessageAttachmentStatus) {
    if (attachment.scan_status !== "clean" || attachment.bucket !== "chat-attachments" || !attachment.object_path) {
      setErrorMessage("Este arquivo ainda não está liberado para download.");
      return;
    }
    const { data, error } = await supabase.storage.from(attachment.bucket).download(attachment.object_path);
    if (error || !data) {
      setErrorMessage("Não foi possível baixar o anexo liberado.");
      return;
    }
    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = attachment.original_name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    const conversationId = selectedConversationId;
    if (!body || !conversationId || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          client_message_id: crypto.randomUUID(),
          body
        })
        .select("id,conversation_id,sender_id,client_message_id,body,reply_to_id,created_at")
        .single();

      if (error) {
        console.error("ChatApp message send failed", {
          code: error.code,
          message: error.message,
          hint: error.hint
        });
        if (error.code === "42501") {
          setErrorMessage("Você não tem autorização para enviar mensagens nesta conversa. Confirme se ainda participa dela.");
        } else if (error.code === "42P17") {
          setErrorMessage("O banco encontrou um problema na regra de segurança do envio. A equipe técnica foi informada.");
        } else if (error.code === "23514" || error.code === "22023") {
          setErrorMessage("A mensagem não atende às regras de validação. Revise o texto e tente novamente.");
        } else if (error.code === "23505") {
          setErrorMessage("Esta mensagem já foi registrada. Atualize a conversa para conferir o histórico.");
        } else {
          setErrorMessage("Não foi possível enviar a mensagem devido a uma falha de comunicação. O texto foi mantido para nova tentativa.");
        }
        return;
      }

      setMessages((current) =>
        current.some((item) => item.id === data.id)
          ? current
          : [...current, data].sort((a, b) => a.created_at.localeCompare(b.created_at))
      );
      void refreshConversationSummaries();
      setDraft((current) => current === body ? "" : current);
    } catch (sendError) {
      console.error("ChatApp message send request failed", sendError);
      setErrorMessage("Não foi possível concluir o envio. Verifique sua conexão; o texto foi mantido para nova tentativa.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function createDirectConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newParticipantId || creating) return;

    setCreating(true);
    setErrorMessage(null);

    const { data, error } = await supabase.rpc("create_conversation", {
      _type: "direct",
      _member_ids: [newParticipantId]
    });

    if (error || !data) {
      setErrorMessage("Não foi possível criar a conversa. Confirme se a conta selecionada está ativa.");
      setCreating(false);
      return;
    }

    const { data: refreshed, error: refreshError } = await supabase
      .from("conversations")
      .select("id,type,title,created_by,direct_key,created_at,archived_at")
      .eq("id", data)
      .single();

    if (!refreshError && refreshed) {
      setConversations((current) =>
        [refreshed, ...current.filter((item) => item.id !== refreshed.id)]
      );
      setSelectedConversationId(refreshed.id);
      void refreshConversationSummaries();
      setNewParticipantId("");
    } else {
      setErrorMessage("Conversa criada, mas não foi possível atualizar a lista. Atualize a página.");
    }

    setCreating(false);
  }

  async function addGroupMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId || !newGroupMemberId || updatingMembers || (myMemberRole !== "owner" && myMemberRole !== "admin")) return;

    setUpdatingMembers(true);
    setErrorMessage(null);
    const { error } = await supabase.from("conversation_members").insert({
      conversation_id: selectedConversationId,
      profile_id: newGroupMemberId,
      member_role: "member",
      added_by: userId
    });

    if (error) {
      setErrorMessage("Não foi possível adicionar o participante. Verifique suas permissões.");
    } else {
      setActiveMemberIds((current) => [...new Set([...current, newGroupMemberId])]);
      void refreshConversationSummaries();
      setNewGroupMemberId("");
    }
    setUpdatingMembers(false);
  }

  async function removeGroupMember(profileId: string) {
    if (!selectedConversationId || profileId === userId || updatingMembers || (myMemberRole !== "owner" && myMemberRole !== "admin")) return;

    setUpdatingMembers(true);
    setErrorMessage(null);
    const { error } = await supabase
      .from("conversation_members")
      .update({ left_at: new Date().toISOString() })
      .eq("conversation_id", selectedConversationId)
      .eq("profile_id", profileId);

    if (error) {
      setErrorMessage("Não foi possível remover o participante. Verifique suas permissões.");
    } else {
      setActiveMemberIds((current) => current.filter((id) => id !== profileId));
      void refreshConversationSummaries();
    }
    setUpdatingMembers(false);
  }

  async function leaveGroupConversation() {
    if (!selectedConversationId || selectedConversation?.type !== "group" || updatingMembers) return;

    setUpdatingMembers(true);
    setErrorMessage(null);
    const { error } = await supabase
      .from("conversation_members")
      .update({ left_at: new Date().toISOString() })
      .eq("conversation_id", selectedConversationId)
      .eq("profile_id", userId);

    if (error) {
      setErrorMessage("Não foi possível sair do grupo. Tente novamente.");
    } else {
      setConversations((current) => current.filter((item) => item.id !== selectedConversationId));
      setSelectedConversationId(null);
      setMessages([]);
      setActiveMemberIds([]);
      setMyMemberRole(null);
      setNewGroupMemberId("");
      void refreshConversationSummaries();
    }
    setUpdatingMembers(false);
  }

  async function createGroupConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = groupTitle.trim();
    if (!title || groupMemberIds.length < 1 || groupMemberIds.length > 49 || creatingGroup) return;

    setCreatingGroup(true);
    setErrorMessage(null);

    const { data, error } = await supabase.rpc("create_conversation", {
      _type: "group",
      _title: title,
      _member_ids: groupMemberIds
    });

    if (error || !data) {
      setErrorMessage("Não foi possível criar o grupo. Verifique título e participantes ativos.");
      setCreatingGroup(false);
      return;
    }

    const { data: refreshed, error: refreshError } = await supabase
      .from("conversations")
      .select("id,type,title,created_by,direct_key,created_at,archived_at")
      .eq("id", data)
      .single();

    if (!refreshError && refreshed) {
      setConversations((current) => [refreshed, ...current.filter((item) => item.id !== refreshed.id)]);
      setSelectedConversationId(refreshed.id);
      void refreshConversationSummaries();
      setGroupTitle("");
      setGroupMemberIds([]);
    } else {
      setErrorMessage("Grupo criado, mas não foi possível atualizar a lista. Atualize a página.");
    }

    setCreatingGroup(false);
  }

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId);
  const summaryByConversationId = useMemo(
    () => new Map(conversationSummaries.map((summary) => [summary.conversation_id, summary])),
    [conversationSummaries]
  );
  const selectedSummary = selectedConversationId ? summaryByConversationId.get(selectedConversationId) : undefined;
  const selectedConversationTitle = selectedConversation?.type === "group"
    ? selectedConversation.title ?? "Grupo privado"
    : selectedSummary?.participant_name ?? "Conversa individual";
  const visibleConversations = useMemo(() => conversations.filter((conversation) => {
    const summary = summaryByConversationId.get(conversation.id);
    const title = conversation.type === "group"
      ? conversation.title ?? "Grupo privado"
      : summary?.participant_name ?? "Conversa individual";
    const preview = summary?.last_message_body ?? "";
    const query = conversationQuery.trim().toLocaleLowerCase("pt-BR");
    const matchesQuery = !query || title.toLocaleLowerCase("pt-BR").includes(query) || preview.toLocaleLowerCase("pt-BR").includes(query);
    const matchesFilter = conversationFilter === "all"
      || (conversationFilter === "direct" && conversation.type === "direct")
      || (conversationFilter === "group" && conversation.type === "group")
      || (conversationFilter === "unread" && (unreadCounts[conversation.id] ?? 0) > 0);
    return matchesQuery && matchesFilter;
  }), [conversations, conversationQuery, conversationFilter, unreadCounts, summaryByConversationId]);

  return (
    <section className="mx-auto max-w-[1600px] p-4 xl:p-6">
      <div className="relative z-30 mb-4 max-w-3xl">
        <label htmlFor="global-search" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">Pesquisa global</label>
        <input
          id="global-search"
          value={globalSearchTerm}
          onFocus={() => setGlobalSearchOpen(true)}
          onChange={(event) => { const value = event.target.value; setGlobalSearchTerm(value); setGlobalSearchOpen(true); if (value.trim().length < 2) { setGlobalSearchResults([]); setGlobalSearchError(null); setGlobalSearchBusy(false); } }}
          onKeyDown={(event) => { if (event.key === "Escape") setGlobalSearchOpen(false); }}
          maxLength={100}
          placeholder="Buscar funcionários, grupos e mensagens..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          aria-controls="global-search-results"
          autoComplete="off"
        />
        {globalSearchOpen && globalSearchTerm.trim().length >= 2 ? (
          <div id="global-search-results" className="absolute left-0 right-0 top-full mt-2 max-h-[min(70vh,520px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl" role="region" aria-label="Resultados da pesquisa">
            {globalSearchBusy ? <p className="p-3 text-sm text-slate-500">Pesquisando...</p> : null}
            {globalSearchError ? <p role="alert" className="p-3 text-sm text-red-700">{globalSearchError}</p> : null}
            {!globalSearchBusy && !globalSearchError && globalSearchResults.length === 0 ? <p className="p-3 text-sm text-slate-500">Nenhum resultado encontrado.</p> : null}
            {(["Funcionários", "Grupos", "Mensagens"] as const).map((category) => {
              const results = globalSearchResults.filter((item) => item.category === category);
              if (results.length === 0) return null;
              return (
                <section key={category} className="mb-2 last:mb-0">
                  <h3 className="px-2 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{category}</h3>
                  {results.map((result) => (
                    <button key={`${result.category}-${result.id}`} type="button" onClick={() => void openGlobalSearchResult(result)} className="block w-full rounded-lg px-3 py-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                      <span className="block truncate text-sm font-semibold text-slate-900">{highlightSearchTerm(result.title, globalSearchTerm.trim())}</span>
                      {result.subtitle ? <span className="mt-0.5 block truncate text-xs text-slate-500">{result.subtitle}</span> : null}
                      {result.snippet ? <span className="mt-1 block line-clamp-2 text-xs text-slate-600">{highlightSearchTerm(result.snippet, globalSearchTerm.trim())}</span> : null}
                      {category === "Mensagens" ? <time className="mt-1 block text-[10px] text-slate-400">{new Date(result.created_at).toLocaleString("pt-BR")}</time> : null}
                    </button>
                  ))}
                </section>
              );
            })}
          </div>
        ) : null}
        <p className="mt-1 text-[11px] text-slate-400">A pesquisa respeita as conversas e os funcionários disponíveis para sua conta.</p>
      </div>
      <div className="grid min-h-[calc(100vh-170px)] grid-cols-1 gap-4 lg:grid-cols-[350px_minmax(0,1fr)]">
      <aside className="flex min-h-[280px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Conversas</h2>
          <p className="mt-1 text-xs text-slate-500">Somente conversas privadas das quais você participa.</p>
        </div>

        <form onSubmit={searchMessages} className="mb-4 space-y-2">
          <label htmlFor="message-search" className="block text-xs font-medium text-slate-600">Pesquisar mensagens</label>
          <div className="flex gap-2">
            <input
              id="message-search"
              value={searchTerm}
              onChange={(event) => { setSearchTerm(event.target.value); setHasSearched(false); }}
              minLength={2}
              maxLength={120}
              placeholder="Buscar em suas conversas"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={searchTerm.trim().length < 2 || searching}
              className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {searching ? "..." : "Buscar"}
            </button>
          </div>
          {searchResults.length > 0 ? (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2" aria-live="polite">
              <p className="px-2 py-1 text-xs text-slate-500">{searchResults.length} resultado(s), limite de 30</p>
              {searchResults.map((result) => {
                const conversation = conversations.find((item) => item.id === result.conversation_id);
                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => { setSelectedConversationId(result.conversation_id); setSearchResults([]); }}
                    className="block w-full rounded-md px-2 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="block text-xs font-semibold text-blue-700">{conversation?.title ?? "Conversa individual"}</span>
                    <span className="mt-1 block line-clamp-2 text-xs text-slate-700">{result.body}</span>
                    <time className="mt-1 block text-[10px] text-slate-400">{new Date(result.created_at).toLocaleString("pt-BR")}</time>
                  </button>
                );
              })}
            </div>
          ) : hasSearched && searchTerm.trim().length >= 2 && !searching ? (
            <p className="text-xs text-slate-500">Sem resultados para a última pesquisa.</p>
          ) : null}
        </form>

        <form onSubmit={createDirectConversation} className="mb-4 space-y-2">
          <label className="block text-xs font-medium text-slate-600" htmlFor="new-participant">
            Iniciar conversa individual
          </label>
          <select
            id="new-participant"
            value={newParticipantId}
            onChange={(event) => setNewParticipantId(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Selecione um funcionário ativo</option>
            {directory.map((person) => (
              <option key={person.id} value={person.id}>{person.full_name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!newParticipantId || creating}
            className="w-full rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Criando..." : "Nova conversa"}
          </button>
        </form>

        <form onSubmit={createGroupConversation} className="mb-4 space-y-2 border-t border-slate-100 pt-4">
          <label className="block text-xs font-medium text-slate-600" htmlFor="group-title">
            Criar grupo privado
          </label>
          <input
            id="group-title"
            value={groupTitle}
            onChange={(event) => setGroupTitle(event.target.value)}
            maxLength={100}
            placeholder="Nome do grupo"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="block text-xs text-slate-500" htmlFor="group-members">
            Selecione de 1 a 49 participantes (Ctrl/Cmd para múltipla seleção)
          </label>
          <select
            id="group-members"
            multiple
            size={4}
            value={groupMemberIds}
            onChange={(event) => setGroupMemberIds(Array.from(event.target.selectedOptions, (option) => option.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {directory.map((person) => (
              <option key={person.id} value={person.id}>{person.full_name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!groupTitle.trim() || groupMemberIds.length < 1 || groupMemberIds.length > 49 || creatingGroup}
            className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creatingGroup ? "Criando grupo..." : "Criar grupo"}
          </button>
        </form>

        <div className="mb-3 space-y-3">
          <label htmlFor="conversation-filter-search" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Localizar conversa</label>
          <input id="conversation-filter-search" value={conversationQuery} onChange={(event) => setConversationQuery(event.target.value)} placeholder="Nome do contato ou grupo" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="grid grid-cols-4 gap-1" aria-label="Filtrar conversas">
            {([
              ["all", "Todas"],
              ["direct", "Individuais"],
              ["group", "Grupos"],
              ["unread", "Não lidas"]
            ] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={conversationFilter === value} onClick={() => setConversationFilter(value)} className={`rounded-lg px-2 py-2 text-[11px] font-semibold ${conversationFilter === value ? "bg-red-50 text-red-800 ring-1 ring-red-200" : "text-slate-500 hover:bg-slate-50"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {loading ? (
            <p className="py-4 text-sm text-slate-500">Carregando conversas...</p>
          ) : conversations.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Você ainda não participa de nenhuma conversa.</p>
          ) : visibleConversations.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Nenhuma conversa corresponde ao filtro selecionado.</p>
          ) : (
            visibleConversations.map((conversation) => {
              const summary = summaryByConversationId.get(conversation.id);
              const title = conversation.type === "group"
                ? conversation.title ?? "Grupo privado"
                : summary?.participant_name ?? "Conversa individual";
              const attachmentStatus = summary?.last_attachment_scan_status;
              const attachmentPreview = attachmentStatus === "pending"
                ? "📎 Anexo em análise"
                : attachmentStatus === "rejected"
                  ? "⛔ Anexo bloqueado"
                  : attachmentStatus === "clean"
                    ? (summary?.last_attachment_mime_type === "application/pdf" ? "📄 Documento" : "🖼️ Imagem")
                    : null;
              const messagePreview = attachmentPreview ?? summary?.last_message_body ?? "Nenhuma mensagem ainda";
              const preview = conversation.type === "group" && summary?.last_message_sender_name
                ? `${summary.last_message_sender_name}: ${messagePreview}`
                : messagePreview;
              const timestamp = formatConversationTime(summary?.last_message_created_at ?? summary?.created_at ?? conversation.created_at);
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${selectedConversationId === conversation.id ? "bg-red-50 ring-1 ring-red-200" : "hover:bg-slate-50"}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${conversation.type === "group" ? "bg-slate-200 text-slate-700" : "bg-red-100 text-red-800"}`} aria-hidden="true">
                    {conversation.type === "group" ? "#" : getInitials(title)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{title}</span>
                      <time className="shrink-0 text-[10px] text-slate-400">{timestamp}</time>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-xs text-slate-500">{preview}</span>
                      {(unreadCounts[conversation.id] ?? 0) > 0 ? (
                        <span className="shrink-0 rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-semibold text-white">{unreadCounts[conversation.id]}</span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {conversation.type === "group" ? `Grupo · ${summary?.active_member_count ?? 0} participantes` : "Conversa individual"}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              {selectedConversation ? selectedConversationTitle : "Selecione uma conversa"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {selectedConversation?.type === "group" ? `Grupo · ${selectedSummary?.active_member_count ?? activeMemberIds.length} participantes · ` : selectedConversation ? "Conversa individual · " : ""}
              Sincronização: {selectedConversationId ? (realtimeStatus === "subscribed" ? "conectada" : realtimeStatus) : "desconectada"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {notificationPermission !== "granted" ? (
              <button type="button" onClick={() => void requestNotifications()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Ativar notificações</button>
            ) : <span className="text-[10px] text-emerald-700">Notificações ativadas</span>}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{userName}</span>
          </div>
        </header>

        {errorMessage ? (
          <p role="alert" className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {selectedConversation?.type === "group" ? (
          <div className="border-b border-slate-200 bg-white px-5 py-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Participantes ativos ({activeMemberIds.length})
              </p>
              <button
                type="button"
                disabled={updatingMembers}
                onClick={() => void leaveGroupConversation()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {updatingMembers ? "Aguarde..." : "Sair do grupo"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeMemberIds.map((memberId) => {
                const memberName = memberId === userId
                  ? userName
                  : directory.find((person) => person.id === memberId)?.full_name ?? "Funcionário";
                return (
                  <span key={memberId} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {memberName}
                    {(myMemberRole === "owner" || myMemberRole === "admin") && memberId !== userId ? (
                      <button
                        type="button"
                        disabled={updatingMembers}
                        onClick={() => void removeGroupMember(memberId)}
                        className="font-semibold text-red-700 hover:underline disabled:opacity-50"
                        aria-label={`Remover ${memberName} do grupo`}
                      >
                        Remover
                      </button>
                    ) : null}
                  </span>
                );
              })}
            </div>
            {(myMemberRole === "owner" || myMemberRole === "admin") ? (
              <form onSubmit={addGroupMember} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select
                  value={newGroupMemberId}
                  onChange={(event) => setNewGroupMemberId(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Adicionar funcionário ativo</option>
                  {directory.filter((person) => !activeMemberIds.includes(person.id)).map((person) => (
                    <option key={person.id} value={person.id}>{person.full_name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!newGroupMemberId || updatingMembers}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 disabled:opacity-50"
                >
                  {updatingMembers ? "Salvando..." : "Adicionar"}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-5">
          {selectedConversation && hasMoreMessages ? (
            <div className="flex justify-center">
              <button type="button" onClick={() => void loadOlderMessages()} disabled={loadingOlderMessages} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-600 disabled:opacity-50">
                {loadingOlderMessages ? "Carregando..." : "Carregar mensagens anteriores"}
              </button>
            </div>
          ) : null}
          {!selectedConversation ? (
            <div className="flex h-full min-h-64 items-center justify-center text-center text-sm text-slate-500">
              Selecione uma conversa ou inicie uma nova conversa individual.
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-64 items-center justify-center text-center text-sm text-slate-500">
              Nenhuma mensagem ainda. Envie a primeira mensagem.
            </div>
          ) : (
            messages.map((message) => {
              const ownMessage = message.sender_id === userId;
              const attachmentStatus = attachmentStatuses[message.id];
              return (
                <article key={message.id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[min(80%,42rem)] rounded-2xl px-4 py-3 shadow-sm ${ownMessage ? "bg-blue-700 text-white" : "border border-slate-200 bg-white text-slate-900"}`}>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                    {attachmentStatus ? (
                      <div className="mt-2 rounded-lg border border-white/20 bg-black/5 p-2 text-xs">
                        <p>{attachmentStatus.scan_status === "pending" ? "⏳ Em análise — arquivo em quarentena" : attachmentStatus.scan_status === "clean" ? "✓ Liberado após verificação" : "⛔ Bloqueado / quarentena"}</p>
                        {attachmentStatus.scan_status === "clean" && attachmentStatus.mime_type === "image/jpeg" && attachmentPreviewUrls[message.id] ? (
                          <img src={attachmentPreviewUrls[message.id]} alt={attachmentStatus.original_name} className="mt-2 max-h-56 max-w-full rounded-lg object-contain" />
                        ) : null}
                        {attachmentStatus.scan_status === "clean" && attachmentStatus.object_path ? (
                          <button type="button" onClick={() => void downloadCleanAttachment(attachmentStatus)} className="mt-2 font-semibold underline">Baixar arquivo verificado</button>
                        ) : null}
                      </div>
                    ) : null}
                    <div className={`mt-2 flex items-center justify-end gap-2 text-[10px] ${ownMessage ? "text-blue-100" : "text-slate-400"}`}>
                      <time>{new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>
                      {ownMessage ? (() => {
                        const readCount = receipts.filter((receipt) => receipt.message_id === message.id && receipt.profile_id !== userId && receipt.read_at).length;
                        const recipientCount = Math.max(activeMemberIds.length - 1, 1);
                        return <span>{readCount > 0 ? `✓✓ Lida por ${readCount}/${recipientCount}` : "✓ Enviada"}</span>;
                      })() : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {attachmentNotice ? <p role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">{attachmentNotice}</p> : null}
        <form onSubmit={sendMessage} className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white p-3 sm:gap-3 sm:p-4">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
            <input type="file" accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg" disabled={!selectedConversation || uploadingAttachment} onChange={(event) => void uploadAttachment(event)} className="sr-only" />
            {uploadingAttachment ? "Enviando anexo..." : "📎 Anexar"}
          </label>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={4000}
            disabled={!selectedConversation || sending}
            placeholder={selectedConversation ? "Digite uma mensagem..." : "Selecione uma conversa para enviar mensagens"}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!selectedConversation || !draft.trim() || sending}
            className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </section>
      </div>
    </section>
  );
}
