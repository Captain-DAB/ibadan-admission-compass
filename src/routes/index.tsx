import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ExternalLink,
  GraduationCap,
  History,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  University,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { GlobalSearch } from "@/components/explore/GlobalSearch";
import { InformationExplorer } from "@/components/explore/InformationExplorer";
import { ProgrammeExplorer } from "@/components/explore/ProgrammeExplorer";
import {
  clearAllConversations,
  createConversation,
  deleteConversation,
  ensureActiveConversation,
  loadConversations,
  updateConversationMessages,
  type ConversationRecord,
  type StoredChatMessage,
} from "@/lib/chat-history";
import { recordUnansweredQuestion } from "@/lib/unanswered-questions";
import { answerQuestion } from "@/services/chatbot";
import assistantMark from "@/assets/admission-companion-mark.png";
import campusImage from "@/assets/ui-campus.jpg";

const SUGGESTED_QUESTIONS = [
  "What are the admission requirements?",
  "How do I apply for admission?",
  "What programmes are available?",
  "What are the requirements for Computer Science?",
  "What documents do I need?",
  "How does the screening process work?",
] as const;

const CATEGORY_SHORTCUTS = [
  { label: "Requirements", question: "What are the admission requirements?" },
  { label: "Apply", question: "How do I apply for admission?" },
  { label: "Programmes", question: "What programmes are available?" },
  { label: "Computer Science", question: "What are the requirements for Computer Science?" },
  { label: "Documents", question: "What documents do I need?" },
  { label: "Screening", question: "How does the screening process work?" },
] as const;

type ChatMessage = StoredChatMessage;

