import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { quizApi, profileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Compass, Sparkles, ArrowRight, Zap, Target, BookOpen, GraduationCap, School } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface NQ {
  questionId: number;
  title: string;
  category: string;
  options: { optionId: number; text: string }[];
  correctOptionId: number | null;
  correctOptionText: string | null;
}

export default function RecommendationQuiz() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [quizzes, setQuizzes] = useState<Array<Record<string, unknown>>>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [questions, setQuestions] = useState<NQ[]>([]);
  const [quizMeta, setQuizMeta] = useState({ title: "", category: "" });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"select" | "quiz" | "result">("select");
  const [pathfinderStream, setPathfinderStream] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/auth"); return; }
    const fetchBaseData = async () => {
      try {
        const [p, qs] = await Promise.all([
          profileApi.getByEmail(user!.email),
          quizApi.getForUser(user!.id).catch(() => [])
        ]);
        setProfile(p);
        setQuizzes(qs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBaseData();
  }, [isLoggedIn, navigate, user]);

  const loadQuiz = async (quizId: number) => {
    setLoading(true);
    try {
      const raw = await quizApi.getById(quizId);
      setSelectedQuiz(quizId);
      setQuizMeta({ title: (raw.title as string) || "Quiz", category: (raw.category as string) || "" });
      const rawQ = (raw.questions || raw.questionList || []) as Array<Record<string, unknown>>;
      setQuestions(rawQ.map((q, i) => {
        const options: { optionId: number; text: string }[] = [];
        ["option1", "option2", "option3", "option4"].forEach((f, j) => {
          if (q[f]) options.push({ optionId: j + 1, text: String(q[f]) });
        });
        if (options.length === 0 && Array.isArray(q.options)) {
          (q.options as any[]).forEach((o, j) => options.push({ optionId: o.optionId ?? j + 1, text: o.text ?? String(o) }));
        }
        return {
          questionId: (q.id ?? q.questionId ?? i + 1) as number,
          title: (q.title ?? q.questionTitle ?? "") as string,
          category: (q.category ?? raw.category as string) as string,
          options,
          correctOptionId: (q.correctOptionId ?? null) as number | null,
          correctOptionText: (q.correctAnswer ?? q.correctOptionText ?? null) as string | null,
        };
      }));
      setStep("quiz");
    } catch { /* empty */ }
    setLoading(false);
  };

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
      toast({ title: "Quiz Generated!", description: "AI has prepared your specialized 30-question assessment." });
      await loadQuiz(quiz.id as number);
    } catch (err) {
      toast({ 
        title: "Generation Failed", 
        description: "AI engine is currently synchronized. Please try again soon.",
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    const payload = {
      quizId: selectedQuiz,
      quizTitle: quizMeta.title,
      quizCategory: quizMeta.category,
      userProfileId: user!.id,
      answers: questions.map((q) => {
        const selId = answers[q.questionId] ?? null;
        const selOpt = selId ? q.options.find((o) => o.optionId === selId) : null;
        return {
          questionId: q.questionId,
          questionText: q.title,
          category: q.category,
          options: q.options,
          correctOptionId: q.correctOptionId,
          correctOptionText: q.correctOptionText,
          selectedOptionId: selId,
          selectedOptionText: selOpt?.text ?? null,
          isAttempted: selId !== null,
        };
      }),
    };
    try {
      const res = await profileApi.submitForCourse(user!.id, payload);
      setResult(res);
      setStep("result");
    } catch {
      alert("Error fetching course recommendation");
    }
    setLoading(false);
  };

  if (loading && step === "select") return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Synchronizing Protocol...</span>
    </div>
  );

  if (step === "select") {
    const p = profile || {};
    return (
      <div className="max-w-5xl mx-auto space-y-12">
        <section className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                <Compass className="w-3 h-3" /> Pathfinding Protocol
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase">Course Discovery</h1>
            <p className="text-gray-500 font-medium max-w-lg mx-auto">Select a knowledge domain or a specialized career track to begin your AI-powered recommendation journey.</p>
        </section>

        <div className="space-y-16">
          {/* Dynamic Pathfinder Section */}
          <section className="glass-card rounded-[3rem] p-10 border-primary/20 shadow-2xl relative overflow-hidden bg-white/40">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="w-64 h-64 text-primary" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">AI Pathway Builder</h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">{p.educationLevel || "Student"} Diagnostic Mode</p>
                </div>
              </div>

              {!pathfinderStream && (p.educationLevel === "Class 12") ? (
                <div className="text-center py-12 border-2 border-dashed border-primary/10 rounded-[2rem] bg-white/20">
                  <GraduationCap className="w-16 h-16 text-primary mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-black text-foreground mb-2">Identify Your Stream</h3>
                  <p className="text-sm text-muted-foreground mb-10 max-w-md mx-auto italic font-medium">Select your current focus in Class 12 to reveal high-potential career tracks optimized by our AI.</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {["PCM", "PCB", "Commerce", "Arts"].map(s => (
                      <Button 
                        key={s} 
                        size="lg"
                        variant="outline" 
                        onClick={() => setPathfinderStream(s)}
                        className="rounded-2xl h-16 px-10 font-black text-lg hover:brand-gradient hover:text-white transition-all shadow-sm border-primary/20"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">
                      Available Paths for {p.educationLevel === "Class 10" ? "Class 11-12" : `${pathfinderStream} Specialization`}
                    </p>
                    {pathfinderStream && (
                      <Button variant="ghost" size="sm" onClick={() => setPathfinderStream(null)} className="text-[10px] font-black underline uppercase hover:bg-transparent text-primary">Reset Stream</Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGeneratePathfinderQuiz(track)}
                        className="p-6 rounded-[2rem] border border-white/40 bg-white/60 text-left hover:border-primary/50 hover:shadow-2xl transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                           <Target className="w-16 h-16" />
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:brand-gradient transition-all">
                          <Zap className="w-5 h-5 text-primary group-hover:text-white" />
                        </div>
                        <h4 className="font-black text-lg text-foreground mb-1 leading-tight group-hover:text-primary transition-colors">{track}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary/60 transition-colors">Generate 30-Question Test</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Legacy/Pre-existing Quizzes */}
          {quizzes.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-primary" /> Curated Assessments
              </h2>
              <div className="bento-grid">
                  {quizzes.map((q, i) => (
                    <motion.button 
                      key={q.id as number} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => loadQuiz(q.id as number)}
                      className="bento-item text-left group hover:bg-primary/5 border-white/5 hover:border-primary/40 p-8"
                    >
                      <div className="flex items-center justify-between mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/40 transition-colors">
                              <BookOpen className="text-primary w-6 h-6" />
                          </div>
                          <ArrowRight className="text-gray-700 group-hover:text-primary transition-colors group-hover:translate-x-2" />
                      </div>
                      <h3 className="text-xl font-black mb-1 group-hover:text-primary transition-colors">{q.title as string}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Subject: {q.category as string}</p>
                    </motion.button>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* Loading Overlay for Generation */}
        <AnimatePresence>
          {isGeneratingQuiz && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-[100] flex items-center justify-center p-8"
            >
               <div className="text-center space-y-8 max-w-sm">
                  <div className="w-24 h-24 rounded-[2rem] brand-gradient flex items-center justify-center shadow-[0_0_50px_rgba(124,58,237,0.4)] mx-auto relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      <Loader2 className="w-12 h-12 animate-spin text-white relative z-10" />
                  </div>
                  <div className="space-y-3">
                      <h3 className="text-3xl font-black uppercase text-white tracking-tighter">Architecting Quiz</h3>
                      <p className="text-gray-400 font-medium italic text-sm">Deep AI is synthesizing 30 specialized questions to scientifically analyze your potential in this track...</p>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        className="h-full brand-gradient"
                        animate={{ width: ["10%", "95%"] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (step === "result") {
    return (
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-[4rem] p-12 text-center max-w-2xl border-orange-500/30 shadow-[0_0_100px_rgba(249,115,22,0.15)] bg-gradient-to-br from-orange-50 to-white"
        >
          <div className="w-24 h-24 rounded-3xl bg-orange-500 flex items-center justify-center shadow-2xl mx-auto mb-8 animate-float">
             <GraduationCap className="text-white w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase text-foreground">Pathway Identified</h2>
          <p className="text-orange-600 font-black uppercase tracking-[0.3em] text-[10px] mb-8 italic">AI Neural Analysis Result</p>
          
          <div className="bg-white rounded-[2.5rem] p-10 border border-orange-100 mb-10 shadow-sm border-l-[12px] border-l-orange-500 text-left">
              <span className="text-[10px] text-orange-600 font-black uppercase tracking-[0.3em] block mb-3 opacity-60">Architectural Recommendation</span>
              <h3 className="text-4xl font-black text-foreground italic mb-4 leading-tight">"{result?.courseName}"</h3>
              <p className="text-gray-500 font-medium leading-relaxed italic border-t border-orange-100/50 pt-4 mb-6">
                {result?.description}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Target className="w-4 h-4 text-orange-500" /> Primary Industry: <span className="text-foreground">{result?.industry}</span>
              </div>
          </div>

          <Link to="/dashboard" className="block">
              <Button size="lg" className="w-full h-20 rounded-2xl bg-orange-500 hover:bg-orange-600 font-black text-2xl shadow-2xl shadow-orange-500/20 active:scale-95 transition-all text-white">
                  ACTIVATE PATHWAY
              </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> AI Recommendation Protocol
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase">{quizMeta.title}</h1>
        <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-sm italic">{quizMeta.category}</p>
      </section>

      <div className="space-y-8">
        {questions.map((q, idx) => (
          <motion.div 
            key={q.questionId} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card rounded-[2.5rem] p-8 border border-white/5 hover:border-primary/40 transition-all shadow-xl group bg-white/60"
          >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-primary group-hover:brand-gradient group-hover:text-white transition-all">
                    {idx + 1}
                </div>
                <div>
                   <h3 className="font-black text-lg leading-tight uppercase tracking-tight">{q.title}</h3>
                   <p className="text-[10px] uppercase font-black tracking-widest text-gray-600 mt-1">Domain: {q.category}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((o) => (
                <label 
                    key={o.optionId} 
                    className="relative group cursor-pointer"
                >
                  <input 
                    type="radio" 
                    name={`rq-${q.questionId}`} 
                    checked={answers[q.questionId] === o.optionId}
                    onChange={() => setAnswers({ ...answers, [q.questionId]: o.optionId })} 
                    className="hidden" 
                  />
                  <div className={`px-6 py-5 rounded-2xl border font-bold text-sm transition-all duration-300 flex items-center justify-between overflow-hidden shadow-sm ${
                    answers[q.questionId] === o.optionId 
                        ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10" 
                        : "bg-white/40 border-white/5 hover:border-white/20 text-gray-500"
                  }`}>
                    <span>{o.text}</span>
                    {answers[q.questionId] === o.optionId && <Zap className="w-4 h-4 fill-primary" />}
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col items-center pt-10">
        <Button 
            onClick={submit} 
            disabled={loading}
            className="h-24 px-20 rounded-[3rem] brand-gradient font-black text-3xl shadow-2xl glow-primary active:scale-95 transition-all group text-white italic"
        >
          {loading ? (
            <><Loader2 className="w-10 h-10 animate-spin" /></>
          ) : (
            <div className="flex items-center gap-5 uppercase tracking-tighter">
                FINALIZE ANALYSIS <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            </div>
          )}
        </Button>
      </div>

      <AnimatePresence>
      {loading && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center z-[100]"
        >
          <div className="text-center space-y-6 max-w-sm px-8">
            <div className="w-24 h-24 rounded-[2rem] brand-gradient flex items-center justify-center shadow-[0_0_50px_rgba(124,58,237,0.5)] mx-auto">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase text-white tracking-widest">Synthesizing Profile...</h3>
                <p className="text-gray-400 font-medium italic text-xs">Our AI is mapping your quiz performance to the global career ontology to identify your ideal destination.</p>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
