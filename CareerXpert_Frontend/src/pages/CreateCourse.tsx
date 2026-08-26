import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { courseApi, smartLearnApi, mentorApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, FileText, Map, Tag, Loader2, Sparkles, 
  PlusCircle, Layout, Video, ChevronRight, Layers,
  Trash2, Upload, MessageSquare, CheckCircle2, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModuleData {
  id?: number;
  title: string;
  description: string;
  lessons: LessonData[];
}

interface LessonData {
  id?: number;
  title: string;
  content: string;
  file?: File;
}

interface TutorialData {
  id?: number;
  name: string;
  url: string;
  duration: number;
  description: string;
  credit: number;
  tutorName: string;
}

export default function CreateCourse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [resolvedMentorId, setResolvedMentorId] = useState<number | null>(null);

  // On mount, resolve the mentor profile ID from the user's email
  useEffect(() => {
    if (!user?.email) return;
    mentorApi.getByEmail(user.email)
      .then((m: any) => {
        if (m?.id) setResolvedMentorId(m.id);
      })
      .catch(() => {
        // If mentor lookup fails, fall back to user.id
        setResolvedMentorId(user.id);
      });
  }, [user]);

  // --- Step 1: Course Info ---
  const [courseInfo, setCourseInfo] = useState({
    courseName: "",
    description: "",
    careerRoadmap: "",
    category: "",
  });

  // --- Step 2: Modules & Lessons ---
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [addingModule, setAddingModule] = useState(false);
  
  // Lesson specific
  const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({ title: "", content: "", videoUrl: "", durationMinutes: 0 });
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [addingLesson, setAddingLesson] = useState(false);

  // --- Step 3: Tutorials ---
  const [tutorials, setTutorials] = useState<TutorialData[]>([]);
  const [newTutorial, setNewTutorial] = useState<TutorialData>({
    name: "", url: "", duration: 0, description: "", credit: 10, tutorName: user?.fullName || ""
  });
  const [addingTutorial, setAddingTutorial] = useState(false);

  // --- HANDLERS ---

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedMentorId) {
      toast({ title: "Not Ready", description: "Mentor profile is still loading. Please wait a moment.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await courseApi.create(courseInfo, resolvedMentorId);
      const id = (res as any).id;
      if (!id) throw new Error("Course was created but no ID was returned.");
      setCourseId(id);
      setStep(2);
      toast({ title: "Course Created! 🎉", description: "Now build your curriculum — add modules and lessons." });
    } catch (err: any) {
      toast({ title: "Course Creation Failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async () => {
    if (!courseId || !newModule.title.trim()) {
      toast({ title: "Missing Info", description: "Please enter a module title.", variant: "destructive" });
      return;
    }
    setAddingModule(true);
    try {
      const res = await smartLearnApi.addModule(courseId, newModule.title, newModule.description);
      const moduleWithLessons = { ...(res as any), lessons: [] };
      setModules(prev => [...prev, moduleWithLessons]);
      setNewModule({ title: "", description: "" });
      toast({ title: "Module Added ✅" });
    } catch (err: any) {
      toast({ title: "Failed to Add Module", description: err.message, variant: "destructive" });
    } finally {
      setAddingModule(false);
    }
  };

  const handleAddLesson = async (moduleId: number, moduleIndex: number) => {
    if (!newLesson.title.trim()) {
      toast({ title: "Missing Title", description: "Please enter a lesson title.", variant: "destructive" });
      return;
    }
    if (!moduleId) {
      toast({ title: "Error", description: "Module ID is missing. Please re-add module.", variant: "destructive" });
      return;
    }
    setAddingLesson(true);
    try {
      const res = await smartLearnApi.addLesson(
        moduleId,
        newLesson.title,
        newLesson.content || undefined,
        newLesson.videoUrl || undefined,
        newLesson.durationMinutes || undefined,
        lessonFile || undefined
      );
      const updatedModules = [...modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        lessons: [...updatedModules[moduleIndex].lessons, res as any]
      };
      setModules(updatedModules);
      setNewLesson({ title: "", content: "", videoUrl: "", durationMinutes: 0 });
      setLessonFile(null);
      setActiveModuleIndex(null);
      toast({ title: "Lesson Published 🚀" });
    } catch (err: any) {
      toast({ title: "Failed to Publish Lesson", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setAddingLesson(false);
    }
  };

  const handleAddTutorial = async () => {
    if (!courseId || !newTutorial.name.trim()) {
      toast({ title: "Missing Info", description: "Please enter a tutorial name.", variant: "destructive" });
      return;
    }
    setAddingTutorial(true);
    try {
      const res = await smartLearnApi.addTutorial(courseId, newTutorial as any);
      setTutorials(prev => [...prev, res as any]);
      setNewTutorial({ ...newTutorial, name: "", url: "", description: "", duration: 0 });
      toast({ title: "Tutorial Added ✅" });
    } catch (err: any) {
      toast({ title: "Failed to Add Tutorial", description: err.message, variant: "destructive" });
    } finally {
      setAddingTutorial(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-24">
      
      {/* Visual Progress Header */}
      <div className="flex justify-between items-center mb-12 relative px-4">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-100 -z-10 -translate-y-1/2 rounded-full" />
        <div className={`absolute top-1/2 left-0 h-1 bg-primary transition-all duration-500 -z-10 -translate-y-1/2 rounded-full`} style={{ width: `${(step - 1) * 50}%` }} />
        
        {[
          { icon: BookOpen, label: "Overview" },
          { icon: Layers, label: "Curriculum" },
          { icon: Video, label: "Tutorials" }
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "brand-gradient text-white scale-110" : "bg-white text-zinc-400 border border-border"}`}>
              {step > i + 1 ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-6 h-6" />}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${step === i + 1 ? "text-primary" : "text-zinc-400"}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: COURSE INFO */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white border border-border rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-zinc-200/50">
              <header className="mb-10 text-center lg:text-left">
                 <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic">Architect <span className="text-primary not-italic">Course</span></h2>
                 <p className="text-muted-foreground font-medium mt-2">Initialize your mentorship foundation</p>
              </header>

              {/* Mentor ID indicator */}
              {resolvedMentorId ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-black uppercase tracking-widest mb-8">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mentor Profile Loaded (ID: {resolvedMentorId})
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-widest mb-8">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading Mentor Profile...
                </div>
              )}

              <form onSubmit={handleCreateCourse} className="space-y-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 group">
                      <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-3 group-focus-within:text-primary transition-colors">Course Name</Label>
                      <div className="relative">
                        <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary" />
                        <Input value={courseInfo.courseName} onChange={e => setCourseInfo({...courseInfo, courseName: e.target.value})} required className="h-16 pl-14 rounded-2xl bg-zinc-50 border-zinc-200 focus:ring-primary/20 font-bold" placeholder="Mastering System Design" />
                      </div>
                    </div>
                    <div className="space-y-2 group">
                      <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-3 group-focus-within:text-primary transition-colors">Category</Label>
                      <div className="relative">
                        <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary" />
                        <select value={courseInfo.category} onChange={e => setCourseInfo({...courseInfo, category: e.target.value})} required className="w-full h-16 pl-14 rounded-2xl bg-zinc-50 border-zinc-200 focus:ring-primary/20 appearance-none font-bold border">
                          <option value="">Select Category</option>
                          <option value="TECHNOLOGY">Technology</option>
                          <option value="CAREER">Career</option>
                          <option value="BUSINESS">Business</option>
                          <option value="DESIGN">Design</option>
                          <option value="FINANCE">Finance</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-3 group-focus-within:text-primary transition-colors">Career Roadmap Context</Label>
                    <div className="relative">
                      <Map className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary" />
                      <Input value={courseInfo.careerRoadmap} onChange={e => setCourseInfo({...courseInfo, careerRoadmap: e.target.value})} className="h-16 pl-14 rounded-2xl bg-zinc-50 border-zinc-200 font-bold" placeholder="Junior SDE to Lead" />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-3 group-focus-within:text-primary transition-colors">Full Description</Label>
                    <textarea value={courseInfo.description} onChange={e => setCourseInfo({...courseInfo, description: e.target.value})} required className="w-full min-h-[160px] rounded-[2rem] bg-zinc-50 border-zinc-200 p-6 font-medium focus:ring-primary/20 outline-none border resize-none" placeholder="What will mentees learn?" />
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <Button type="submit" disabled={loading || !resolvedMentorId} className="h-16 px-12 rounded-2xl brand-gradient font-black text-lg shadow-xl shadow-primary/20 btn-shine gap-3">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "PROCEED TO CURRICULUM"}
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* STEP 2: CURRICULUM (Modules & Lessons) */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Curriculum <span className="text-primary italic">Architect</span></h2>
                <p className="text-muted-foreground text-sm font-medium">Define modules and populate them with deep-dive lessons</p>
              </div>
              <Button onClick={() => setStep(3)} variant="ghost" className="gap-2 font-black text-primary uppercase text-xs tracking-widest hover:bg-primary/5">
                Skip to Tutorials <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left: Module List */}
              <div className="lg:col-span-2 space-y-6">
                {modules.length === 0 ? (
                  <div className="h-64 border-4 border-dashed border-zinc-100 rounded-[2.5rem] flex flex-col items-center justify-center text-zinc-300">
                    <Layers className="w-16 h-16 mb-4 opacity-50" />
                    <p className="font-bold uppercase tracking-widest text-xs">No Modules Created Yet</p>
                    <p className="text-xs mt-2 text-center px-8">Use the panel on the right to add your first module</p>
                  </div>
                ) : (
                  modules.map((mod, idx) => (
                    <div key={mod.id || idx} className="bg-white border border-border rounded-[2rem] overflow-hidden shadow-sm">
                      <div className="p-6 bg-zinc-50 flex items-center justify-between border-b border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">#{idx + 1}</div>
                          <div>
                            <h3 className="font-black text-foreground uppercase text-sm tracking-tight">{mod.title}</h3>
                            <p className="text-xs text-muted-foreground font-medium">{mod.lessons.length} {mod.lessons.length === 1 ? "Lesson" : "Lessons"}</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setActiveModuleIndex(idx === activeModuleIndex ? null : idx)} variant={activeModuleIndex === idx ? "default" : "outline"} className={`rounded-xl gap-2 font-black text-[10px] uppercase ${activeModuleIndex === idx ? "brand-gradient text-white border-none" : ""}`}>
                          {activeModuleIndex === idx ? "CANCEL" : "ADD LESSON"}
                        </Button>
                      </div>
                      
                      {/* Nested Lessons */}
                      <div className="p-6 space-y-3">
                        {mod.lessons.map((lesson, lIdx) => (
                          <div key={lesson.id || lIdx} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100 group transition-all hover:bg-white hover:border-primary/20">
                            <FileText className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-bold text-foreground/80 flex-1">{lesson.title}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Published
                            </span>
                          </div>
                        ))}

                        {activeModuleIndex === idx && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 border-2 border-primary/20 rounded-2xl bg-primary/5 space-y-4">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Lesson Title *</Label>
                              <Input value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="bg-white border-primary/20 font-bold" placeholder="Introduction to LLMs" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Video URL (Optional)</Label>
                                <Input value={newLesson.videoUrl} onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})} className="bg-white border-primary/20 font-bold" placeholder="https://youtube.com/..." />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Duration (Min)</Label>
                                <Input type="number" min={0} value={newLesson.durationMinutes} onChange={e => setNewLesson({...newLesson, durationMinutes: parseInt(e.target.value) || 0})} className="bg-white border-primary/20 font-bold" />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Content / Notes (Optional)</Label>
                              <textarea value={newLesson.content} onChange={e => setNewLesson({...newLesson, content: e.target.value})} className="w-full min-h-[120px] rounded-xl bg-white border border-primary/20 p-4 font-medium outline-none text-sm" placeholder="Explain the concept in markdown..." />
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <label className="flex items-center gap-3 px-4 py-2 bg-white border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                                  <Upload className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-black text-primary uppercase tracking-widest overflow-hidden whitespace-nowrap text-ellipsis">
                                    {lessonFile ? lessonFile.name : "Attach PDF/Resource (Optional)"}
                                  </span>
                                  <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={e => setLessonFile(e.target.files?.[0] || null)} />
                                </label>
                              </div>
                              <Button 
                                disabled={addingLesson || !newLesson.title.trim()} 
                                onClick={() => mod.id ? handleAddLesson(mod.id, idx) : toast({ title: "Error", description: "Module ID is missing.", variant: "destructive" })} 
                                size="sm" 
                                className="brand-gradient text-white rounded-xl px-6 font-black uppercase text-[10px] tracking-widest h-10 shadow-lg shadow-primary/20"
                              >
                                {addingLesson && activeModuleIndex === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : "PUBLISH LESSON"}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right: New Module Form */}
              <div className="lg:col-span-1 border-border sticky top-24">
                <div className="bg-white border border-border rounded-[2.5rem] p-8 shadow-lg shadow-zinc-100">
                   <header className="mb-6 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
                         <Layers className="w-8 h-8 text-zinc-300" />
                      </div>
                      <h3 className="font-black text-foreground uppercase text-base italic">New <span className="text-primary not-italic">Module</span></h3>
                   </header>
                   <div className="space-y-6">
                      <div className="space-y-2 group">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 group-focus-within:text-primary transition-colors">Module Title *</Label>
                        <Input value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} className="h-14 rounded-2xl bg-zinc-50 border-zinc-200 font-bold" placeholder="Foundation Phase" />
                      </div>
                      <div className="space-y-2 group">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 group-focus-within:text-primary transition-colors">Goal / Description</Label>
                        <textarea value={newModule.description} onChange={e => setNewModule({...newModule, description: e.target.value})} className="w-full min-h-[100px] border border-zinc-200 rounded-2xl bg-zinc-50 p-4 font-medium outline-none resize-none text-sm" placeholder="What is the objective of this module?" />
                      </div>
                      <Button onClick={handleAddModule} disabled={addingModule || !newModule.title.trim()} className="w-full h-14 rounded-2xl bg-zinc-900 border-none text-white font-black uppercase text-xs tracking-widest hover:bg-zinc-800 shadow-xl shadow-zinc-200 transition-all">
                        {addingModule ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlusCircle className="w-4 h-4 mr-2" /> ADD MODULE</>}
                      </Button>
                      <Button onClick={() => setStep(3)} className="w-full h-14 rounded-2xl brand-gradient font-black text-white text-xs tracking-widest shadow-xl shadow-primary/20 transition-all">
                        NEXT STEP: TUTORIALS
                      </Button>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: TUTORIALS */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-foreground uppercase tracking-tight italic">Tutorial <span className="text-primary not-italic">Library</span></h2>
                <p className="text-muted-foreground font-medium mt-2">Embed curated external videos or your own masterclasses</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left: Fields */}
              <div className="bg-white border border-border rounded-[2.5rem] p-10 shadow-lg shadow-zinc-100">
                <div className="space-y-6">
                  <div className="space-y-1.5 group">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-3 group-focus-within:text-primary transition-colors">Video Title *</Label>
                    <div className="relative">
                      <Video className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input value={newTutorial.name} onChange={e => setNewTutorial({...newTutorial, name: e.target.value})} className="h-14 pl-14 rounded-2xl bg-zinc-50 font-bold" placeholder="Masterclass: Distributed Systems" />
                    </div>
                  </div>
                  <div className="space-y-1.5 group">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-3">Youtube/External URL</Label>
                    <Input value={newTutorial.url} onChange={e => setNewTutorial({...newTutorial, url: e.target.value})} className="h-14 rounded-2xl bg-zinc-50 font-bold px-6" placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5 group">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-3">Duration (Min)</Label>
                      <Input type="number" min={0} value={newTutorial.duration} onChange={e => setNewTutorial({...newTutorial, duration: parseInt(e.target.value) || 0})} className="h-14 rounded-2xl bg-zinc-50 font-bold px-6" />
                    </div>
                    <div className="space-y-1.5 group">
                      <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-3">Mentee Credits</Label>
                      <Input type="number" min={0} value={newTutorial.credit} onChange={e => setNewTutorial({...newTutorial, credit: parseInt(e.target.value) || 0})} className="h-14 rounded-2xl bg-zinc-50 font-bold px-6" />
                    </div>
                  </div>
                  <div className="space-y-1.5 group">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-3">Video Concept Overview</Label>
                    <textarea value={newTutorial.description} onChange={e => setNewTutorial({...newTutorial, description: e.target.value})} className="w-full min-h-[100px] rounded-2xl bg-zinc-50 border p-5 font-medium outline-none resize-none border-zinc-200" placeholder="Briefly explain what this video covers..." />
                  </div>
                  <Button onClick={handleAddTutorial} disabled={addingTutorial || !newTutorial.name.trim()} className="w-full h-16 rounded-2xl brand-gradient text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 btn-shine transition-all gap-2">
                    {addingTutorial ? <Loader2 className="w-6 h-6 animate-spin" /> : <><PlusCircle className="w-5 h-5" /> REGISTER TUTORIAL</>}
                  </Button>
                </div>
              </div>

              {/* Right: Live List */}
              <div className="space-y-6">
                <header className="px-4">
                   <h3 className="font-black text-foreground uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" /> Tutorial Feed ({tutorials.length})
                   </h3>
                </header>
                {tutorials.length === 0 ? (
                  <div className="h-full border-4 border-dashed border-zinc-100 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-zinc-300">
                     <Video className="w-16 h-16 mb-4 opacity-30" />
                     <p className="font-bold text-center leading-relaxed">No tutorials added.<br/>Boost course engagement with videos.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {tutorials.map((tut, i) => (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={i} className="bg-white border border-border p-6 rounded-[2rem] shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0 shadow-lg">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-foreground uppercase text-sm truncate">{tut.name}</h4>
                          <p className="text-xs text-muted-foreground font-bold mt-1 tracking-tight">{tut.duration} mins · {tut.credit} pts</p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 space-y-3">
                  <Button onClick={() => navigate("/dashboard")} className="w-full h-16 rounded-3xl bg-zinc-900 text-white font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02]">
                    FINISH & LAUNCH COURSE 🚀
                  </Button>
                  {tutorials.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground font-medium">You can finish without tutorials — they're optional.</p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