function makeMessageId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `message-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "University of Ibadan Admission Assistant" },
      {
        name: "description",
        content:
          "Browse and ask about University of Ibadan admission information — requirements, programmes, applications and screening.",
      },
      { property: "og:title", content: "University of Ibadan Admission Assistant" },
      {
        property: "og:description",
        content:
          "Browse and ask about University of Ibadan admission information — requirements, programmes, applications and screening.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdmissionAssistantPage,
});

function AdmissionAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [historyReady, setHistoryReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [askedSuggestions, setAskedSuggestions] = useState<string[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [focusProgrammeId, setFocusProgrammeId] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const chatPanelRef = useRef<HTMLElement>(null);

  const visibleSuggestions = useMemo(() => {
    const remaining = SUGGESTED_QUESTIONS.filter(
      (question) => !askedSuggestions.includes(question),
    );
    if (remaining.length > 0) return remaining.slice(0, 4);
    return [
      "What is the minimum UTME score?",
      "How much are University of Ibadan fees?",
      "How can I contact the Admission Unit?",
      "Where do I apply online?",
    ];
  }, [askedSuggestions]);

  useEffect(() => {
    const active = ensureActiveConversation();
    setConversations(loadConversations());
    setActiveConversationId(active.id);
    setMessages(active.messages);
    setAskedSuggestions(
      SUGGESTED_QUESTIONS.filter((question) =>
        active.messages.some(
          (message) => message.role === "user" && message.text === question,
        ),
      ),
    );
    setHistoryReady(true);
  }, []);

  useEffect(() => {
    if (!historyReady || !activeConversationId) return;
    updateConversationMessages(activeConversationId, messages);
    setConversations(loadConversations());
  }, [historyReady, activeConversationId, messages]);

  function focusChat() {
    chatPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => textAreaRef.current?.focus(), 250);
  }

  function markSuggestionUsed(question: string) {
    if (SUGGESTED_QUESTIONS.includes(question as (typeof SUGGESTED_QUESTIONS)[number])) {
      setAskedSuggestions((current) =>
        current.includes(question) ? current : [...current, question],
      );
    }
  }

  async function askQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question || isSearching) return;

    markSuggestionUsed(question);
    focusChat();

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: "user",
      text: question,
      createdAt: now,
    };
    setDraft("");
    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setIsSearching(true);

    await new Promise((resolve) => window.setTimeout(resolve, 520));

    const reply = await answerQuestion(question);
    if (reply.isFallback) recordUnansweredQuestion(question);

    const answer: ChatMessage = {
      id: makeMessageId(),
      role: "assistant",
      text: reply.text,
      createdAt: new Date().toISOString(),
      sources: reply.sources,
      isFallback: reply.isFallback,
      ...(reply.meta ? { meta: reply.meta } : {}),
    };
    setMessages((currentMessages) => [...currentMessages, answer]);
    setIsSearching(false);
    window.setTimeout(() => textAreaRef.current?.focus(), 0);
  }

  function startNewConversation() {
    const conversation = createConversation();
    setActiveConversationId(conversation.id);
    setMessages([]);
    setAskedSuggestions([]);
    setConversations(loadConversations());
    setHistoryOpen(false);
    focusChat();
  }

  function continueConversation(id: string) {
    const conversation = loadConversations().find((entry) => entry.id === id);
    if (!conversation) return;
    setActiveConversationId(id);
    setMessages(conversation.messages);
    setAskedSuggestions(
      SUGGESTED_QUESTIONS.filter((question) =>
        conversation.messages.some(
          (message) => message.role === "user" && message.text === question,
        ),
      ),
    );
    setHistoryOpen(false);
    focusChat();
  }

  function clearCurrentConversation() {
    setMessages([]);
    setAskedSuggestions([]);
    if (activeConversationId) {
      updateConversationMessages(activeConversationId, []);
      setConversations(loadConversations());
    }
    window.setTimeout(() => textAreaRef.current?.focus(), 0);
  }

  function removeConversation(id: string) {
    deleteConversation(id);
    const remaining = loadConversations();
    setConversations(remaining);
    if (id === activeConversationId) {
      if (remaining[0]) continueConversation(remaining[0].id);
      else startNewConversation();
    }
  }

  function wipeAllHistory() {
    clearAllConversations();
    const conversation = createConversation();
    setConversations([conversation]);
    setActiveConversationId(conversation.id);
    setMessages([]);
    setAskedSuggestions([]);
    setHistoryOpen(false);
  }

  function openProgramme(programmeId: string) {
    setFocusProgrammeId(programmeId);
    document.getElementById("programmes")?.scrollIntoView({ behavior: "smooth" });
  }

  const showInlineSuggestions =
    messages.length > 0 &&
    !isSearching &&
    (messages[messages.length - 1]?.isFallback || messages.length >= 2);

  return (
    <div className="assistant-app">
      <div aria-hidden="true" className="assistant-atmosphere">
        <img
          alt="Senate Building, University of Ibadan"
          className="atmosphere-image"
          src={campusImage}
        />
        <div className="atmosphere-veil" />
        <div className="atmosphere-grain" />
      </div>

      <header className="assistant-header">
        <a
          aria-label="University of Ibadan Admission Assistant"
          className="brand-lockup"
          href="#home"
        >
          <img alt="" className="brand-mark" height={44} src={assistantMark} width={44} />
          <span className="brand-wordmark">
            <span className="brand-name">University of Ibadan</span>
            <span className="brand-service">Admission Assistant</span>
          </span>
        </a>
        <nav aria-label="Primary" className="header-nav">
          <a href="#conversation">Chat</a>
          <a href="#browse">Browse</a>
          <a href="#programmes">Programmes</a>
          <a href="#search">Search</a>
        </nav>
        <div className="header-actions">
          <div className="header-assurance">
            <ShieldCheck aria-hidden="true" />
            Source-led guidance
          </div>
          <Button className="header-ask" onClick={focusChat} size="sm" type="button">
            Ask a question
            <ArrowUpRight aria-hidden="true" />
          </Button>
        </div>
      </header>

      <main id="home">
        <section aria-labelledby="hero-title" className="assistant-landing">
          <div className="assistant-stage">
            <div className="assistant-intro">
              <p className="assistant-kicker">
                <University aria-hidden="true" />
                Admission Unit · Prospective students
              </p>
              <h1 id="hero-title">
                University of Ibadan
                <em>Admission Assistant</em>
              </h1>
              <p className="assistant-subtitle">
                Chat, browse categories, explore programmes, or search the local admission
                knowledge base — all without a backend account.
              </p>

              <div className="intro-highlights">
                <div className="intro-highlight">
                  <GraduationCap aria-hidden="true" />
                  <span>UTME & Direct Entry pathways</span>
                </div>
                <div className="intro-highlight">
                  <BookOpen aria-hidden="true" />
                  <span>Programme & O&apos;Level guidance</span>
                </div>
                <div className="intro-highlight">
                  <MessageSquareText aria-hidden="true" />
                  <span>Ask in your own words</span>
                </div>
              </div>

              <div className="topic-row" role="list" aria-label="Category shortcuts">
                {CATEGORY_SHORTCUTS.map((topic) => (
                  <button
                    className="topic-chip"
                    disabled={isSearching}
                    key={topic.label}
                    onClick={() => askQuestion(topic.question)}
                    role="listitem"
                    type="button"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>

            <section
              aria-label="Admissions conversation"
              className="chat-panel"
              id="conversation"
              ref={chatPanelRef}
            >
              <div className="chat-panel-heading">
                <div className="chat-heading-mark-wrap">
                  <img
                    alt="Admission Assistant avatar"
                    height={36}
                    src={assistantMark}
                    width={36}
                  />
                </div>
                <div className="chat-heading-copy">
                  <h2>
                    <span className="chat-title-full">UI Admission Assistant</span>
                    <span className="chat-title-short">Admission Assistant</span>
                  </h2>
                  <span className={isSearching ? "status-searching" : "status-ready"}>
                    <span className="status-dot" />
                    {isSearching ? "Searching…" : "Online · Ready"}
                  </span>
                </div>
                <div className="chat-heading-meta">
                  <button
                    aria-expanded={historyOpen}
                    aria-label="Conversation history"
                    className="history-toggle"
                    onClick={() => setHistoryOpen((open) => !open)}
                    type="button"
                  >
                    <History aria-hidden="true" />
                    <span className="btn-label">History</span>
                  </button>
                  <button
                    aria-label="Start new conversation"
                    className="clear-chat"
                    onClick={startNewConversation}
                    type="button"
                  >
                    <Plus aria-hidden="true" />
                    <span className="btn-label">New</span>
                  </button>
                  <button
                    aria-label="Clear conversation"
                    className="clear-chat"
                    disabled={messages.length === 0}
                    onClick={clearCurrentConversation}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" />
                    <span className="btn-label">Clear</span>
                  </button>
                </div>
              </div>

              {historyOpen && (
                <div className="history-panel" aria-label="Saved conversations">
                  <div className="history-panel-header">
                    <strong>Saved chats</strong>
                    <button onClick={wipeAllHistory} type="button">
                      Delete all history
                    </button>
                  </div>
                  <ul className="history-list">
                    {conversations.map((conversation) => (
                      <li
                        className={
                          conversation.id === activeConversationId ? "is-active" : undefined
                        }
                        key={conversation.id}
                      >
                        <button
                          className="history-item"
                          onClick={() => continueConversation(conversation.id)}
                          type="button"
                        >
                          <span>{conversation.title || "Untitled chat"}</span>
                          <small>
                            {new Date(conversation.updatedAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </small>
                        </button>
                        <button
                          aria-label={`Delete ${conversation.title}`}
                          className="history-delete"
                          onClick={() => removeConversation(conversation.id)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                    {conversations.length === 0 && (
                      <li className="history-empty">No saved conversations yet.</li>
                    )}
                  </ul>
                </div>
              )}

              <div
                aria-live="polite"
                aria-relevant="additions"
                className="chat-transcript"
              >
                <Conversation className="conversation-scroll">
                  <ConversationContent className="conversation-messages">
                    {messages.length === 0 ? (
                      <div className="welcome-message">
                        <div className="welcome-avatar-row">
                          <img alt="" height={40} src={assistantMark} width={40} />
                          <div>
                            <span className="welcome-label">UI Admission Assistant</span>
                            <p className="welcome-status">
                              <span className="status-dot" /> Online · Ready to help
                            </p>
                          </div>
                        </div>
                        <h3>What do you need to know about admission?</h3>
                        <p>
                          Choose a suggested question, use a category shortcut, or type your
                          own enquiry.
                        </p>
                        <div className="suggestion-section">
                          <span className="suggestion-heading">Suggested questions</span>
                          <div className="starter-list">
                            {visibleSuggestions.map((question) => (
                              <Button
                                aria-label={`Ask: ${question}`}
                                className="starter-question suggestion-chip"
                                key={question}
                                onClick={() => askQuestion(question)}
                                type="button"
                                variant="outline"
                              >
                                <span>{question}</span>
                                <ArrowUpRight aria-hidden="true" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <Message
                            className={`admission-message message-enter ${
                              message.role === "user" ? "is-user" : "is-assistant"
                            }`}
                            from={message.role}
                            key={message.id}
                          >
                            {message.role === "assistant" && (
                              <div className="answer-brand">
                                <img alt="" height={25} src={assistantMark} width={25} />
                                <span>UI Admission Assistant</span>
                                <time className="message-time" dateTime={message.createdAt}>
                                  {formatTime(message.createdAt)}
                                </time>
                              </div>
                            )}
                            {message.role === "user" && (
                              <time
                                className="message-time user-time"
                                dateTime={message.createdAt}
                              >
                                {formatTime(message.createdAt)}
                              </time>
                            )}
                            <MessageContent
                              className={
                                message.role === "user"
                                  ? "message-user-content"
                                  : "message-answer-content"
                              }
                            >
                              <MessageResponse>{message.text}</MessageResponse>
                            </MessageContent>
                            {message.role === "assistant" &&
                              message.meta &&
                              !message.isFallback && (
                                <div className="answer-meta">
                                  <div>
                                    <span className="meta-label">Source</span>
                                    <span className="meta-value">{message.meta.source}</span>
                                  </div>
                                  <div>
                                    <span className="meta-label">Category</span>
                                    <span className="meta-value">{message.meta.category}</span>
                                  </div>
                                  <div>
                                    <span className="meta-label">Last updated</span>
                                    <span className="meta-value">
                                      {message.meta.lastUpdated}
                                    </span>
                                  </div>
                                </div>
                              )}
                            {message.role === "assistant" &&
                              Boolean(message.sources?.length) && (
                                <div className="answer-sources">
                                  {message.sources?.slice(0, 3).map((source) => (
                                    <a
                                      href={source.url}
                                      key={`${message.id}-${source.url}`}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      <ExternalLink aria-hidden="true" />
                                      {source.title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            {message.role === "assistant" &&
                              message.isFallback &&
                              showInlineSuggestions &&
                              message.id === messages[messages.length - 1]?.id && (
                                <div className="inline-suggestions">
                                  <span className="suggestion-heading">Try asking</span>
                                  <div className="inline-suggestion-chips">
                                    {visibleSuggestions.map((question) => (
                                      <button
                                        className="inline-chip"
                                        key={`fallback-${question}`}
                                        onClick={() => askQuestion(question)}
                                        type="button"
                                      >
                                        {question}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </Message>
                        ))}

                        {showInlineSuggestions &&
                          !messages[messages.length - 1]?.isFallback && (
                            <div className="inline-suggestions after-answer">
                              <span className="suggestion-heading">Related questions</span>
                              <div className="inline-suggestion-chips">
                                {visibleSuggestions.map((question) => (
                                  <button
                                    className="inline-chip"
                                    key={`related-${question}`}
                                    onClick={() => askQuestion(question)}
                                    type="button"
                                  >
                                    {question}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                      </>
                    )}

                    {isSearching && (
                      <div className="searching-indicator typing-indicator" role="status">
                        <img alt="" height={22} src={assistantMark} width={22} />
                        <div className="typing-copy">
                          <Shimmer>Searching admission information…</Shimmer>
                          <span className="typing-dots" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                          </span>
                        </div>
                      </div>
                    )}
                  </ConversationContent>
                </Conversation>
              </div>

              <div className="composer-shortcuts" aria-label="Quick categories">
                {CATEGORY_SHORTCUTS.slice(0, 4).map((topic) => (
                  <button
                    className="composer-chip"
                    disabled={isSearching}
                    key={`composer-${topic.label}`}
                    onClick={() => askQuestion(topic.question)}
                    type="button"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>

              <PromptInput
                aria-label="Ask an admissions question"
                className="composer"
                onSubmit={({ text }) => askQuestion(text)}
              >
                <PromptInputTextarea
                  aria-label="Your admissions question"
                  autoComplete="off"
                  className="composer-textarea"
                  maxLength={500}
                  onChange={(event) => setDraft(event.currentTarget.value)}
                  placeholder="Ask about admission requirements, programmes, screening…"
                  ref={textAreaRef}
                  value={draft}
                />
                <PromptInputFooter className="composer-footer">
                  <span className="composer-hint">
                    <Check aria-hidden="true" />
                    Verify answers on official UI channels
                  </span>
                  <PromptInputSubmit
                    aria-label="Send your admissions question"
                    className="send-button"
                    disabled={!draft.trim() || isSearching}
                    status={isSearching ? "submitted" : undefined}
                  />
                </PromptInputFooter>
              </PromptInput>
              <p className="privacy-note">
                Chats stay in this browser · No account required
              </p>
            </section>
          </div>
        </section>

        <div className="explore-shell" id="search">
          <GlobalSearch onAsk={askQuestion} onOpenProgramme={openProgramme} />
          <InformationExplorer onAsk={askQuestion} />
          <ProgrammeExplorer
            focusProgrammeId={focusProgrammeId}
            onAsk={askQuestion}
          />
        </div>

        <aside className="assistant-footnote site-footnote">
          <p>
            Knowledge is curated from official UI sources into local files — not live-scraped.
            Always confirm cycle-specific details on{" "}
            <a href="https://admissions.ui.edu.ng/" rel="noreferrer" target="_blank">
              admissions.ui.edu.ng
            </a>
            .
          </p>
          <Button
            className="footnote-action"
            onClick={focusChat}
            size="sm"
            type="button"
            variant="ghost"
          >
            Back to chat
            <ArrowUpRight aria-hidden="true" />
          </Button>
        </aside>
      </main>

      <nav aria-label="Mobile" className="mobile-tabbar">
        <a href="#conversation">
          <MessageSquareText aria-hidden="true" />
          Chat
        </a>
        <a href="#browse">
          <BookOpen aria-hidden="true" />
          Browse
        </a>
        <a href="#programmes">
          <GraduationCap aria-hidden="true" />
          Courses
        </a>
        <a href="#search">
          <Search aria-hidden="true" />
          Search
        </a>
      </nav>
    </div>
  );
}
