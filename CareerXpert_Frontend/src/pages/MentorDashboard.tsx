import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mentorApi, humanChatApi, profileApi, courseApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  Users, Search, MessageSquare, Send, CheckCircle2, 
  Loader2, Phone, Video, MoreVertical, ShieldCheck, ArrowLeft,
  BookOpen, PlusCircle, Layers, Map, Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Message {
  id?: number;
  senderId: number;
  recipientId: number;
  content: string;
  sentAt: string;
}

export default function MentorDashboard() {
  const { user } = useAuth();
  const [mentor, setMentor] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"mentees" | "courses">("mentees");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [formData, setFormData] = useState({
    jobRole: "",
    specialization: "",
    description: "",
    experience: 0,
    available: true
  });

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stompClient, setStompClient] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const m = await mentorApi.getByEmail(user!.email);
        setMentor(m);
        setFormData({
          jobRole: (m.jobRole as string) || "",
          specialization: (m.specialization as string) || "",
          description: (m.description as string) || "",
          experience: (m.experience as number) || 0,
          available: (m.available as boolean) ?? true
        });
        const s = await mentorApi.getStudents(m.id as number);

        const [enrichedStudents, mentorCourses] = await Promise.all([
          Promise.all(s.map(async (student: any) => {
            try {
              if (!student.userId && student.email) {
                const fullProfile = await profileApi.getByEmail(student.email);
                return { ...student, userId: fullProfile.userId };
              }
            } catch (e) { console.warn("Could not enrich", student.email); }
            return student;
          })),
          courseApi.getByMentor(m.id as number).catch(() => [])
        ]);

        setStudents(enrichedStudents);
        setCourses(mentorCourses || []);

        if (user?.userId) {
          humanChatApi.getUnreadCount(Number(user.userId))
            .then((res) => {
              const total = (res as any)?.unreadCount || 0;
              if (enrichedStudents.length > 0 && total > 0) {
                setUnreadCounts({ [enrichedStudents[0].userId]: total });
              }
            })
            .catch(() => {});
        }

        connectWebSocket();
      } catch (err) {
        toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) initDashboard();
    return () => { if (stompClient) stompClient.deactivate(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const handler = (e: any) => {
      const { userId, online } = e.detail;
      setStudents(prev => prev.map(s => s.userId === userId ? { ...s, online } : s));
      setSelectedStudent((prev: any) => {
        if (prev?.userId === userId) return { ...prev, online };
        return prev;
      });
    };
    window.addEventListener('user-status-change', handler);
    return () => window.removeEventListener('user-status-change', handler);
  }, []);

  const connectWebSocket = () => {
    const client = new Client({
      brokerURL: "ws://localhost:2030/ws-chat",
      webSocketFactory: () => new SockJS("http://localhost:2030/ws-chat"),
      connectHeaders: {
        userId: user?.userId?.toString() || ""
      },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setConnected(true);
      setStompClient(client);
      client.subscribe(`/topic/chat.${user?.userId}`, (payload) => {
        const msg = JSON.parse(payload.body);
        setSelectedStudent((currentSelected: any) => {
          if (currentSelected && 
              (Number(msg.senderId) === Number(currentSelected.userId) || 
               Number(msg.senderId) === Number(user?.userId))) {
            setMessages((prev) => {
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
          } else {
            toast({ title: "New Message", description: "You received a new message from a student." });
          }
          return currentSelected;
        });
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP Error", frame.headers['message']);
      setConnected(false);
    };
    client.onDisconnect = () => setConnected(false);
    client.activate();
  };

  const loadChat = async (student: any) => {
    setSelectedStudent(student);
    setChatLoading(true);
    try {
      if (!student.userId) {
        toast({ title: "Configuration Error", description: "Student's user ID is missing.", variant: "destructive" });
        return;
      }
      const history = await humanChatApi.getHistory(user!.userId, student.userId);
      setMessages(history.map((m: any) => ({
        senderId: Number(m.sender?.id || m.senderId),
        recipientId: Number(m.recipient?.id || m.recipientId),
        content: m.content,
        sentAt: m.sentAt || new Date().toISOString()
      })));
    } catch (e) {
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !stompClient || !selectedStudent || !user || !connected) return;
    if (!selectedStudent.userId) {
      toast({ title: "Error", description: "Missing student User ID.", variant: "destructive" });
      return;
    }
    const timestamp = new Date().toISOString();
    const chatMsg = {
      senderId: Number(user.userId),
      recipientId: Number(selectedStudent.userId),
      content: input,
      timestamp,
    };
    try {
      stompClient.publish({ destination: "/app/chat.send", body: JSON.stringify(chatMsg) });
      setMessages(prev => [...prev, {
        senderId: Number(user.userId),
        recipientId: Number(selectedStudent.userId),
        content: input,
        sentAt: timestamp
      }]);
      setInput("");
    } catch (err) {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await mentorApi.update(mentor.id, formData);
      if (mentor.available !== formData.available) {
        await mentorApi.updateAvailability(mentor.id, formData.available);
      }
      setMentor({ ...mentor, ...formData });
      toast({ title: "Settings Saved", description: "Your mentor profile has been updated." });
      setIsSettingsOpen(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCourses = courses.filter(c =>
    (c.courseName as string)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] md:p-6 p-0 bg-slate-50 flex justify-center items-center">
      <div className="w-full max-w-[1500px] h-full flex md:rounded-3xl rounded-none overflow-hidden bg-white border border-slate-200 shadow-xl relative">
        
        {/* ===== LEFT SIDEBAR ===== */}
        <div className={`w-full md:w-[400px] flex-shrink-0 flex flex-col bg-slate-50 border-r border-slate-200 transition-transform ${selectedStudent ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Sidebar Header */}
          <div className="h-[88px] px-6 flex items-center justify-between border-b border-slate-200 bg-white z-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                <span className="font-bold text-xl">{mentor?.name?.[0] || "M"}</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 tracking-tight text-lg leading-tight">Dashboard</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                  <span className="text-xs text-slate-500 font-medium">
                    {connected ? 'System Online' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Mentor Settings</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-5 py-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Label htmlFor="available" className="font-semibold text-slate-700 cursor-pointer">Available for Mentees</Label>
                      <Switch id="available" checked={formData.available} onCheckedChange={(c) => setFormData({ ...formData, available: c })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="jobRole" className="text-slate-700">Job Role</Label>
                      <Input id="jobRole" value={formData.jobRole} onChange={(e) => setFormData({...formData, jobRole: e.target.value})} placeholder="E.g. Senior Software Engineer" className="h-11 rounded-lg" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="specialization" className="text-slate-700">Specialization</Label>
                      <Input id="specialization" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} placeholder="E.g. Backend Development" className="h-11 rounded-lg" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="experience" className="text-slate-700">Years of Experience</Label>
                      <Input id="experience" type="number" value={formData.experience} onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})} placeholder="5" className="h-11 rounded-lg" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description" className="text-slate-700">About Me (Bio)</Label>
                      <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Brief summary..." className="resize-none h-24 rounded-lg" />
                    </div>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full h-11 rounded-lg text-base font-medium">
                    {savingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="px-4 pt-4 pb-2 flex gap-2 bg-slate-50 shrink-0">
            <button
              onClick={() => setActiveTab("mentees")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'mentees'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              My Mentees ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'courses'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              My Courses ({courses.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-4 pt-2 bg-slate-50 border-b border-slate-200 shrink-0">
            <div className="bg-white rounded-xl flex items-center px-4 gap-3 border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all h-11">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                placeholder={activeTab === 'mentees' ? "Search your mentees..." : "Search your courses..."}
                className="bg-transparent flex-1 text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 space-y-2">
            {activeTab === 'mentees' ? (
              filteredStudents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60 py-16">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-500">
                    <Users className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-slate-700">No Mentees Found</p>
                  <p className="text-sm font-medium text-slate-500 mt-1 max-w-[200px]">When students request your mentorship, they will appear here.</p>
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudent?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => loadChat(s)}
                      className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-white border-primary shadow-sm ring-1 ring-primary/10"
                          : "bg-white border-transparent hover:border-slate-200 hover:shadow-sm"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                        isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {s.fullName?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`font-semibold text-[15px] truncate ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                            {s.fullName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            s.online ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                          }`}>
                            {s.online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <span className="text-[13px] font-medium truncate flex text-slate-500">
                          {s.educationLevel || "Student Mentee"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <div className="space-y-4">
                <Link to="/create-course">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-semibold shadow-sm gap-2">
                    <PlusCircle className="w-5 h-5" /> Create New Course
                  </Button>
                </Link>
                <Link to="/my-courses">
                  <Button variant="outline" className="w-full rounded-xl h-11 text-slate-700 font-semibold gap-2 border-slate-200 hover:bg-white hover:text-slate-900">
                    <Eye className="w-4 h-4" /> View All Courses
                  </Button>
                </Link>

                {filteredCourses.length === 0 ? (
                  <div className="py-12 text-center opacity-60">
                     <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-500 mx-auto">
                        <BookOpen className="w-8 h-8" />
                     </div>
                    <p className="font-bold text-slate-700">No Courses Yet</p>
                    <p className="text-sm font-medium text-slate-500 mt-1 max-w-[200px] mx-auto">Click above to craft your first learning path.</p>
                  </div>
                ) : (
                  filteredCourses.map((c: any) => (
                    <div key={c.id} className="p-4 rounded-xl bg-white border border-slate-200 hover:border-primary/40 hover:shadow-sm transition-all group cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-primary">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {c.category || "General"}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-[15px] mb-3 group-hover:text-primary transition-colors leading-tight">
                        {c.courseName}
                      </h3>
                      <div className="flex items-center gap-4 text-slate-500">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-500">
                          <Layers className="w-3.5 h-3.5" />
                          {c.modules?.length || 0} Modules
                        </div>
                        {c.tutorials && c.tutorials.length > 0 && (
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-500">
                            <Map className="w-3.5 h-3.5" />
                            {c.tutorials.length} Tutorials
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT SIDE: ACTIVE CHAT ===== */}
        <div className={`flex-1 bg-white flex flex-col relative ${!selectedStudent ? 'hidden md:flex' : 'flex'}`}>
          
          {!selectedStudent ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-10 bg-slate-50/50 absolute inset-0 z-10">
              <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm mb-6">
                <MessageSquare className="w-10 h-10 text-slate-300" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Mentor Workspace</h1>
              <p className="text-slate-500 font-medium text-[15px] max-w-sm leading-relaxed mb-6">
                Select a mentee from your list to begin communication. All sessions are encrypted.
              </p>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-2 border border-emerald-100">
                <ShieldCheck className="w-4 h-4" /> End-to-end Encrypted
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-[88px] bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-lg mr-1 hover:bg-slate-100 text-slate-600" onClick={() => setSelectedStudent(null)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg border border-slate-200">
                      {selectedStudent.fullName?.[0]?.toUpperCase() || "S"}
                    </div>
                    {selectedStudent.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 tracking-tight text-lg">{selectedStudent.fullName}</h3>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedStudent.online ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      {selectedStudent.online ? 'Mentee Active' : 'Mentee Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Search className="w-5 h-5"/></Button>
                  <Button variant="ghost" size="icon" className="rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Phone className="w-5 h-5"/></Button>
                  <Button variant="ghost" size="icon" className="rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Video className="w-5 h-5"/></Button>
                </div>
              </div>

              {/* Messages View */}
              <div className="flex-1 bg-slate-50/50 overflow-y-auto custom-scrollbar p-6 space-y-4" ref={scrollRef}>
                <div className="w-full text-center py-2 mb-2">
                  <span className="bg-slate-200/50 px-3 py-1 rounded-md text-xs font-semibold text-slate-500 inline-block shadow-sm">
                    Today
                  </span>
                </div>

                {chatLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-70">
                    <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-500 max-w-xs text-center">
                      Send the first message to {selectedStudent.fullName} to begin your mentorship guidance.
                    </p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isMe = Number(m.senderId) === Number(user?.userId) || Number(m.senderId) === Number(user?.id);
                    return (
                      <AnimatePresence key={i}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}
                        >
                          <div className={`relative max-w-[75%] px-4 py-2.5 text-[15px] leading-relaxed font-medium shadow-sm ${
                            isMe
                              ? "bg-primary text-white rounded-2xl rounded-tr-md"
                              : "bg-white text-slate-800 rounded-2xl rounded-tl-md border border-slate-200"
                          }`}>
                            <p className="break-words mb-1">{m.content}</p>
                            <div className={`flex items-center gap-1 select-none ${isMe ? 'justify-end text-primary-foreground/80' : 'justify-start text-slate-400'}`}>
                              <span className="text-[10px] font-semibold">
                                {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && <CheckCircle2 className="w-3.5 h-3.5 pb-[1px]" />}
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="bg-white px-6 py-4 flex items-center gap-3 shrink-0 z-10 sticky bottom-0 border-t border-slate-200">
                <div className="flex-1 bg-slate-50 rounded-xl flex items-center px-1 py-1 border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                    placeholder="Message your mentee..."
                    className="flex-1 bg-transparent px-4 py-2.5 outline-none font-medium text-[15px] placeholder:text-slate-400 text-slate-700"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    disabled={!input.trim() || !connected}
                    onClick={sendMessage}
                    className="rounded-lg shrink-0 w-10 h-10 bg-primary hover:bg-primary/90 text-white transition-all transform active:scale-95 shadow-sm ml-1 mr-1 flex items-center justify-center p-0"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
