import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, quizApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  User,
  BookOpen,
  GraduationCap,
  Loader2,
  Briefcase,
  Award,
  Target,
  Zap,
  Compass,
  ArrowRight,
  Star,
  MessageSquare,
  Activity,
  MapPin,
  BrainCircuit,
  FileText,
  Mic,
  Users,
  Newspaper,
  TrendingUp,
  School,
  Trophy,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import MentorDashboard from "./MentorDashboard";

const QUICK_ACTIONS = [
  {
    icon: BrainCircuit,
    label: "AI Career Mentor",
    desc: "Get personalized AI career advice",
    href: "/chatbot",
    color: "from-violet-500 to-indigo-600",
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    icon: Mic,
    label: "Mock Interview",
    desc: "Practice AI-generated scenarios",
    href: "/mock-interview",
    color: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  {
    icon: FileText,
    label: "Resume Scanner",
    desc: "FAANG-level ATS review",
    href: "/resume-review",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-cyan-50",
    text: "text-cyan-600",
  },
  {
    icon: Activity,
    label: "Skill Quizzes",
    desc: "Assess and build your skills",
    href: "/quiz-list",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },

  {
    icon: Newspaper,
    label: "News & Facts",
    desc: "AI-verified career news feed",
    href: "/news",
    color: "from-amber-500 to-yellow-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  {
    icon: Users,
    label: "Find Mentors",
    desc: "Connect with expert mentors",
    href: "/mentors",
    color: "from-green-500 to-lime-500",
    bg: "bg-lime-50",
    text: "text-lime-700",
  },
  {
    icon: School,
    label: "Colleges",
    desc: "Discover top institutions",
    href: "/colleges",
    color: "from-purple-500 to-fuchsia-500",
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-600",
  },
  {
    icon: TrendingUp,
    label: "Skill Progress",
    desc: "Track mastery of your skills",
    href: "/skill-progress",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-teal-50",
    text: "text-teal-600",
  },
  {
    icon: Brain,
    label: "SmartLearn",
    desc: "AI-tutored lessons & quizzes",
    href: "/smartlearn",
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
  },
  {
    icon: ShieldCheck,
    label: "AI Fact-Checker",
    desc: "Verify news with NewsAI",
    href: "/newsai",
    color: "from-slate-600 to-blue-700",
    bg: "bg-rose-50",
    text: "text-rose-600",
  },
];

export default function Dashboard() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [quizResults, setQuizResults] = useState<Array<Record<string, any>>>([]);
  const [courseRec, setCourseRec] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [pathfinderStream, setPathfinderStream] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);

  const handleGeneratePathfinderQuiz = async (track: string) => {
    if (!profile?.id) return;
    setIsGeneratingQuiz(true);
    try {
      const quiz = await quizApi.generateQuiz({
        title: `Pathfinder: ${track}`,
        category: track,
        numQ: 30,
        tempCreatorId: profile.id
      }, "Medium");
      toast({ title: "Quiz Generated!", description: "AI has prepared your 30-question assessment." });
      navigate(`/take-quiz/${quiz.id}?pathfinder=true`);
    } catch (err) {
      toast({ 
        title: "Generation Failed", 
        description: "AI model is currently busy. Please try again soon.",
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  useEffect(() => {
    const handler = (e: any) => {
      const { userId, online } = e.detail;
      if (profile?.humanMentor?.userId === userId) {
        setProfile((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            humanMentor: {
              ...prev.humanMentor,
              online
            }
          };
        });
      }
    };
    window.addEventListener('user-status-change', handler);
    return () => window.removeEventListener('user-status-change', handler);
  }, [profile?.humanMentor?.userId]);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/auth"); return; }
    if (user?.role === "ROLE_MENTOR") return;

    let mounted = true;
    const fetchAll = async () => {
      try {
        const p = await profileApi.getByEmail(user!.email);
        if (!mounted) return;
        setProfile(p);
        if (p?.stream) setPathfinderStream(p.stream as string);
        if (p?.id) {
          try {
            const [results, course, progress] = await Promise.all([
              profileApi.getQuizResults(p.id as number).catch(() => []),
              profileApi.getCourseRecommendation(p.id as number).catch(() => null),
              import("@/lib/api").then(m => m.smartLearnApi.getCourseProgress(p.id as number)).catch(() => []),
            ]);
            if (mounted) {
              setQuizResults((results as any[]) || []);
              setCourseRec(course as any);
              setCourseProgress(progress as any[]);
            }
          } catch { /* silent */ }
        }
      } catch {
        if (mounted) {
          toast({ title: "Welcome!", description: "Let's set up your profile." });
          setProfile({});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, [isLoggedIn, user, navigate]);

  if (user?.role === "ROLE_MENTOR") return <MentorDashboard />;

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <span className="text-muted-foreground font-medium animate-pulse">Loading your dashboard...</span>
    </div>
  );

  const p = profile || {};
  const avgScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((acc, r) => {
        const score = Number(r.score) || 0;
        const total = Number(r.totalScore) || 10; // Fallback to 10 if missing
        return acc + (score / total) * 100;
      }, 0) / quizResults.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">

      {/* ── Hero / Welcome Banner ── */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[2.5rem] overflow-hidden glass-card p-8 glow-orange border-2 border-orange-200/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 opacity-95"></div>
        <div className="absolute inset-0"
          style={{ 
            backgroundImage: "radial-gradient(circle at 70% 50%, rgba(255,255,255,0.2) 1px, transparent 1px)", 
            backgroundSize: "30px 30px",
            animation: "patternMove 40s linear infinite"
          }} 
        />
        <div className="absolute top-10 right-10 w-64 h-64 bg-yellow-300/25 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-orange-300/25 rounded-full blur-2xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black text-white border-2 border-white/40 shadow-2xl animate-scale-in">
              {(p.fullName as string)?.[0]?.toUpperCase() || <User className="w-8 h-8" />}
            </div>
            <div>
              <p className="text-white/80 text-sm font-semibold uppercase tracking-widest">Welcome back</p>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">
                {p.fullName?.split(" ")[0] || "Learner"} 👋
              </h1>
              <p className="text-white/70 text-sm font-medium mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                {(p.location as string) || "Ready to grow"} · {(p.educationLevel as string) || "Student"}
              </p>
            </div>
          </div>
          {/* Stats Row */}
          <div className="flex gap-4 flex-wrap">
            {[
              { icon: Zap, label: "Credits", value: (p.credit as number) || 0, sub: "available" },
              { icon: Activity, label: "Quizzes", value: quizResults.length, sub: "completed" },
              { icon: TrendingUp, label: "Avg Score", value: `${avgScore}%`, sub: "across all" },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm border-2 border-white/25 rounded-2xl px-5 py-3 text-white min-w-[100px] hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-white/80" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-white/70">{label}</span>
                </div>
                <div className="text-2xl font-black drop-shadow-md">{value}</div>
                <div className="text-[10px] text-white/60 font-medium">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Quick Actions Grid ── */}
      <section>
        <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary fill-primary/30 animate-pulse" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(({ icon: Icon, label, desc, href, color, bg, text }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={href} className="block group">
                <div className="glass-card rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full border-2 border-transparent hover:border-primary/20">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3 group-hover:scale-125 transition-transform duration-300 shadow-md`}>
                    <Icon className={`w-5 h-5 ${text}`} />
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-1 leading-tight group-hover:text-primary transition-colors">{label}</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bottom Grid: Course Rec + Profile + Mentor ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AI Course Recommendation */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 shadow-lg border-2 border-orange-100/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500 animate-pulse" /> Career Path Blueprint
            </h2>
            <Link to="/courses">
              <Button size="sm" variant="ghost" className="rounded-xl text-primary hover:bg-primary/10 font-bold gap-1 transition-all duration-300 hover:scale-105">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {courseRec ? (
            <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-200/50 rounded-2xl p-6 shadow-lg">
              <div className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                AI Recommended
              </div>
              <h3 className="text-xl font-black text-foreground mb-3 gradient-text">{courseRec.courseName as string}</h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-5">{courseRec.description as string}</p>
              <Link to="/courses">
                <Button size="sm" className="rounded-xl brand-gradient text-white font-bold px-6 shadow-lg glow-orange hover:shadow-xl transition-all hover:scale-105">
                  Explore Path
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {!pathfinderStream && (p.educationLevel === "Class 12") && !p.stream ? (
                <div className="text-center p-6 border-2 border-dashed border-border rounded-xl">
                  <GraduationCap className="w-10 h-10 text-primary mx-auto mb-3 opacity-30" />
                  <h3 className="font-black text-foreground mb-1">Select Your Class 12 Stream</h3>
                  <p className="text-xs text-muted-foreground mb-6">Tell us your current focus to see relevant career tracks</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["PCM", "PCB", "Commerce", "Arts"].map(s => (
                      <Button 
                        key={s} 
                        variant="outline" 
                        onClick={() => setPathfinderStream(s)}
                        className="rounded-xl font-bold hover:bg-primary hover:text-white transition-all"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-black text-foreground uppercase tracking-tight">
                        {p.educationLevel === "Class 10" ? "Class 11-12 Stream Selection" : `${pathfinderStream} Career Tracks`}
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select a path to generate your assessment</p>
                    </div>
                    {pathfinderStream && (
                      <Button variant="ghost" size="sm" onClick={() => setPathfinderStream(null)} className="text-[10px] font-black underline uppercase">Change Stream</Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(p.educationLevel === "Class 10" 
                      ? ["PCM", "PCB", "PCMB", "Commerce", "Fine Arts", "Humanities"]
                      : pathfinderStream === "PCM" ? ["Engineering", "B.Sc", "Architecture", "Data Science"]
                      : pathfinderStream === "PCB" ? ["MBBS", "BAMS", "Nursing", "Biotechnology"]
                      : pathfinderStream === "Commerce" ? ["CA", "B.Com", "BBA", "Economics"]
                      : ["Fine Arts", "BA", "Design", "Psychology"]
                    ).map((track, idx) => (
                      <motion.button
                        key={track}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleGeneratePathfinderQuiz(track)}
                        className="p-5 rounded-2xl border-2 border-border glass-card text-left hover:border-orange-300/50 hover:shadow-2xl transition-all group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mb-3 group-hover:from-orange-500 group-hover:to-amber-500 transition-all duration-300 shadow-md">
                          <Target className="w-5 h-5 text-orange-600 group-hover:text-white transition-colors" />
                        </div>
                        <h4 className="font-black text-sm text-foreground mb-1 leading-tight group-hover:text-orange-600 transition-colors">{track}</h4>
                        <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">30 Questions</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              
              {isGeneratingQuiz && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
                  <div className="glass-card rounded-[2.5rem] p-12 max-w-sm w-full text-center space-y-6 shadow-2xl border-2 border-blue-200/50 animate-scale-in">
                    <div className="w-24 h-24 rounded-3xl brand-gradient flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/40 animate-pulse-glow">
                      <Loader2 className="w-12 h-12 animate-spin text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-foreground uppercase tracking-tight gradient-text">Architecting Quiz</h3>
                      <p className="text-xs text-muted-foreground font-medium italic leading-relaxed">Our AI is generating 30 specialized questions to analyze your potential in this track...</p>
                    </div>
                    <div className="pt-4">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          className="h-full brand-gradient shadow-lg"
                          animate={{ width: ["10%", "90%"] }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Learning Progress Section */}
          <div className="mt-8">
            <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary fill-primary/30" /> Learning Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courseProgress.length > 0 ? (
                courseProgress.slice(0, 4).map((prog, idx) => (
                  <Link key={idx} to="/smartlearn" className="block group">
                    <div className="glass-card rounded-2xl p-5 border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{prog.courseName}</h4>
                        <span className="text-xs font-black text-primary">{Math.round(prog.progressPercentage)}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full brand-gradient"
                          initial={{ width: 0 }}
                          animate={{ width: `${prog.progressPercentage}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                        {prog.completedLessons} of {prog.totalLessons} lessons completed
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="md:col-span-2 p-8 text-center border-2 border-dashed border-border rounded-2xl opacity-60">
                   <p className="text-sm font-medium text-muted-foreground">Enroll in courses from SmartLearn to track your progress!</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Quiz Results */}
          {quizResults.length > 0 && (
            <div className="mt-8 pt-5 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent Quiz Results</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-black uppercase text-primary hover:bg-primary/5 rounded-lg px-2">
                       View All
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-white border-border p-8 rounded-[2rem] shadow-2xl">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-black flex items-center gap-3 text-foreground">
                        <Activity className="w-8 h-8 text-primary" />
                        Quiz Performances
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      {quizResults.map((r, i) => {
                        const score = Number(r.score) || 0;
                        const total = Number(r.totalScore) || 10;
                        const percent = Math.round((score / total) * 100);
                        return (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${percent >= 70 ? 'bg-green-50' : 'bg-orange-50'}`}>
                                <Trophy className={`w-5 h-5 ${percent >= 70 ? 'text-green-600' : 'text-orange-500'}`} />
                               </div>
                              <div>
                                <p className="font-black text-sm text-foreground">{(r.title as string) || (r.quiz as any)?.title || "Untitled Quiz"}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                  {r.dateTaken ? new Date(r.dateTaken).toLocaleString() : "Date unknown"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-lg font-black ${percent >= 70 ? 'text-green-600' : 'text-orange-500'}`}>{percent}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {quizResults.slice(0, 3).map((r, i) => {
                    const score = Number(r.score) || 0;
                    const total = Number(r.totalScore) || 10;
                    const percent = Math.round((score / total) * 100);
                    return (
                      <div key={i} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2 truncate">
                          <Trophy className={`w-3.5 h-3.5 ${percent >= 70 ? "text-green-600" : "text-orange-500"}`} />
                          <span className="text-[11px] font-bold text-foreground truncate">
                            {(r.title as string) || (r.quiz as any)?.title || `Quiz #${i + 1}`}
                          </span>
                        </div>
                        <span className={`text-[11px] font-black ${percent >= 70 ? "text-green-600" : "text-orange-500"}`}>
                          {percent}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Profile + Mentor */}
        <div className="flex flex-col gap-5">
          {/* Profile Strengths */}
          <div className="glass-card rounded-2xl p-5 shadow-lg border-2 border-pink-100/50">
            <h3 className="font-black text-foreground mb-4 flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-pink-500 animate-pulse" /> Your Profile
            </h3>
            <div className="space-y-3">
              {p.skills && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(p.skills as string).split(",").slice(0, 5).map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-primary/8 text-primary text-[11px] font-bold rounded-lg border border-primary/10">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {p.interests && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Interests</p>
                  <p className="text-xs font-medium text-foreground/80">{p.interests as string}</p>
                </div>
              )}
              {p.careerGoal && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Career Goal</p>
                  <p className="text-xs font-medium text-foreground/80 flex items-start gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    {p.careerGoal as string}
                  </p>
                </div>
              )}
              {!p.skills && !p.interests && !p.careerGoal && (
                <p className="text-xs text-muted-foreground/60 italic">Complete your profile for personalized recommendations.</p>
              )}
            </div>
          </div>

          {/* Active Mentor */}
          {p.humanMentor ? (
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200/50 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-emerald-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" /> Active Mentor
                </h3>
                <div className={`w-2.5 h-2.5 rounded-full ${p.humanMentor?.online ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-slate-300'}`} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl brand-gradient-emerald text-white flex items-center justify-center font-black text-lg shadow-lg">
                  {(p.humanMentor as any).name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{(p.humanMentor as any).name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {(p.humanMentor as any).jobRole || "Expert"}
                  </p>
                </div>
              </div>
              <Link to={`/mentor-chat?email=${(p.humanMentor as any).email}`}>
                <Button className="w-full brand-gradient-emerald text-white rounded-xl font-bold text-xs h-10 gap-2 shadow-lg glow-emerald hover:shadow-xl transition-all hover:scale-105">
                  <MessageSquare className="w-4 h-4" /> Message Mentor
                </Button>
              </Link>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-5 shadow-lg border-2 border-yellow-100/50">
              <h3 className="font-black text-foreground text-sm flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" /> Get a Mentor
              </h3>
              <p className="text-xs text-muted-foreground/70 mb-4 leading-relaxed">Connect with an industry expert to fast-track your career.</p>
              <Link to="/mentors">
                <Button className="w-full rounded-xl brand-gradient-amber text-white font-bold text-xs h-10 gap-2 shadow-lg glow-amber hover:shadow-xl transition-all hover:scale-105">
                  Browse Mentors <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
