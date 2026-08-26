import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { streamFreeChat } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Loader2, MessageSquare, Sparkles, Bot, User } from "lucide-react";
import { motion } from "framer-motion";

const courses = [
  { key: "cls10-roadmap", title: "Class 10 Foundation", desc: "Strong fundamentals and stream selection guidance" },
  { key: "cls12-roadmap", title: "Class 12 Boards", desc: "Board exam preparation and career planning" },
  { key: "btech-roadmap", title: "B.Tech Roadmap", desc: "Engineering curriculum and placement preparation" },
  { key: "bba-roadmap", title: "BBA Roadmap", desc: "Business studies and management career path" },
  { key: "gvt-roadmap", title: "Government Exams", desc: "SSC, Banking, Railways preparation" },
  { key: "skills-roadmap", title: "Skill Development", desc: "Communication, Analytics, Design, Coding" },
];

interface Message { role: "user" | "bot"; text: string; }

export default function CourseChat() {
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim() || !selected) return;
    const text = input.trim();
    setMessages((p) => [...p, { role: "user", text }]);
    setInput("");
    setStreaming(true);
    setMessages((p) => [...p, { role: "bot", text: "" }]);

    try {
      await streamFreeChat(selected, text, (chunk) => {
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { ...u[u.length - 1], text: u[u.length - 1].text + chunk };
          return u;
        });
      });
    } catch {
      setMessages((p) => { const u = [...p]; u[u.length - 1] = { ...u[u.length - 1], text: "Error connecting to AI." }; return u; });
    } finally {
      setStreaming(false);
      setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 100);
    }
  };

  if (!selected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6">
              <MessageSquare className="w-4 h-4" /> Free AI Mentorship
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
              Select Your <span className="gradient-text">Learning Path</span>
            </h2>
            <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">
              Choose your course and get instant guidance — no login required!
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c, idx) => (
              <motion.button
                key={c.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelected(c.key)}
                className="glass-card rounded-2xl p-6 text-left border-2 border-blue-100/50 hover:border-primary/50 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                  <Send className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="font-black text-foreground mb-2 text-lg group-hover:text-primary transition-colors">{c.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{c.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const courseName = courses.find((c) => c.key === selected)?.title || selected;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-border flex items-center gap-4 shadow-sm">
        <button onClick={() => { setSelected(null); setMessages([]); }} className="hover:bg-primary/5 rounded-xl p-2 transition-colors">
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-foreground tracking-tight">{courseName}</h1>
            <p className="text-xs text-muted-foreground font-medium">Free AI Career Guidance</p>
          </div>
        </div>
        <span className="ml-auto text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-emerald-100">Free Access</span>
      </header>

      <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-muted/20">
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-3xl bg-white border-2 border-dashed border-primary/20 flex items-center justify-center shadow-lg">
              <Bot className="w-10 h-10 text-primary opacity-40" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground mb-2">Ask about {courseName}! 📚</p>
              <p className="text-sm text-muted-foreground font-medium max-w-md">Get roadmaps, study tips, career guidance and more.</p>
            </div>
          </motion.div>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: m.role === "user" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                m.role === "user" ? "brand-gradient" : "bg-white border border-border"
              }`}>
                {m.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium shadow-sm border ${
                m.role === "user" 
                  ? "bg-primary text-white border-transparent rounded-tr-none" 
                  : "bg-white text-foreground border-border rounded-tl-none"
              }`}>
                {m.text}
                {streaming && i === messages.length - 1 && m.role === "bot" && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-border bg-white/80 backdrop-blur-xl p-4 shadow-lg">
        <div className="flex items-end gap-3 bg-muted/40 p-2 rounded-[2rem] border border-border focus-within:border-primary/50 focus-within:bg-white transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask your question..."
            className="flex-1 resize-none bg-transparent rounded-xl px-4 py-3 text-sm outline-none border-none min-h-[44px] max-h-[120px] font-medium placeholder:text-muted-foreground/50"
            rows={1}
          />
          <button 
            onClick={send} 
            disabled={streaming || !input.trim()} 
            className="w-11 h-11 rounded-2xl brand-gradient text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
          >
            {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-center font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
