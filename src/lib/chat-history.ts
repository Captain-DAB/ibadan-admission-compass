import type { AnswerMeta } from "@/services/chatbot";
import type { KnowledgeSourceLink } from "@/types/knowledge";

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  sources?: KnowledgeSourceLink[];
  meta?: AnswerMeta;
  isFallback?: boolean;
};

export type ConversationRecord = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredChatMessage[];
};

const LIST_KEY = "ui-admissions-conversations-v1";
const ACTIVE_KEY = "ui-admissions-active-conversation-v1";

function makeId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isMessage(value: unknown): value is StoredChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as StoredChatMessage;
  return (
    typeof message.id === "string" &&
    typeof message.text === "string" &&
    typeof message.createdAt === "string" &&
    (message.role === "assistant" || message.role === "user")
  );
}

function isConversation(value: unknown): value is ConversationRecord {
  if (!value || typeof value !== "object") return false;
  const conversation = value as ConversationRecord;
  return (
    typeof conversation.id === "string" &&
    typeof conversation.title === "string" &&
    typeof conversation.createdAt === "string" &&
    typeof conversation.updatedAt === "string" &&
    Array.isArray(conversation.messages) &&
    conversation.messages.every(isMessage)
  );
}

export function loadConversations(): ConversationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isConversation).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  } catch {
    return [];
  }
}

function saveConversations(conversations: ConversationRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIST_KEY, JSON.stringify(conversations));
}

export function getActiveConversationId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveConversationId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(ACTIVE_KEY, id);
  else window.localStorage.removeItem(ACTIVE_KEY);
}

export function createConversation(
  title = "New admission chat",
): ConversationRecord {
  const now = new Date().toISOString();
  const conversation: ConversationRecord = {
    id: makeId(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  const conversations = [conversation, ...loadConversations()];
  saveConversations(conversations);
  setActiveConversationId(conversation.id);
  return conversation;
}

export function getConversation(id: string): ConversationRecord | undefined {
  return loadConversations().find((conversation) => conversation.id === id);
}

export function upsertConversation(conversation: ConversationRecord): void {
  const others = loadConversations().filter((entry) => entry.id !== conversation.id);
  saveConversations([conversation, ...others]);
  setActiveConversationId(conversation.id);
}

export function updateConversationMessages(
  id: string,
  messages: StoredChatMessage[],
): ConversationRecord | undefined {
  const existing = getConversation(id);
  if (!existing) return undefined;

  const firstUser = messages.find((message) => message.role === "user");
  const updated: ConversationRecord = {
    ...existing,
    title: firstUser?.text.slice(0, 48) || existing.title || "New admission chat",
    updatedAt: new Date().toISOString(),
    messages,
  };
  upsertConversation(updated);
  return updated;
}

export function deleteConversation(id: string): void {
  const remaining = loadConversations().filter((conversation) => conversation.id !== id);
  saveConversations(remaining);
  if (getActiveConversationId() === id) {
    setActiveConversationId(remaining[0]?.id ?? null);
  }
}

export function clearAllConversations(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LIST_KEY);
  window.localStorage.removeItem(ACTIVE_KEY);
}

/** Ensure there is an active conversation to continue or start from. */
export function ensureActiveConversation(): ConversationRecord {
  const activeId = getActiveConversationId();
  if (activeId) {
    const existing = getConversation(activeId);
    if (existing) return existing;
  }
  const latest = loadConversations()[0];
  if (latest) {
    setActiveConversationId(latest.id);
    return latest;
  }
  return createConversation();
}
