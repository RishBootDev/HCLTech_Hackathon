import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { humanChatApi, mentorApi, profileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  Send, 
  User, 
  ArrowLeft, 
  MessageSquare, 
  Loader2, 
  Mail, 
  Phone, 
  Award, 
  CheckCircle2,
  Clock,
  ShieldCheck
} from "lucide-react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id?: number;
  senderId: number;
  recipientId: number;
  content: string;
  sentAt: string;
}

export default function MentorChat() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const mentorId = queryParams.get("mentorId");
  const mentorEmail = queryParams.get("email");

  const [recipient, setRecipient] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stompClient, setStompClient] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRecipientData = async () => {
      try {
        let data: any = null;
        if (user?.role === 'ROLE_MENTOR') {
          // If logged in as mentor, the email refers to a student profile
          const profile = await profileApi.getByEmail(mentorEmail!);
          data = {
            ...profile,
            name: profile.fullName,
            userId: profile.userId,
            isStudent: true
          };
        } else {
          // If logged in as student, the email refers to a mentor
          const mentorData = await mentorApi.getByEmail(mentorEmail!);
          data = {
            ...mentorData,
            userId: mentorData.userId,
            isStudent: false
          };
        }
        
        setRecipient(data);
        
        if (data && user) {
          const history = await humanChatApi.getHistory(user.userId, data.userId);
          setMessages(history.map(m => {
            const sId = m.sender?.id || m.senderId;
            const rId = m.recipient?.id || m.recipientId;
            return {
              senderId: Number(sId),
              recipientId: Number(rId),
              content: m.content,
              sentAt: m.sentAt || new Date().toISOString()
            };
          }));
          
          // Mark all unread messages from this user as read
          if (user.userId && data.userId) {
            humanChatApi.markAsRead(Number(user.userId), Number(data.userId)).catch(() => {});
          }
          
          connect(data.userId);
        }
      } catch (err) {
        console.error("Chat init error:", err);
        toast({ title: "Error", description: "Failed to load chat context.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (user && mentorEmail) {
      fetchRecipientData();
    } else {
      setLoading(false);
    }

    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [mentorEmail, mentorId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (e: any) => {
      const { userId, online } = e.detail;
      if (recipient?.userId === userId) {
        setRecipient((prev: any) => prev ? { ...prev, online } : null);
      }
    };
    window.addEventListener('user-status-change', handler);
    return () => window.removeEventListener('user-status-change', handler);
  }, [recipient?.userId]);

  const connect = (recipientUserId: number) => {
    const client = new Client({
      brokerURL: "ws://localhost:2030/ws-chat",
      webSocketFactory: () => new SockJS("http://localhost:2030/ws-chat"),
      connectHeaders: {
        userId: user?.userId?.toString() || ""
      },
      debug: (str) => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      setConnected(true);
      setStompClient(client);

      client.subscribe(`/topic/chat.${user?.userId}`, (payload) => {
        const msg = JSON.parse(payload.body);
        setMessages((prev) => {
          // Check for duplicates (e.g. if we already have this message from optimistic update)
          const isDuplicate = prev.some(m => 
            m.content === msg.content && 
            Math.abs(new Date(m.sentAt).getTime() - new Date(msg.timestamp).getTime()) < 1000
          );
          if (isDuplicate && Number(msg.senderId) === Number(user?.userId)) return prev;
          
          return [...prev, {
            senderId: Number(msg.senderId),
            recipientId: Number(msg.recipientId),
            content: msg.content,
            sentAt: msg.timestamp || new Date().toISOString()
          }];
        });
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP error", frame.headers['message']);
      setConnected(false);
    };

    client.onDisconnect = () => setConnected(false);

    client.activate();
  };

  const sendMessage = () => {
    if (!input.trim() || !stompClient || !recipient || !user || !connected) return;

    const timestamp = new Date().toISOString();
    const chatMsg = {
      senderId: Number(user.userId),
      recipientId: Number(recipient.userId),
      content: input,
      timestamp: timestamp,
    };

    try {
      stompClient.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(chatMsg),
      });
      
      // Optimistic update for better UX
      setMessages((prev) => [...prev, {
          senderId: Number(user.userId),
          recipientId: Number(recipient.userId),
          content: input,
          sentAt: timestamp
      }]);
      
      setInput("");
    } catch (err) {
      console.error("Send error:", err);
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground font-medium text-glow">Establishing Neural Link...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-border rounded-3xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center text-white font-black text-xl shadow-md uppercase">
                {recipient?.name?.[0] || recipient?.fullName?.[0] || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-foreground">{recipient?.name || recipient?.fullName || 'User'}</h3>
                {!recipient?.isStudent && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                {recipient?.online ? (
                   <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-black text-green-600 border border-green-100">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                     ONLINE
                   </span>
                ) : (
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">OFFLINE</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {recipient?.isStudent ? (recipient.educationLevel || 'Student') : (recipient?.jobRole || 'Industry Expert')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
            {!recipient?.isStudent && (
                <div className="hidden md:flex flex-col items-end px-4 border-r border-border mr-2">
                    <span className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">Experience</span>
                    <span className="text-sm font-bold text-foreground">{recipient?.experience || 0} Years</span>
                </div>
            )}
            <Button size="icon" variant="outline" className="rounded-xl hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" className="rounded-xl hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
            </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Chat Area */}
        <div className="flex-1 bg-white border border-border rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/20">
             {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
                 <MessageSquare className="w-16 h-16 mb-4 text-primary" />
                 <p className="font-black text-lg text-foreground uppercase tracking-tighter">Secure Mentorship Channel</p>
                 <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">Messages are encrypted and saved to your neural career path.</p>
               </div>
             ) : (
               messages.map((m, i) => {
                 const isMe = Number(m.senderId) === Number(user?.userId) || Number(m.senderId) === Number(user?.id);
                 return (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                   >
                     <div className={`flex gap-3 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {!isMe && (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-border flex items-center justify-center font-bold text-slate-500 text-xs shadow-sm uppercase">
                                {recipient?.name?.[0] || recipient?.fullName?.[0]}
                            </div>
                        )}
                        <div className="flex flex-col gap-1">
                           <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                             isMe 
                               ? "bg-primary text-white rounded-tr-none shadow-[0_4px_12px_rgba(var(--primary),0.3)]" 
                               : "bg-white border border-border text-foreground rounded-tl-none"
                           }`}>
                             {m.content}
                           </div>
                           <span className={`text-[10px] font-black text-muted-foreground/50 uppercase flex items-center gap-1 ${isMe ? "justify-end" : ""}`}>
                             {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             {isMe && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                           </span>
                        </div>
                     </div>
                   </motion.div>
                 );
               })
             )}
          </div>

          <div className="p-4 border-t border-border bg-white">
            <div className="flex gap-2 items-center bg-slate-50 rounded-2xl p-2 border border-border focus-within:border-primary focus-within:bg-white transition-all shadow-inner">
               <input
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                 placeholder="Type your message here..."
                 className="flex-1 bg-transparent px-4 py-2 text-sm font-medium outline-none placeholder:text-muted-foreground/40"
               />
               <Button 
                 onClick={sendMessage} 
                 disabled={!input.trim() || !connected} 
                 className="brand-gradient w-12 h-12 rounded-xl text-white shadow-lg glow-primary active:scale-90 transition-all shrink-0 p-0"
               >
                 <Send className="w-5 h-5" />
               </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Average response time: 2h
                </span>
            </div>
          </div>
        </div>

        {/* Info Sidebar (Desktop Only) */}
        <div className="hidden lg:flex w-72 flex-col gap-4">
            <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Subscription Details</h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Status</span>
                        <span className="text-xs font-black text-green-500 uppercase">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Level</span>
                        <span className="text-xs font-black text-primary uppercase">Diamond</span>
                    </div>
                    <div className="pt-4 border-t border-border">
                         <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-orange-400" />
                            <span className="text-xs font-black text-foreground">Top Mentor Highlights</span>
                         </div>
                         <div className="flex flex-wrap gap-1.5">
                            {['ATS Review', 'Mock Interviews', 'Startup Advice'].map(skill => (
                                <span key={skill} className="px-2 py-1 rounded-lg bg-slate-100 text-[9px] font-black text-slate-600 uppercase">
                                    {skill}
                                </span>
                            ))}
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 space-y-3">
                <p className="text-xs font-black text-primary uppercase tracking-widest">Mentor's Note</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                    "I'm here to support your career growth. Feel free to send over your latest projects or resume for feedback anytime!"
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
