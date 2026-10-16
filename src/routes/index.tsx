import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, ExternalLink, GraduationCap, MessageSquare, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  admissionRecords,
  buildAdmissionReply,
  findAdmissionAnswers,
  type AdmissionRecord,
} from "@/lib/admission-assistant";
import assistantMark from "@/assets/admission-companion-mark.png";
import campusPhoto from "@/assets/ui-campus.jpg";

const categories = [
  "All topics",
  "Requirements",
  "Programmes",
  "Application Process",
  "Screening",
  "UTME & Direct Entry",
  "Fees",
  "FAQs",
] as const;

const starterQuestions = [
  "What O’Level credits do I need?",
  "What is the minimum UTME score?",
  "When does screening close?",
];

const storageKey = "ui-admissions-desk-conversation-v1";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: AdmissionRecord["sources"];
};

function makeMessageId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `message-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "University of Ibadan Admission Assistant — Admissions Desk" },
      {
        name: "description",
        content:
          "Ask questions about University of Ibadan admissions, browse source-cited guidance, and check current application details with confidence.",
      },
      { property: "og:title", content: "University of Ibadan Admission Assistant" },
      {
        property: "og:description",
        content:
          "A source-led admissions desk for aspiring University of Ibadan students.",
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
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof categories)[number]>("All topics");
  const [search, setSearch] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const chatPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const storedConversation = window.localStorage.getItem(storageKey);

      if (storedConversation) {
        const parsed: unknown = JSON.parse(storedConversation);

        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item) =>
              item &&
              typeof item.id === "string" &&
              typeof item.text === "string" &&
              (item.role === "assistant" || item.role === "user"),
          )
        ) {
          setMessages(parsed as ChatMessage[]);
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;

    try {
      if (messages.length) {
        window.localStorage.setItem(storageKey, JSON.stringify(messages));
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // The admissions desk remains available if browser storage is disabled.
    }
  }, [historyReady, messages]);

  useEffect(() => {
    if (historyReady) textAreaRef.current?.focus({ preventScroll: true });
  }, [historyReady]);

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const category = selectedCategory === "All topics" ? undefined : selectedCategory;
    const available = admissionRecords.filter(
      (record) => !category || record.category === category,
    );

    if (!query) return available;

    const results = findAdmissionAnswers(search, category);
    const matchedIds = new Set(results.map(({ id }) => id));

    return [
      ...results,
      ...available.filter(
        (record) =>
          !matchedIds.has(record.id) &&
          [record.question, record.answer, ...record.keywords]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query),
      ),
    ];
  }, [search, selectedCategory]);

  function focusChat() {
    chatPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => textAreaRef.current?.focus(), 360);
  }

  async function askQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();

    if (!question || isSearching) return;

    const userMessage: ChatMessage = {
      id: makeMessageId(),
      role: "user",
      text: question,
    };

    setDraft("");
    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setIsSearching(true);

    await new Promise((resolve) => window.setTimeout(resolve, 520));

    const matches = findAdmissionAnswers(question);
    const answer: ChatMessage = {
      id: makeMessageId(),
      role: "assistant",
      text: buildAdmissionReply(matches),
      sources: matches.flatMap(({ sources }) => sources),
    };

    setMessages((currentMessages) => [...currentMessages, answer]);
    setIsSearching(false);
    window.setTimeout(() => textAreaRef.current?.focus(), 0);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="site-header">
        <div className="site-header-inner">
          <a aria-label="University of Ibadan Admission Assistant home" className="brand-lockup" href="#home">
            <img alt="" className="brand-mark" height={48} src={assistantMark} width={48} />
            <span className="brand-wordmark">
              <span className="brand-name">University of Ibadan</span>
              <span className="brand-service">Admission Assistant</span>
            </span>
          </a>

          <nav aria-label="Main navigation" className="top-navigation">
            <a className="top-navigation-link" href="#explore">
              Explore answers
            </a>
            <Button
              className="header-action"
              onClick={focusChat}
              size="sm"
              type="button"
            >
              Ask a question
              <ArrowRight aria-hidden="true" />
            </Button>
          </nav>
        </div>
      </header>

      <main id="home">
        <section aria-labelledby="hero-title" className="hero-section">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <span aria-hidden="true" className="eyebrow-rule" />
                A UNIVERSITY OF IBADAN GUIDE
              </div>

              <h1 className="hero-title" id="hero-title">
                A clearer path
                <br className="desktop-break" />
                to <em>Ibadan.</em>
              </h1>

              <p className="hero-description">
                Every application starts with a question. Find considered answers, official links and the next thing to check.
              </p>

              <div className="hero-actions">
                <Button className="hero-action" onClick={focusChat} size="lg" type="button">
                  <MessageSquare aria-hidden="true" />
                  Start conversation
                  <ArrowRight aria-hidden="true" />
                </Button>
                <a className="browse-link" href="#explore">
                  Browse guide topics
                  <ArrowDown aria-hidden="true" />
                </a>
              </div>

              <div className="hero-annotations">
                <span><BookOpen aria-hidden="true" /> Source-led guidance</span>
                <span><GraduationCap aria-hidden="true" /> Made for future students</span>
              </div>

              <figure className="campus-figure">
                <img
                  alt="Illustrative view of a sunlit university campus framed by tropical trees and academic buildings"
                  className="campus-image"
                  height={960}
                  src={campusPhoto}
                  width={1440}
                />
                <figcaption>
                  <span className="caption-mark" /> An illustrative campus setting
                  <span>01 / YOUR JOURNEY</span>
                </figcaption>
              </figure>
            </div>

            <aside
              aria-labelledby="chat-title"
              className="chat-panel"
              id="conversation"
              ref={chatPanelRef}
            >
              <div className="chat-panel-heading">
                <div className="chat-heading-copy">
                  <div className="chat-presence">
                    <span aria-hidden="true" className="status-dot" />
                    YOUR ADMISSIONS DESK
                  </div>
                  <h2 id="chat-title">What would you like to know?</h2>
                </div>
                <img alt="" className="chat-heading-mark" height={48} src={assistantMark} width={48} />
              </div>

              <div aria-live="polite" aria-relevant="additions" className="chat-transcript">
                <Conversation className="conversation-scroll">
                  <ConversationContent className="conversation-messages">
                    {messages.length === 0 ? (
                      <div className="welcome-message">
                        <div className="welcome-brand-row">
                          <span className="welcome-mark-wrap">
                            <img alt="" height={32} src={assistantMark} width={32} />
                          </span>
                          <span className="welcome-label">THE ADMISSIONS DESK</span>
                        </div>
                        <h3>Good questions open doors.</h3>
                        <p>
                          I can help you find answers about applying, eligibility, programmes and more. University sources are included so you can check the details for yourself.
                        </p>
                        <div className="starter-heading">A FEW PLACES TO BEGIN</div>
                        <div className="starter-list">
                          {starterQuestions.map((question) => (
                            <button
                              aria-label={`Ask: ${question}`}
                              className="starter-question"
                              key={question}
                              onClick={() => askQuestion(question)}
                              type="button"
                            >
                              <span>{question}</span>
                              <ArrowUpRight aria-hidden="true" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <Message
                          className="admission-message"
                          from={message.role}
                          key={message.id}
                        >
                          {message.role === "assistant" && (
                            <div className="answer-brand">
                              <img alt="" height={28} src={assistantMark} width={28} />
                              <span>THE ADMISSIONS DESK</span>
                            </div>
                          )}
                          <MessageContent className={message.role === "user" ? "message-user-content" : "message-answer-content"}>
                            <MessageResponse>{message.text}</MessageResponse>
                          </MessageContent>
                          {message.role === "assistant" && Boolean(message.sources?.length) && (
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
                        </Message>
                      ))
                    )}

                    {isSearching && (
                      <div className="searching-indicator">
                        <span className="welcome-mark-wrap">
                          <img alt="" height={25} src={assistantMark} width={25} />
                        </span>
                        <Shimmer>Checking the admissions guide…</Shimmer>
                      </div>
                    )}
                  </ConversationContent>
                </Conversation>
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
                  placeholder="Ask about applying, requirements…"
                  ref={textAreaRef}
                  value={draft}
                />
                <PromptInputFooter className="composer-footer">
                  <span className="composer-hint">A question is a good beginning.</span>
                  <PromptInputSubmit
                    aria-label="Send your admissions question"
                    className="send-button"
                    disabled={!draft.trim() || isSearching}
                    status={isSearching ? "submitted" : undefined}
                  />
                </PromptInputFooter>
              </PromptInput>
              <p className="privacy-note">
                <Check aria-hidden="true" /> Your conversation stays in this browser.
              </p>
            </aside>
          </div>
        </section>

        <section aria-labelledby="topics-title" className="explore-section" id="explore">
          <div className="explore-heading-row">
            <div className="explore-title-copy">
              <div className="eyebrow explore-eyebrow">A GOOD PLACE TO START</div>
              <h2 className="explore-title" id="topics-title">The questions that matter.</h2>
              <p className="explore-description">
                Look around the guide, or search for something specific.
              </p>
            </div>

            <label className="search-field">
              <Search aria-hidden="true" />
              <Input
                aria-label="Search admission information"
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search admission information"
                value={search}
              />
            </label>
          </div>

          <div aria-label="Filter information by category" className="category-filters" role="group">
            {categories.map((category) => (
              <Button
                aria-pressed={selectedCategory === category}
                className={`category-filter${selectedCategory === category ? " is-selected" : ""}`}
                key={category}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                type="button"
                variant="outline"
              >
                {category}
              </Button>
            ))}
          </div>

          {visibleRecords.length > 0 ? (
            <div className="information-grid">
              {visibleRecords.map((record, index) => (
                <article className="information-card" key={record.id}>
                  <div className="information-card-topline">
                    <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="topic-tag">{record.category}</span>
                  </div>
                  <h3>{record.question}</h3>
                  <p>{record.answer}</p>
                  <div className="card-bottom-row">
                    {record.verified ? (
                      <span className="source-label"><Check aria-hidden="true" /> Official sources linked</span>
                    ) : (
                      <span className="source-label source-needs-check">Check current information</span>
                    )}
                    <a
                      aria-label={`Ask about ${record.question}`}
                      className="card-question-link"
                      href="#conversation"
                      onClick={(event) => {
                        event.preventDefault();
                        askQuestion(record.question);
                        focusChat();
                      }}
                    >
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </div>
                  <div className="card-updated">
                    Last checked <time dateTime={record.updatedAt}>{record.updatedAt}</time>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-search">
              <Search aria-hidden="true" />
              <p>No matching questions. Try another search or ask the Admissions Desk.</p>
              <Button onClick={focusChat} size="sm" type="button" variant="outline">
                Ask a question <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          )}
        </section>

        <footer className="site-footer">
          <div className="footer-inner">
            <a className="footer-brand" href="#home">
              <img alt="" height={32} src={assistantMark} width={32} />
              <span>For your next chapter.</span>
            </a>
            <div className="footer-disclaimer">
              Always check cycle-specific details in current University notices.
            </div>
            <a
              className="official-link"
              href="https://admissions.ui.edu.ng/"
              rel="noreferrer"
              target="_blank"
            >
              Official admissions portal
              <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}