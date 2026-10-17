import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Check, ExternalLink, MessageSquareText, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
import {
  buildAdmissionReply,
  findAdmissionAnswers,
  type AdmissionRecord,
} from "@/lib/admission-assistant";
import assistantMark from "@/assets/admission-companion-mark.png";

const starterQuestions = [
  "What O’Level credits do I need?",
  "What is the minimum UTME score?",
  "How does the screening process work?",
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
      { title: "University of Ibadan Admission Assistant" },
      {
        name: "description",
        content:
          "Your intelligent guide to University of Ibadan admission information. Ask about requirements, programmes, applications and screening.",
      },
      { property: "og:title", content: "University of Ibadan Admission Assistant" },
      {
        property: "og:description",
        content:
          "Your intelligent guide to University of Ibadan admission information. Ask about requirements, programmes, applications and screening.",
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
      // The assistant remains available if browser storage is disabled.
    }
  }, [historyReady, messages]);

  function focusChat() {
    chatPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => textAreaRef.current?.focus(), 250);
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

    await new Promise((resolve) => window.setTimeout(resolve, 420));

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
    <div className="assistant-app min-h-screen bg-background text-foreground">
      <header className="assistant-header">
        <a aria-label="University of Ibadan Admission Assistant" className="brand-lockup" href="#home">
          <img alt="" className="brand-mark" height={42} src={assistantMark} width={42} />
          <span className="brand-wordmark">
            <span className="brand-name">University of Ibadan</span>
            <span className="brand-service">Admission Assistant</span>
          </span>
        </a>
        <div className="header-assurance"><ShieldCheck aria-hidden="true" /> Source-led guidance</div>
      </header>

      <main id="home">
        <section aria-labelledby="hero-title" className="assistant-landing">
          <div className="assistant-intro">
            <div className="assistant-kicker"><span /> ADMISSIONS, MADE CLEAR</div>
            <h1 id="hero-title">University of Ibadan<br /><em>Admission Assistant</em></h1>
            <p className="assistant-subtitle">Your intelligent guide to University of Ibadan admission information.</p>
            <p className="assistant-description">
              Ask about admission requirements, programmes, application procedures, screening and other admission-related information.
            </p>
          </div>

          <section aria-label="Admissions conversation" className="chat-panel" id="conversation" ref={chatPanelRef}>
            <div className="chat-panel-heading">
              <div className="chat-heading-mark-wrap"><img alt="" height={35} src={assistantMark} width={35} /></div>
              <div className="chat-heading-copy">
                <h2>Admissions assistant</h2>
                <span><span className="status-dot" /> Ready to help</span>
              </div>
              <div className="chat-context-label">UNIVERSITY OF IBADAN</div>
            </div>

            <div aria-live="polite" aria-relevant="additions" className="chat-transcript">
              <Conversation className="conversation-scroll">
                <ConversationContent className="conversation-messages">
                  {messages.length === 0 ? (
                    <div className="welcome-message">
                      <span className="welcome-label">WELCOME TO YOUR ADMISSIONS DESK</span>
                      <h3>Where would you like to begin?</h3>
                      <p>Ask a question in your own words, or choose a common topic to get started.</p>
                      <div className="starter-list">
                        {starterQuestions.map((question) => (
                          <Button
                            aria-label={`Ask: ${question}`}
                            className="starter-question"
                            key={question}
                            onClick={() => askQuestion(question)}
                            type="button"
                            variant="outline"
                          >
                            <span>{question}</span><ArrowUpRight aria-hidden="true" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <Message className="admission-message" from={message.role} key={message.id}>
                        {message.role === "assistant" && (
                          <div className="answer-brand"><img alt="" height={25} src={assistantMark} width={25} /><span>ADMISSIONS ASSISTANT</span></div>
                        )}
                        <MessageContent className={message.role === "user" ? "message-user-content" : "message-answer-content"}>
                          <MessageResponse>{message.text}</MessageResponse>
                        </MessageContent>
                        {message.role === "assistant" && Boolean(message.sources?.length) && (
                          <div className="answer-sources">
                            {message.sources?.slice(0, 3).map((source) => (
                              <a href={source.url} key={`${message.id}-${source.url}`} rel="noreferrer" target="_blank">
                                <ExternalLink aria-hidden="true" />{source.title}
                              </a>
                            ))}
                          </div>
                        )}
                      </Message>
                    ))
                  )}
                  {isSearching && <div className="searching-indicator"><span className="status-dot" /><Shimmer>Looking through the admissions guide…</Shimmer></div>}
                </ConversationContent>
              </Conversation>
            </div>

            <PromptInput aria-label="Ask an admissions question" className="composer" onSubmit={({ text }) => askQuestion(text)}>
              <PromptInputTextarea
                aria-label="Your admissions question"
                autoComplete="off"
                className="composer-textarea"
                maxLength={500}
                onChange={(event) => setDraft(event.currentTarget.value)}
                placeholder="Ask anything about admission…"
                ref={textAreaRef}
                value={draft}
              />
              <PromptInputFooter className="composer-footer">
                <span className="composer-hint"><Check aria-hidden="true" /> Check answers against official sources</span>
                <PromptInputSubmit aria-label="Send your admissions question" className="send-button" disabled={!draft.trim() || isSearching} status={isSearching ? "submitted" : undefined} />
              </PromptInputFooter>
            </PromptInput>
            <p className="privacy-note">Your conversation stays in this browser.</p>
          </section>

          <div className="assistant-footnote">
            <MessageSquareText aria-hidden="true" /> Ask about requirements, programmes, application steps or screening.
            <Button className="footnote-action" onClick={focusChat} size="sm" type="button" variant="ghost">Start a question <ArrowUpRight aria-hidden="true" /></Button>
          </div>
        </section>
      </main>
    </div>
  );
}