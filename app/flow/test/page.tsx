"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// HARD-CODED CONFIG
const TENANT_ID = 27;                // change as needed
const DEPARTMENT_ID = 3;             // set to null for tenant-wide
const API_ORIGIN = "https://89f920c37057.ngrok-free.app"; // must forward to FastAPI backend
const API_BASE = `${API_ORIGIN.replace(/\/+$/, "")}/api`;
const WS_BASE  = `${API_ORIGIN.replace(/^http/, "ws").replace(/\/+$/, "")}/api`;

// NGROK BYPASS
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

// --------------- helpers ---------------
async function fetchJSON(url: string, options: RequestInit & { headers?: Record<string, string> } = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), ...NGROK_HEADERS },
    });
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
    if (!ct.includes("application/json")) throw new Error(`Expected JSON, got "${ct}". Body: ${text.slice(0, 200)}`);
    return JSON.parse(text);
  } catch (e: unknown) {
    if (e && typeof e === "object" && (e as any).name === "AbortError") return null; // ignore aborted fetch
    throw e as Error;
  }
}
async function fetchInbox({ tenantId, departmentId, signal }: { tenantId: number; departmentId: number | null; signal?: AbortSignal }) {
  const params = new URLSearchParams({ tenant_id: String(tenantId) });
  if (departmentId != null) params.set("department_id", String(departmentId));
  return fetchJSON(`${API_BASE}/inbox?${params.toString()}`, { signal });
}
async function fetchConversation(conversationId: number, signal?: AbortSignal) {
  return fetchJSON(`${API_BASE}/conversations/${conversationId}`, { signal });
}
function formatTime(ts: any) {
  try { return ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; } catch { return ""; }
}
function reorder(list: any[]) { return [...list].sort((a, b) => new Date(b.timestamp as any as string).getTime() - new Date(a.timestamp as any as string).getTime()); }

// Robust WS with keepalive + reconnect
function openWS(
  url: string,
  { onMessage, onOpen, onClose }: { onMessage?: (evt: MessageEvent) => void; onOpen?: () => void; onClose?: () => void } = {}
) {
  let ws: WebSocket; let heartbeat: ReturnType<typeof setInterval> | undefined; let retryMs = 1000;
  const connect = () => {
    ws = new WebSocket(url);
    ws.onopen = () => {
      heartbeat = setInterval(() => { try { ws.send(JSON.stringify({ type: "ping" })); } catch {}
      }, 20000);
      retryMs = 1000;
      onOpen && onOpen();
    };
    ws.onmessage = (evt) => onMessage && onMessage(evt);
    ws.onclose = (e) => {
      if (heartbeat) clearInterval(heartbeat);
      onClose && onClose();
      setTimeout(connect, retryMs);
      retryMs = Math.min(retryMs * 2, 15000);
    };
    ws.onerror = () => { try { ws.close(); } catch {} };
  };
  connect();
  return () => { try { if (heartbeat) clearInterval(heartbeat); ws.close(); } catch {} };
}

// --------------- UI components ---------------
function ConversationBar({ item, isNew, isActive, onClick }: { item: any; isNew: boolean; isActive: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", gap: 8, padding: "10px 12px", borderBottom: "1px solid #eee",
        background: isActive ? "#e8f0ff" : isNew ? "#f0fbff" : "#fff",
        alignItems: "center", cursor: "pointer",
      }}
      title={`Conversation #${item.conversation_id}`}
    >
      <div style={{
        width: 38, height: 38, borderRadius: "50%", background: "#e6f0ff", color: "#2f6fed",
        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
      }}>
        {(item.user_name || item.patient_whatsapp_number || "?").toString().slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.user_name || item.patient_whatsapp_number}
          </div>
          <div style={{ color: "#888", fontSize: 12 }}>{formatTime(item.timestamp)}</div>
        </div>
        <div style={{ color: "#555", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
          {item.message}
        </div>
      </div>
      {!!item.unread_count && (
        <div style={{
          minWidth: 22, height: 22, borderRadius: 11, background: "#2f6fed", color: "#fff",
          fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px",
        }}>
          {item.unread_count}
        </div>
      )}
    </div>
  );
}
function MessageBubble({ m }: { m: { id?: any; content: string; sender_type?: string; timestamp?: any } }) {
  const isAgent = m.sender_type === "agent" || m.sender_type === "admin";
  const isBot = m.sender_type === "bot";
  const alignRight = isAgent || isBot;
  return (
    <div style={{ display: "flex", justifyContent: alignRight ? "flex-end" : "flex-start", margin: "6px 0" }}>
      <div style={{
        maxWidth: "72%", padding: "8px 10px", borderRadius: 10,
        background: alignRight ? "#e6f7ff" : "#f5f5f5",
        color: "#222", whiteSpace: "pre-wrap", wordBreak: "break-word",
        boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4, textAlign: alignRight ? "right" : "left" }}>
          {m.sender_type?.toUpperCase() || "UNKNOWN"} • {formatTime(m.timestamp)}
        </div>
        <div style={{ fontSize: 14 }}>{m.content}</div>
      </div>
    </div>
  );
}

