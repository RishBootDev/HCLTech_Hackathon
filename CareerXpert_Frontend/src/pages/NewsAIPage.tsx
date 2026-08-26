import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, newsAiChatApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Bot, Send, Loader2, MessageSquare, History, ShieldCheck,
  RefreshCw, Newspaper, Search, ChevronRight, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMsg {
  role: "user" | "bot";
  text: string;
  intent?: string;
  time: Date;
}

interface Session {
  id: number;
  startedAt: string;
  title?: string;
  messageCount?: number;
}

export default function NewsAIPage() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | undefined>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      if (!user?.email) return;
      try {
        const p = await profileApi.getByEmail(user.email) as { id: number };
        setProfileId(p.id);
        loadSessions(p.id);
      } catch {
        toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadSessions = async (pId: number) => {
    setSessionsLoading(true);
    try {
      const data = await newsAiChatApi.getSessions(pId, 15);
      setSessions(data as unknown as Session[]);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSessionHistory = async (session: Session) => {
    if (!profileId) return;
    setLoading(true);
    try {
      const history = await newsAiChatApi.getSessionHistory(profileId, session.id);
      const msgs: ChatMsg[] = (history as any[]).flatMap((m: any) => [
        { role: "user" as const, text: m.userMessage || m.content, time: new Date(m.createdAt || m.timestamp) },
        { role: "bot" as const, text: m.assistantMessage || m.response, intent: m.intent, time: new Date(m.createdAt || m.timestamp) },
      ]).filter(m => m.text);
      setMessages(msgs);
      setSessionId(session.id);
      setView("chat");
    } catch {
      toast({ title: "Error", description: "Could not load session history.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !profileId) return;
    const userMsg: ChatMsg = { role: "user", text: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const inputText = input;
    setInput("");
    setLoading(true);

    try {
      const res = await newsAiChatApi.chat(profileId, inputText, sessionId);
      if ((res as any).sessionId) setSessionId((res as any).sessionId);
      const botMsg: ChatMsg = {
        role: "bot",
        text: (res as any).message || "Analyzing...",
        intent: (res as any).intent,
        time: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      if (profileId) loadSessions(profileId);
    } catch {
      setMessages(prev => [...prev, {
        role: "bot",
        text: "Sorry, the NewsAI service is currently unavailable. Please try again.",
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setSessionId(undefined);
    setView("chat");
  };

  const INTENT_BADGES: Record<string, { label: string; color: string }> = {
    FACT_CHECK: { label: "Fact Check", color: "bg-red-100 text-red-700" },
    NEWS_SEARCH: { label: "News Search", color: "bg-blue-100 text-blue-700" },
    LINK_VERIFY: { label: "Link Verify", color: "bg-amber-100 text-amber-700" },
    GENERAL_CHAT: { label: "General", color: "bg-gray-100 text-gray-600" },
  };

  const STARTER_QUESTIONS = [
    "Is this news article about AI real or fake?",
    "Fact check: [paste any claim here]",
    "What's happening in the world of tech today?",
    "Verify this URL: https://example.com/article",
    "Summarize recent AI breakthroughs",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar: Sessions */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-zinc-50 flex items-center justify-between">
              <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Past Sessions
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg"
                onClick={() => profileId && loadSessions(profileId)}
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <button
                onClick={startNewSession}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <span className="font-bold text-sm text-primary">+ New Chat</span>
              </button>
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center p-6">No sessions yet. Start a conversation!</p>
              ) : sessions.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => loadSessionHistory(sess)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0 ${sessionId === sess.id ? "bg-primary/5" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Newspaper className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-foreground truncate">Session #{sess.id}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {sess.startedAt ? new Date(sess.startedAt).toLocaleDateString() : "Unknown date"}
                    </p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main: Chat Area */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col" style={{ minHeight: "70vh" }}>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-slate-50 to-blue-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-sm">NewsAI Fact-Checker</h3>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {sessionId ? `Session #${sessionId}` : "New session"} · Fact-checking & News Analysis
                </p>
              </div>
              {sessionId && (
                <div className="ml-auto px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black">
                  Active Session
                </div>
              )}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-black text-lg text-foreground mb-2">AI News Fact-Checker</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Paste any claim, article title, or URL and I'll analyze it for credibility, find related news, and flag misinformation.
                  </p>
                  <div className="space-y-2 w-full max-w-md">
                    {STARTER_QUESTIONS.map(q => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-blue-50/80 border border-blue-100 text-sm font-medium text-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-3"
                      >
                        <Search className="w-4 h-4 text-blue-500 shrink-0" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}
                    >
                      {msg.role === "bot" && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="max-w-[75%] space-y-1">
                        {msg.intent && INTENT_BADGES[msg.intent] && (
                          <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${INTENT_BADGES[msg.intent].color}`}>
                            {INTENT_BADGES[msg.intent].label}
                          </span>
                        )}
                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-muted text-foreground rounded-tl-none border border-border"
                        }`}>
                          {msg.text}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {msg.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {loading && (
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted border border-border rounded-2xl rounded-tl-none px-5 py-3">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-zinc-50/50">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={profileId ? "Paste a claim, article title, or URL to fact-check..." : "Login to use NewsAI"}
                  disabled={!profileId || loading}
                  rows={2}
                  className="flex-1 bg-white border border-border rounded-xl px-4 py-3 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors resize-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || !profileId}
                  className="rounded-xl w-12 p-0 bg-gradient-to-br from-blue-600 to-indigo-600 hover:opacity-90 shadow-md self-end"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                NewsAI detects misinformation, searches real-time news, and verifies sources
              </p>
            </div>
          </div>
        </div>
      </div>
    );
}
