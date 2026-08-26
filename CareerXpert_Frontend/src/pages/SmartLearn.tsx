import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, smartLearnApi, courseApi, mentorApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen, Loader2, ChevronRight, Play, Brain, MessageSquare,
  Send, Bot, Star, Award, Layers, Lock, CheckCircle, ArrowLeft,
  Zap, TrendingUp, RefreshCw, FileQuestion, Trophy, HelpCircle
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface Lesson {
  id: number;
  title: string;
  content?: string;
  lessonType?: string;
  difficultyLevel?: string;
  estimatedMinutes?: number;
  videoUrl?: string;
}

interface Tutorial {
  id: number;
  name: string;
  url: string;
  duration?: number;
  description?: string;
  credit?: number;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  lessons?: Lesson[];
}

interface Course {
  id: number;
  courseName: string;
  description?: string;
  tutorials?: Tutorial[];
}

interface ChatMsg {
  role: "user" | "bot";
  text: string;
  time: Date;
}

export default function SmartLearnPage() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [nextLesson, setNextLesson] = useState<Record<string, any> | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);

  // Tutor Chat
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [quizContent, setQuizContent] = useState<string | null>(null);

  // Quiz Assessment States
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);

  const [view, setView] = useState<"courses" | "modules" | "lessons" | "lesson" | "tutorial">("courses");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [apiReady, setApiReady] = useState(false);
  const videoProgress = useRef<Record<string, number>>({});
  // Tracks which % milestones (25,50,75,100) have been saved per lessonId
  const savedMilestones = useRef<Record<number, Set<number>>>({});
  const activeLessonRef = useRef<Lesson | null>(null);
  const activeTutorialRef = useRef<Tutorial | null>(null);
  const activeProfileIdRef = useRef<number | null>(null);

  // Keep refs in sync with state for player callbacks
  useEffect(() => { activeLessonRef.current = selectedLesson; }, [selectedLesson]);
  useEffect(() => { activeTutorialRef.current = selectedTutorial; }, [selectedTutorial]);
  useEffect(() => { activeProfileIdRef.current = profileId; }, [profileId]);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("smartlearn_video_progress");
    if (saved) {
      try { videoProgress.current = JSON.parse(saved); } catch(e) {}
    }
  }, []);

  // Helper for YouTube
  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYoutubeEmbedUrl = (url: string, start: number = 0) => {
    const id = getYoutubeId(url);
    if (!id) return "";
    return `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&start=${start}`;
  };

  // YouTube API Integration
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Load YouTube API script
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Callback for YouTube API
    window.onYouTubeIframeAPIReady = () => setApiReady(true);
    if (window.YT && window.YT.Player) setApiReady(true);

    return () => {
      if (playerRef.current) playerRef.current.destroy();
    };
  }, []);

  // Handle Video Selection & Swap
  const playerInitialized = useRef(false);

  useEffect(() => {
    const videoUrl = selectedTutorial?.url || selectedLesson?.videoUrl;
    const videoId = getYoutubeId(videoUrl || "");
    
    if (videoId && apiReady) {
      const startTime = videoProgress.current[videoId] || 0;
      
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        const currentUrl = playerRef.current.getVideoUrl?.() || "";
        if (!currentUrl.includes(videoId)) {
          try {
            playerRef.current.loadVideoById({
              videoId: videoId,
              startSeconds: startTime
            });
          } catch (e) {
            initYoutubePlayer(videoId, startTime);
          }
        }
      } else if (!playerInitialized.current) {
        initYoutubePlayer(videoId, startTime);
      }
    }
  }, [selectedLesson?.id, selectedTutorial?.id, apiReady]);

  // Track and save progress every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && typeof playerRef.current.getPlayerState === 'function') {
        const state = playerRef.current.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING) {
          const videoUrl = activeLessonRef.current?.videoUrl;
          const videoId = getYoutubeId(videoUrl || "");
          if (videoId) {
            const currentTime = Math.floor(playerRef.current.getCurrentTime());
            if (currentTime > 2) {
              videoProgress.current[videoId] = currentTime;
              localStorage.setItem("smartlearn_video_progress", JSON.stringify(videoProgress.current));
            }
            const lesson = activeLessonRef.current;
            const pid = activeProfileIdRef.current;
            if (lesson && pid) {
              const duration = playerRef.current.getDuration?.() || 0;
              if (duration > 0) {
                const progressPct = Math.min(99, Math.round((currentTime / duration) * 100));
                // Fire at 25, 50, 75 milestones only (100 handled at video end)
                const MILESTONES = [25, 50, 75];
                if (!savedMilestones.current[lesson.id]) {
                  savedMilestones.current[lesson.id] = new Set<number>();
                }
                const reached = MILESTONES.find(
                  m => progressPct >= m && !savedMilestones.current[lesson.id].has(m)
                );
                if (reached !== undefined) {
                  savedMilestones.current[lesson.id].add(reached);
                  smartLearnApi.saveVideoProgress(pid, lesson.id, progressPct, currentTime).catch(() => {});
                  toast({ title: `${reached}% Milestone Reached!`, description: `Video progress saved — resume from here anytime.` });
                }
              }
            }
          }
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [selectedLesson?.id, selectedTutorial?.id]);

  const initYoutubePlayer = (videoId: string, startTime: number) => {
    if (window.YT && window.YT.Player) {
      const el = document.getElementById('smartlearn-video-player');
      if (!el) return;

      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch(e) {}
      }

      playerInitialized.current = true;
      playerRef.current = new window.YT.Player('smartlearn-video-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: { 
          start: startTime,
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) handleVideoEnd();
          }
        }
      });
    }
  };

  const handleVideoEnd = () => {
    const lesson = activeLessonRef.current;
    const tutorial = activeTutorialRef.current;
    const pid = activeProfileIdRef.current;

    if (lesson && pid) {
      const duration = Math.floor(playerRef.current?.getDuration?.() || 0);
      toast({ title: "Lesson Complete! 🎉", description: "Video finished — +10 credits awarded!" });
      // Mark 100% milestone
      if (!savedMilestones.current[lesson.id]) savedMilestones.current[lesson.id] = new Set<number>();
      savedMilestones.current[lesson.id].add(100);
      handleSaveVideoProgressAcrossClosure(pid, lesson.id, 100, duration);
    } else if (tutorial) {
      toast({ title: "Tutorial Finished!", description: "Great job watching the tutorial!" });
    }
  };

  // Helper to save video progress % regardless of render closure
  const handleSaveVideoProgressAcrossClosure = async (pid: number, lessonId: number, progress: number, timestampSeconds: number = 0) => {
    try {
      await smartLearnApi.saveVideoProgress(pid, lessonId, progress, timestampSeconds);
      const [updated, progressUpdated] = await Promise.all([
        smartLearnApi.getLessonAttempts(pid),
        smartLearnApi.getCourseProgress(pid)
      ]);
      setAttempts(updated as any[]);
      setCourseProgress(progressUpdated as any[]);
    } catch {
      toast({ title: "Error", description: "Could not save video progress.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!user?.email) return;
      try {
        const p = await profileApi.getByEmail(user.email) as any;
        setProfile(p);
        setProfileId(p.id);

        let coursesData: Course[] = [];
        if (user.role === "ROLE_MENTOR") {
          const mentorData = await mentorApi.getByEmail(user.email) as any;
          if (mentorData?.id) {
            coursesData = await courseApi.getByMentor(mentorData.id) as unknown as Course[];
          }
        } else if (p.humanMentor?.id) {
          coursesData = await courseApi.getByMentor(p.humanMentor.id) as unknown as Course[];
        }

        const [nextLessonData, attemptsData, recData, progressData] = await Promise.all([
          smartLearnApi.getNextLesson(p.id).catch(() => null),
          smartLearnApi.getLessonAttempts(p.id).catch(() => []),
          profileApi.getCourseRecommendation(p.id).catch(() => null),
          smartLearnApi.getCourseProgress(p.id).catch(() => []),
        ]);

        setCourses(coursesData);
        setNextLesson(nextLessonData as any);
        setAttempts(attemptsData as unknown as any[]);
        setCourseProgress(progressData as any[]);
        if (recData) {
          setProfile((prev: any) => ({ ...prev, courseRecommendation: recData }));
        }
      } catch {
        toast({ title: "Error", description: "Failed to load learning data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  const handleSelectCourse = async (course: Course) => {
    setModulesLoading(true);
    setView("modules");
    setSelectedModule(null);
    try {
      const [fullCourse, modulesData] = await Promise.all([
        courseApi.getById(course.id),
        smartLearnApi.getModulesByCourse(course.id)
      ]);
      setSelectedCourse(fullCourse as unknown as Course);
      setModules(modulesData as unknown as Module[]);
    } catch {
      toast({ title: "Error", description: "Failed to load course details.", variant: "destructive" });
      setSelectedCourse(course);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleSelectModule = async (mod: Module) => {
    setSelectedModule(mod);
    setLessonsLoading(true);
    setView("lessons");
    try {
      const data = await smartLearnApi.getLessonsByModule(mod.id);
      setLessons(data as unknown as Lesson[]);
    } catch {
      toast({ title: "Error", description: "Failed to load lessons.", variant: "destructive" });
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleSelectLesson = async (lesson: Lesson) => {
    try {
      const full = await smartLearnApi.getLessonById(lesson.id);
      setSelectedLesson(full as unknown as Lesson);
      setSelectedTutorial(null);

      // Seed resume point from DB-stored lastTimestampSeconds (cross-device resume)
      const existingAttempt = attempts.find((a: any) => (a.lesson?.id || a.lessonId) === lesson.id);
      if (existingAttempt?.lastTimestampSeconds > 0) {
        const videoId = getYoutubeId((full as any).videoUrl || "");
        if (videoId) {
          const localTs = videoProgress.current[videoId] || 0;
          if (existingAttempt.lastTimestampSeconds > localTs) {
            videoProgress.current[videoId] = existingAttempt.lastTimestampSeconds;
          }
        }
      }

      // Pre-populate milestone tracker so we don't re-congratulate for past milestones
      const vidPct = existingAttempt?.videoProgress ?? 0;
      const preSaved = new Set<number>();
      [25, 50, 75, 100].forEach(m => { if (vidPct >= m) preSaved.add(m); });
      savedMilestones.current[lesson.id] = preSaved;

      setChatMessages([{
        role: "bot",
        text: `📚 Lesson loaded: **${(full as unknown as Lesson).title}**. Ask me any questions about this topic, or I'll explain concepts from the lesson content!`,
        time: new Date()
      }]);
      setQuizContent(null);
      setView("lesson");
    } catch {
      toast({ title: "Error", description: "Failed to load lesson.", variant: "destructive" });
    }
  };

  const handleSelectTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setSelectedLesson(null);
    setSelectedModule(null);
    setView("tutorial");
    setChatMessages([{
      role: "bot",
      text: `📺 Tutorial loaded: **${tutorial.name}**. You can watch the video below. Feel free to ask any questions about this tutorial!`,
      time: new Date()
    }]);
  };

  const handleAskTutor = async () => {
    if (!chatInput.trim() || !profileId) return;
    const userMsg: ChatMsg = { role: "user", text: chatInput, time: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    const inputText = chatInput;
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await smartLearnApi.askTutor(
        profileId,
        inputText,
        selectedLesson?.id,
        "DOUBT"
      );
      setChatMessages(prev => [...prev, { role: "bot", text: res as string, time: new Date() }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "bot", text: "Sorry, AI tutor is unavailable right now. Try again shortly.", time: new Date() }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedLesson?.id) return;
    setQuizLoading(true);
    setIsQuizOpen(true);
    setQuizFinished(false);
    setCurrentQuestion(0);
    setAnswers([]);
    try {
      const res = await smartLearnApi.generateQuizFromLesson(selectedLesson.id);
      const data = typeof res === 'string' ? JSON.parse(res) : res;
      if (Array.isArray(data) && data.length > 0) {
        setQuizQuestions(data);
      } else {
        throw new Error("Invalid quiz data");
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate quiz.", variant: "destructive" });
      setIsQuizOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIdx;
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const finishQuiz = async (finalAnswers: number[]) => {
    if (!profileId || !selectedLesson?.id) return;
    
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (finalAnswers[idx] === q.correctAnswer) correctCount++;
    });
    
    const percentage = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizScore(percentage);
    setQuizFinished(true);

    await handleSaveAttempt(percentage, quizQuestions.length, correctCount);
  };

  const handleSaveAttempt = async (score: number, totalQuestions?: number, correctAnswers?: number) => {
    if (!profileId || !selectedLesson?.id) return;
    try {
      await smartLearnApi.saveAttempt(profileId, selectedLesson.id, score, totalQuestions, correctAnswers);
      toast({ title: "Progress Saved!", description: `Score of ${score}% recorded.` });
      const updated = await smartLearnApi.getLessonAttempts(profileId);
      setAttempts(updated as any[]);
      const progressUpdated = await smartLearnApi.getCourseProgress(profileId);
      setCourseProgress(progressUpdated as any[]);
    } catch {
      toast({ title: "Error", description: "Could not save progress.", variant: "destructive" });
    }
  };

  const completedLessonIds = new Set(
    attempts
      .filter((a: any) => a.score >= 70 || a.videoCompleted)
      .map((a: any) => a.lesson?.id || a.lessonId)
  );

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 shadow-2xl"
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">AI-Powered Learning</p>
            <h1 className="text-3xl font-black text-white tracking-tight">SmartLearn Studio</h1>
            <p className="text-white/60 text-sm font-medium mt-1">Browse courses, study lessons, and ask your AI tutor</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { icon: BookOpen, label: "Lessons Done", value: attempts.length },
              { icon: TrendingUp, label: "Avg Score", value: attempts.length > 0 ? `${Math.round(attempts.reduce((a: number, at: any) => a + (at.score || 0), 0) / attempts.length)}%` : "N/A" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-white min-w-[100px]">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-white/70" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-white/60">{label}</span>
                </div>
                <div className="text-2xl font-black">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Next Lesson Recommendation */}
      {nextLesson && view === "courses" && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">AI Recommendation</p>
              <p className="font-bold text-sm text-foreground">{(nextLesson as any).recommendedLesson?.title || "Your next lesson is ready!"}</p>
              <p className="text-xs text-indigo-400">{(nextLesson as any).reason}</p>
            </div>
          </div>
          {(nextLesson as any).recommendedLesson?.id && (
            <Button
              size="sm"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0"
              onClick={() => handleSelectLesson((nextLesson as any).recommendedLesson)}
            >
              Start Now <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Navigation */}
        <div className="lg:col-span-1 space-y-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground flex-wrap">
            <button onClick={() => setView("courses")} className={`hover:text-primary transition-colors ${view === "courses" ? "text-primary" : ""}`}>Courses</button>
            {selectedCourse && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => setView("modules")} className={`hover:text-primary transition-colors ${view === "modules" ? "text-primary" : ""}`}>
                  {selectedCourse.courseName}
                </button>
              </>
            )}
            {selectedModule && (
              <>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => setView("lessons")} className={`hover:text-primary transition-colors ${view === "lessons" ? "text-primary" : ""}`}>
                  {selectedModule.title}
                </button>
              </>
            )}
            {selectedLesson && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-primary truncate max-w-[100px]">{selectedLesson.title}</span>
              </>
            )}
            {selectedTutorial && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-primary truncate max-w-[100px]">{selectedTutorial.name}</span>
              </>
            )}
          </div>

          {/* Content List */}
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-zinc-50">
              <h3 className="font-black text-sm text-foreground uppercase tracking-tight">
                {view === "courses" ? "📚 All Courses" :
                 view === "modules" ? `📂 ${selectedCourse?.courseName}` :
                 view === "lessons" ? `📋 ${selectedModule?.title}` :
                 view === "tutorial" ? `🎥 ${selectedTutorial?.name}` :
                 `📖 ${selectedLesson?.title}`}
              </h3>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {/* COURSES */}
                {view === "courses" && (
                  <motion.div key="courses" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {courses.length === 0 ? (
                      <div className="p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                          <BookOpen className="w-8 h-8" />
                        </div>
                        {user?.role === "ROLE_STUDENT" && !profile?.humanMentor ? (
                          <div className="space-y-4">
                            <p className="font-black text-foreground">Connect with a Mentor</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {profile?.courseRecommendation?.courseName 
                                ? `Your path suggests **${profile.courseRecommendation.courseName}**, but you need a mentor to access curated courses.`
                                : "You haven't connected with a mentor yet. Connect with one to access their specialized learning paths!"}
                            </p>
                            <Link to="/mentors">
                              <Button className="rounded-xl brand-gradient font-bold mt-2">
                                Browse Mentors <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No courses assigned yet by your mentor.</p>
                        )}
                      </div>
                    ) : (
                      courses.map((course, i) => (
                        <motion.button
                          key={course.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handleSelectCourse(course)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0 group ${selectedCourse?.id === course.id ? "bg-primary/5" : ""}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground truncate group-hover:text-primary">{course.courseName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {courseProgress.find(p => p.courseId === course.id) ? (
                                <>
                                  <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary transition-all duration-500" 
                                      style={{ width: `${courseProgress.find(p => p.courseId === course.id)?.progressPercentage || 0}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-black text-primary">
                                    {Math.round(courseProgress.find(p => p.courseId === course.id)?.progressPercentage || 0)}%
                                  </span>
                                </>
                              ) : (
                                <p className="text-[10px] text-muted-foreground truncate">{course.description || "Click to browse modules"}</p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </motion.button>
                      ))
                    )}
                  </motion.div>
                )}

                {/* MODULES & TUTORIALS */}
                {view === "modules" && (
                  <motion.div key="modules" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button onClick={() => setView("courses")} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors border-b border-border">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
                    </button>
                    {modulesLoading ? (
                      <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : (
                      <>
                        {/* Static Tutorials section if any */}
                        {selectedCourse?.tutorials && selectedCourse.tutorials.length > 0 && (
                          <div className="border-b border-border/50">
                            <div className="px-4 py-2 bg-zinc-100/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Course Tutorials</div>
                            {selectedCourse.tutorials.map((tut, i) => (
                              <motion.button
                                key={`tut-${tut.id}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => handleSelectTutorial(tut)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary/5 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                  <Play className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-foreground truncate group-hover:text-primary">{tut.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{tut.duration ? `${tut.duration} mins` : "Video Tutorial"}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                              </motion.button>
                            ))}
                          </div>
                        )}

                        {/* Modules section */}
                        <div className="px-4 py-2 bg-zinc-100/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Learning Modules</div>
                        {modules.length === 0 ? (
                          <p className="p-6 text-sm text-muted-foreground text-center">No modules available.</p>
                        ) : modules.map((mod, i) => (
                          <motion.button
                            key={mod.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => handleSelectModule(mod)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 text-xs font-black text-violet-600">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-foreground truncate group-hover:text-primary">{mod.title}</p>
                              <p className="text-[10px] text-muted-foreground">{mod.description || "Click to browse lessons"}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </motion.button>
                        ))}
                      </>
                    )}
                  </motion.div>
                )}

                {/* LESSONS */}
                {view === "lessons" && (
                  <motion.div key="lessons" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button onClick={() => setView("modules")} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors border-b border-border">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Modules
                    </button>
                    {lessonsLoading ? (
                      <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : lessons.length === 0 ? (
                      <p className="p-6 text-sm text-muted-foreground text-center">No lessons available.</p>
                    ) : lessons.map((lesson, i) => {
                      const done = completedLessonIds.has(lesson.id);
                      const lessonAttempt = attempts.find((a: any) => (a.lesson?.id || a.lessonId) === lesson.id);
                      const vidPct: number = lessonAttempt?.videoProgress ?? 0;
                      const quizScore: number = lessonAttempt?.score ?? 0;
                      return (
                        <motion.button
                          key={lesson.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => handleSelectLesson(lesson)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0 group ${selectedLesson?.id === lesson.id ? "bg-primary/5" : ""}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${done ? "bg-emerald-50" : vidPct > 0 ? "bg-amber-50" : "bg-blue-50"}`}>
                            {done ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : vidPct > 0 ? <Play className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground truncate group-hover:text-primary">{lesson.title}</p>
                            {vidPct > 0 ? (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-amber-400"}`}
                                    style={{ width: `${vidPct}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-black shrink-0 ${done ? "text-emerald-500" : "text-amber-500"}`}>{vidPct}%</span>
                                {quizScore > 0 && (
                                  <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">Q:{quizScore}%</span>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">{lesson.estimatedMinutes ? `~${lesson.estimatedMinutes} min` : lesson.difficultyLevel || "Lesson"}</p>
                            )}
                          </div>
                          {done && <Award className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* LESSON SELECTED */}
                {view === "lesson" && selectedLesson && (
                  <motion.div key="lesson" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button onClick={() => setView("lessons")} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors border-b border-border">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Lessons
                    </button>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Current Lesson</p>
                        <h4 className="font-black text-foreground text-sm">{selectedLesson.title}</h4>
                      </div>
                      {selectedLesson.content && (
                        <div className="bg-zinc-50 rounded-xl p-3 border border-border">
                          <p className="text-xs text-muted-foreground leading-relaxed">{selectedLesson.content}</p>
                        </div>
                      )}
                      {(() => {
                        const attempt = attempts.find((a: any) => (a.lesson?.id || a.lessonId) === selectedLesson.id);
                        // Check if a quiz was actually taken (score > 0 or questions answered)
                        if (attempt && (attempt.score > 0 || attempt.totalQuestions > 0)) {
                          return (
                            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 flex flex-col items-center justify-center mt-4">
                              <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Previous Quiz Score</p>
                              <div className="flex items-end gap-1">
                                <span className="text-3xl font-black text-primary">{attempt.score}%</span>
                              </div>
                              {attempt.totalQuestions > 0 && (
                                <p className="text-[10px] text-primary/70 font-bold mt-1">
                                  {attempt.correctAnswers} / {attempt.totalQuestions} Correct
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="space-y-2 mt-4">
                        <Button
                          size="sm"
                          className="w-full rounded-xl gap-2 font-bold"
                          onClick={handleGenerateQuiz}
                          disabled={quizLoading}
                        >
                          {quizLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileQuestion className="w-3.5 h-3.5" />}
                          {attempts.some((a: any) => (a.lesson?.id || a.lessonId) === selectedLesson.id && (a.score > 0 || a.totalQuestions > 0)) 
                            ? "Retake Quiz" 
                            : "Generate Quiz"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: AI Tutor Chat + Quiz */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Video Player Section */}
          {(selectedTutorial || (selectedLesson && selectedLesson.videoUrl)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 aspect-video relative group"
            >
              {/* Stable container that React won't touch */}
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: '<div id="smartlearn-video-player" class="w-full h-full"></div>' }}
              />
              
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {selectedTutorial ? "Watch Tutorial" : "Lesson Video"}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quiz Assessment Modal */}
          <Dialog open={isQuizOpen} onOpenChange={(open) => !quizLoading && setIsQuizOpen(open)}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent shadow-none">
              <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-primary/20">
                {quizLoading ? (
                  <div className="p-12 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full brand-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary/20 animate-pulse">
                      <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Generating AI Quiz...</h3>
                    <p className="text-sm text-muted-foreground animate-pulse">Crafting questions for {selectedLesson?.title}</p>
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mt-4" />
                  </div>
                ) : quizFinished ? (
                  <div className="p-10 text-center space-y-6">
                    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <Trophy className="w-12 h-12 text-green-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground">Assessment Complete!</h3>
                      <p className="text-muted-foreground font-bold mt-1">You scored {quizScore}% on this lesson</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Status</p>
                            <p className={`text-sm font-black ${quizScore >= 80 ? 'text-green-600' : 'text-blue-600'}`}>
                                {quizScore >= 80 ? 'EXCELLENT' : 'COMPLETED'}
                            </p>
                        </div>
                         <div className="bg-zinc-50 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Score</p>
                            <p className="text-sm font-black text-primary">{quizScore}%</p>
                        </div>
                    </div>
                    <Button className="w-full rounded-2xl h-14 font-black text-lg brand-gradient text-white" onClick={() => setIsQuizOpen(false)}>
                        Close Assessment
                    </Button>
                  </div>
                ) : quizQuestions.length > 0 ? (
                  <div className="flex flex-col h-[550px]">
                    {/* Header */}
                    <div className="p-6 bg-zinc-50 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-foreground truncate max-w-[200px]">{selectedLesson?.title}</h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Question {currentQuestion + 1} of {quizQuestions.length}</p>
                        </div>
                      </div>
                      <div className="h-2 w-32 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }} />
                      </div>
                    </div>

                    {/* Question Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                      <h4 className="text-xl font-black text-foreground leading-tight">
                        {quizQuestions[currentQuestion]?.question}
                      </h4>
                      <div className="space-y-3">
                        {quizQuestions[currentQuestion]?.options.map((opt: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => handleQuizAnswer(i)}
                            className="w-full text-left p-4 rounded-2xl border-2 border-zinc-100 hover:border-primary/40 hover:bg-primary/5 transition-all group relative overflow-hidden"
                          >
                            <div className="flex items-center gap-4 relative z-10 transition-transform group-hover:translate-x-1">
                              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-black text-xs text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                                {String.fromCharCode(65 + i)}
                              </div>
                              <span className="text-sm font-bold text-zinc-700 group-hover:text-primary transition-colors">{opt}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-zinc-50 border-t flex items-center justify-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <HelpCircle className="w-3 h-3" /> Selected answer updates automatically
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>

          {/* AI Tutor Chat */}
          <div className="flex-1 bg-white border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col" style={{ minHeight: "500px" }}>
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-sm">AI SmartLearn Tutor</h3>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {selectedLesson ? `Context: ${selectedLesson.title}` : selectedTutorial ? `Context: ${selectedTutorial.name}` : "Select a topic to set context"}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="ghost" className="rounded-xl text-xs font-bold gap-1" onClick={() => setChatMessages([])}>
                  <RefreshCw className="w-3.5 h-3.5" /> Clear
                </Button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Bot className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="font-black text-base text-foreground mb-2">Your AI Learning Tutor</p>
                  <p className="text-sm text-muted-foreground mb-6">Select a lesson or tutorial from the left panel, then ask me anything about it!</p>
                  <div className="space-y-2 w-full max-w-sm">
                    {["Explain this concept in simple terms", "Give me a real-world example", "What are common mistakes to avoid?"].map(q => (
                      <button
                        key={q}
                        onClick={() => setChatInput(q)}
                        className="w-full text-left px-4 py-2.5 rounded-xl bg-muted/50 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "bot" && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2 shrink-0 mt-1">
                        <Brain className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2 shrink-0">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskTutor(); } }}
                  placeholder={profileId ? "Ask your AI tutor a question..." : "Login to use the tutor"}
                  disabled={!profileId}
                  className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors"
                />
                <Button
                  onClick={handleAskTutor}
                  disabled={!chatInput.trim() || chatLoading || !profileId}
                  className="rounded-xl w-11 h-11 p-0 brand-gradient shadow-md"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