// --------------- App ---------------
export default function App() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");
  const [flashNewIds, setFlashNewIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [convLoading, setConvLoading] = useState<boolean>(false);

  const [wsOpenCount, setWsOpenCount] = useState<number>(0); // inbox WS health
  const inboxWsUp = wsOpenCount > 0;

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const byId = useMemo(() => {
    const m = new Map<number, any>();
    for (const c of conversations) m.set(c.conversation_id, c);
    return m;
  }, [conversations]);

  const mergeConversations = (nextList: any[]) => setConversations(reorder(nextList || []));

  // initial inbox fetch
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoading(true);
        setErrorText("");
        const data = await fetchInbox({ tenantId: TENANT_ID, departmentId: DEPARTMENT_ID, signal: controller.signal });
        if (data) mergeConversations(data);
      } catch (e: any) {
        setErrorText(e?.message || "Failed to load inbox");
      } finally {
        setIsLoading(false);
      }
    })().catch((err: any) => setErrorText(err?.message || "Failed to load inbox"));
    return () => controller.abort();
  }, []);

  // load conversation
  async function loadConversation(convId: number) {
    setConvLoading(true);
    const res = await fetchConversation(convId);
    const formatted = ((res && (res as any).messages) || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      sender_type: m.sender_type,
      timestamp: m.created_at || m.timestamp || m.createdAt,
    }));
    setMessages(formatted);
    setConvLoading(false);
    setTimeout(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, 0);
  }

  // apply inbox update
  function applyInboxUpdate({ conversation_id, last_message, timestamp, unread_count }: { conversation_id: number; last_message: any; timestamp: any; unread_count: number }) {
    let applied = false;
    setConversations((prev) => {
      const list = [...(prev as any[])];
      const idx = list.findIndex((c: any) => c.conversation_id === conversation_id);
      if (idx === -1) return prev;
      const existing = list[idx];
      const existingTs = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
      const incomingTs = timestamp ? new Date(timestamp).getTime() : 0;
      if (incomingTs >= existingTs) {
        list[idx] = {
          ...existing,
          message: last_message ?? existing.message,
          timestamp: timestamp ?? existing.timestamp,
          unread_count: typeof unread_count === "number" ? unread_count : existing.unread_count,
        };
        applied = true;
      }
      return reorder(list);
    });
    if (applied) {
      setFlashNewIds((prev) => {
        const next = new Set(prev);
        next.add(Number(conversation_id));
        setTimeout(() => {
          setFlashNewIds((p2) => { const n2 = new Set(p2); n2.delete(Number(conversation_id)); return n2; });
        }, 1000);
        return next;
      });
    }
    return applied;
  }

  // chat WS per selected conversation
  useEffect(() => {
    if (!selectedId) return;
    const stop = openWS(`${WS_BASE}/chat/${selectedId}/ws`, {
      onMessage: (evt) => {
        const msg = JSON.parse(evt.data || "{}");
        if (msg.type === "message") {
          setMessages((prev) => {
            const updated = [...prev, {
              id: msg.message_id,
              content: msg.content,
              sender_type: msg.sender_type,
              timestamp: msg.timestamp,
            }];
            return updated;
          });
          setTimeout(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, 0);
        }
      }
    });
    loadConversation(selectedId);
    return stop;
  }, [selectedId]);

  // inbox WS (dept + tenant)
  const handleInboxWs = async (evt: MessageEvent) => {
    const msg = JSON.parse(evt.data || "{}");
    if (msg.type === "conversation_created") {
      const data = await fetchInbox({ tenantId: TENANT_ID, departmentId: DEPARTMENT_ID });
      if (data) mergeConversations(data);
      setFlashNewIds((prev) => {
        const next = new Set(prev);
        next.add(Number(msg.conversation_id));
        setTimeout(() => {
          setFlashNewIds((p2) => { const n2 = new Set(p2); n2.delete(Number(msg.conversation_id)); return n2; });
        }, 1500);
        return next;
      });
      return;
    }
    if (msg.type === "inbox_updated") {
      const ok = applyInboxUpdate({
        conversation_id: msg.conversation_id,
        last_message: msg.last_message,
        timestamp: msg.timestamp,
        unread_count: msg.unread_count,
      });
      if (!ok) {
        const data = await fetchInbox({ tenantId: TENANT_ID, departmentId: DEPARTMENT_ID });
        if (data) mergeConversations(data);
      }
      if (selectedId && msg.conversation_id === selectedId) {
        // ensure chat view gets updated if chat WS missed it
        setMessages((prev) => [...prev, {
          id: undefined,
          content: msg.last_message,
          sender_type: "patient", // safe default; bot/agent events also arrive via chat ws
          timestamp: msg.timestamp,
        }]);
        setTimeout(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, 0);
      }
    }
  };
  useEffect(() => {
    const onOpen = () => setWsOpenCount((n) => n + 1);
    const onClose = () => setWsOpenCount((n) => Math.max(0, n - 1));

    const deptParams = new URLSearchParams({
      tenant_id: String(TENANT_ID),
      ...(DEPARTMENT_ID != null ? { department_id: String(DEPARTMENT_ID) } : {}),
      "ngrok-skip-browser-warning": "true",
    });
    const tenantParams = new URLSearchParams({
      tenant_id: String(TENANT_ID),
      "ngrok-skip-browser-warning": "true",
    });

    const stopDept = DEPARTMENT_ID != null
      ? openWS(`${WS_BASE}/inbox/ws?${deptParams.toString()}`, { onMessage: handleInboxWs, onOpen, onClose })
      : null;
    const stopTenant = openWS(`${WS_BASE}/inbox/ws?${tenantParams.toString()}`, { onMessage: handleInboxWs, onOpen, onClose });

    return () => { stopDept && stopDept(); stopTenant && stopTenant(); };
  }, []);

  // polling fallback only when WS is down
  useEffect(() => {
    function start() {
      if (inboxWsUp) return;
      stop();
      pollRef.current = setInterval(async () => {
        const data = await fetchInbox({ tenantId: TENANT_ID, departmentId: DEPARTMENT_ID });
        if (data) mergeConversations(data);
      }, 5000);
    }
    function stop() { if (pollRef.current) { clearInterval(pollRef.current as any); pollRef.current = null; } }
    start();
    return stop;
  }, [inboxWsUp]);

  return (
    <div style={{ height: "100vh", display: "flex", fontFamily: "Inter, system-ui, Arial" }}>
      <div style={{ width: 360, borderRight: "1px solid #eee", display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid #eee", background: "#fff",
          position: "sticky", top: 0, zIndex: 1, display: "flex", justifyContent: "space-between"
        }}>
          <div style={{ fontWeight: 700 }}>Conversations</div>
          <div style={{ color: "#777", fontSize: 13 }}>
            Tenant {TENANT_ID}{DEPARTMENT_ID != null ? ` • Dept ${DEPARTMENT_ID}` : ""}
          </div>
        </div>

        {errorText && (
          <div style={{ padding: 12, color: "#b00020", background: "#fff4f4", borderBottom: "1px solid #f3d1d1" }}>
            {errorText}
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: 16 }}>Loading...</div>
        ) : (
          <div style={{ overflowY: "auto", flex: 1, background: "#fafafa" }}>
            {conversations.length === 0 ? (
              <div style={{ padding: 16, color: "#777" }}>No conversations yet</div>
            ) : (
              conversations.map((item) => (
                <ConversationBar
                  key={item.conversation_id}
                  item={item}
                  isNew={flashNewIds.has(item.conversation_id)}
                  isActive={selectedId === item.conversation_id}
                  onClick={() => setSelectedId(item.conversation_id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid #eee", background: "#fff",
          position: "sticky", top: 0, zIndex: 1, display: "flex", justifyContent: "space-between"
        }}>
          <div style={{ fontWeight: 700 }}>
            {selectedId ? `Conversation #${selectedId}` : "Select a conversation"}
          </div>
          <div style={{ color: "#777", fontSize: 13 }}>
            {inboxWsUp ? "Live" : "Reconnecting..."}
          </div>
        </div>
        <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", background: "#f9fafb", padding: 12 }}>
          {!selectedId ? (
            <div style={{ padding: 16, color: "#777" }}>Pick a conversation from the left</div>
          ) : convLoading ? (
            <div style={{ padding: 16 }}>Loading conversation…</div>
          ) : (
            messages.map((m, i) => <MessageBubble key={`${m.id || "m"}-${i}`} m={m} />)
          )}
        </div>
      </div>
    </div>
  );
}