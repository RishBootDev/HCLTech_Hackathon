import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { streamAIChat, streamAIDescribe, chatApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Send, Image, Mic, Trash2, Loader2, Sparkles, User, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "bot";
  text: string;
  images?: string[];
  time: Date;
  isError?: boolean;
}

function renderMarkdown(md: string): string {
  if (!md) return "";
  md = md.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="bg-muted p-3 rounded-lg my-2 overflow-x-auto border border-border"><code>${code.replace(/[&<>"']/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))}</code></pre>`);
  md = md.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-primary">$1</code>');
  md = md.replace(/^### (.*)$/gm, '<h3 class="font-black text-lg mt-4 mb-2 text-primary">$1</h3>');
  md = md.replace(/^## (.*)$/gm, '<h2 class="font-black text-xl mt-6 mb-3 text-foreground">$1</h2>');
  md = md.replace(/^# (.*)$/gm, '<h1 class="font-black text-2xl mt-8 mb-4 text-foreground">$1</h1>');
  md = md.replace(/\*\*(.+?)\*\*/g, '<strong class="font-black text-foreground">$1</strong>');
  md = md.replace(/\*(.+?)\*/g, '<em class="italic opacity-80">$1</em>');
  md = md.replace(/\n/g, '<br>');
  return md;
}

export default function Chatbot() {
  const { user, isLoggedIn } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoggedIn && user) {
      chatApi.getHistory(user.id).then((history) => {
        const msgs = history.map((h) => ({
          role: (h.role as string).toLowerCase() === "user" ? "user" as const : "bot" as const,
          text: h.content as string || h.message as string || "",
          time: new Date(h.timestamp as string || Date.now()),
        }));
        setMessages(msgs);
      }).catch(() => {});
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text && selectedFiles.length === 0) return;

    const imageUrls = await Promise.all(selectedFiles.map((f) => {
      return new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(f);
      });
    }));

    const userMsg: Message = { role: "user", text, images: imageUrls, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const botMsg: Message = { role: "bot", text: "", time: new Date() };
    setMessages((prev) => [...prev, botMsg]);

    try {
      if (selectedFiles.length > 0) {
        await streamAIDescribe(text, selectedFiles, (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + chunk };
            return updated;
          });
        });
      } else {
        await streamAIChat(user!.id, text, (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + chunk };
            return updated;
          });
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.text.length > 0) {
          console.error("Stream interrupted:", err);
          return updated;
        }
        updated[updated.length - 1] = { ...lastMsg, text: "Error: " + (err as Error).message, isError: true };
        return updated;
      });
    } finally {
      setStreaming(false);
      setSelectedFiles([]);
    }
  };

  const handleVoice = () => {
    const Rec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Rec) return alert("Speech recognition not supported");
    const rec = new Rec();
    rec.lang = "en-US";
    rec.onresult = (e: any) => setInput(e.results[0][0].transcript);
    rec.start();
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Chat Sub-Header */}
      <div className="px-6 py-4 border-b border-border bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
              <Sparkles className="text-white w-6 h-6 fill-white" />
           </div>
           <div>
              <h2 className="text-xl font-black text-foreground">
                 {user?.role === "ROLE_MENTOR" ? "AI Mentor Assistant" : "AI Career Mentor"}
              </h2>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${streaming ? "bg-orange-500 animate-pulse" : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"}`} />
                 <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">{streaming ? "Thinking..." : "Online"}</span>
              </div>
           </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMessages([])} className="rounded-xl hover:bg-red-50 hover:text-red-500 group">
            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform text-muted-foreground group-hover:text-red-500" />
        </Button>
      </div>

      {/* Messages Area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-muted/20">
        <AnimatePresence>
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-primary/20 flex items-center justify-center">
                <Bot className="w-10 h-10 text-primary opacity-40" />
            </div>
            <div className="max-w-xs">
                <p className="text-lg font-black italic text-foreground">
                    {user?.role === "ROLE_MENTOR" 
                        ? "How can I support your mentoring today?" 
                        : "How can I assist your career journey today?"}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest mt-2 text-muted-foreground">
                    {user?.role === "ROLE_MENTOR" 
                        ? "I can help with resources, industry insights, and pedagogical advice." 
                        : "I can help with course selection, job roles, or technical skills."}
                </p>
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
            <div className={`flex gap-4 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                  m.role === "user" ? "brand-gradient" : "bg-white border border-border"
                }`}>
                    {m.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-primary" />}
                </div>
                <div className={`space-y-2 ${m.role === "user" ? "text-right" : "text-left"}`}>
                    <div className={`inline-block px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                      m.role === "user" 
                        ? "bg-primary text-white border-transparent rounded-tr-none shadow-primary/20" 
                        : m.isError 
                            ? "bg-red-50 border-red-200 text-red-700" 
                            : "bg-white border-border text-foreground rounded-tl-none backdrop-blur-sm shadow-black/5"
                    }`}>
                      {m.images?.map((img, j) => (
                        <img key={j} src={img} alt="upload" className="max-w-xs rounded-xl mb-3 border border-border" />
                      ))}
                      {m.role === "bot" ? (
                        <div className="prose prose-sm font-medium" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
                      ) : (
                        <span className="font-semibold">{m.text}</span>
                      )}
                      {streaming && i === messages.length - 1 && m.role === "bot" && (
                         <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[10px] uppercase font-black tracking-tighter text-muted-foreground opacity-60">
                        {m.role === "user" ? "YOU" : (user?.role === "ROLE_MENTOR" ? "AI ASSISTANT" : "CAREER MENTOR")} • {m.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-border">
        <div className="w-full space-y-4">
            {selectedFiles.length > 0 && (
              <div className="flex gap-3 mb-2 flex-wrap animate-in fade-in slide-in-from-bottom-2">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="w-20 h-20 rounded-2xl border-2 border-primary/20 overflow-hidden relative group">
                    <img src={URL.createObjectURL(f)} alt="preview" className="w-full h-full object-cover" />
                    <button 
                        onClick={() => setSelectedFiles((prev) => prev.filter((_, j) => j !== i))} 
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-end gap-3 bg-muted/40 p-2 rounded-[2rem] border-border group focus-within:border-primary/50 focus-within:bg-white transition-all shadow-md">
              <div className="flex flex-1 items-end min-h-[56px]">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder={user?.role === "ROLE_MENTOR" ? "Type your message to AI Assistant..." : "Type your message to AI Career Mentor..."}
                    className="w-full bg-transparent px-6 py-4 text-sm font-medium outline-none resize-none max-h-32 text-foreground placeholder:text-muted-foreground/50"
                    rows={1}
                  />
              </div>
              
              <div className="flex gap-2 pr-2 pb-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleVoice} 
                    className="rounded-2xl w-12 h-12 bg-white border border-border hover:bg-muted text-muted-foreground shadow-sm"
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <label className="w-12 h-12 rounded-2xl bg-white border border-border hover:bg-muted text-muted-foreground flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                  <Image className="w-5 h-5" />
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
                </label>
                <Button 
                    onClick={send} 
                    disabled={streaming || (!input.trim() && selectedFiles.length === 0)} 
                    className="w-12 h-12 rounded-2xl brand-gradient glow-primary flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 fill-white text-white" />}
                </Button>
              </div>
            </div>

            <p className="text-[10px] text-center font-black uppercase tracking-[0.2em] text-muted-foreground">
                Press Enter to send • SHIFT+ENTER for new line
            </p>
        </div>
      </div>
    </div>
  );
}
