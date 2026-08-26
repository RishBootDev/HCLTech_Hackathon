import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { quizApi, profileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Trophy, ArrowRight, Zap, Target, Sparkles, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NormalizedQ {
  questionId: number;
  title: string;
  category: string;
  options: { optionId: number; text: string }[];
  correctOptionId: number | null;
  correctOptionText: string | null;
}

export default function TakeQuiz() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isPathfinder = searchParams.get("pathfinder") === "true";
  
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<NormalizedQ[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizCategory, setQuizCategory] = useState("");
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<string, any>[] | null>(null);
  const [pathfinderResult, setPathfinderResult] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/auth"); return; }
    if (!id) return;
    quizApi.getById(Number(id)).then((raw) => {
      setQuizTitle((raw.title as string) || "Quiz Session");
      setQuizCategory((raw.category as string) || "General Knowledge");
      const rawQ = (raw.questions || raw.questionList || []) as Array<Record<string, unknown>>;
      setQuestions(rawQ.map((q, i) => normalizeQuestion(q, i, (raw.category as string) || (q.category as string))));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, isLoggedIn, navigate]);

  const normalizeQuestion = (raw: Record<string, unknown>, index: number, fallbackCat: string): NormalizedQ => {
    const qid = (raw.id ?? raw.questionId ?? raw.qid ?? index + 1) as number;
    const title = (raw.title ?? raw.questionTitle ?? raw.question_text ?? "") as string;
    const category = (raw.category ?? fallbackCat ?? "") as string;
    const options: { optionId: number; text: string }[] = [];
    ["option1", "option2", "option3", "option4"].forEach((f, i) => {
      if (raw[f]) options.push({ optionId: i + 1, text: String(raw[f]) });
    });
    if (options.length === 0 && Array.isArray(raw.options)) {
      (raw.options as any[]).forEach((o, i) => options.push({ optionId: o.optionId ?? i + 1, text: o.text || String(o) }));
    }
    return { 
      questionId: qid, 
      title, 
      category, 
      options, 
      correctOptionId: (raw.correctOptionId as number) || null,
      correctOptionText: (raw.rightAnswer as string) || (raw.correctAnswer as string) || null
    };
  };

  const submit = async () => {
    setSubmitting(true);
    const answers = questions.map((q) => ({
      questionId: q.questionId,
      selectedOption: selected[q.questionId] || null,
    }));
    try {
      const result = await quizApi.submitResult(user!.id, {
        quizId: Number(id),
        quiztitle: quizTitle,
        quizCategory,
        answers,
      });
      const ansArr = (result.answers || result.answerList || []) as Record<string, any>[];
      setResults(ansArr);

      if (isPathfinder) {
        // Construct detailed payload for pathfinder recommendation
        const detailedPayload = {
          quizId: Number(id),
          quizTitle,
          quizCategory,
          userProfileId: user!.id,
          answers: questions.map(q => {
            const resQ = ansArr.find(a => a.questionId === q.questionId);
            const selText = selected[q.questionId];
            const selOpt = q.options.find(o => o.text === selText);
            
            return {
              questionId: q.questionId,
              questionText: q.title,
              category: q.category,
              options: q.options,
              correctOptionId: resQ?.correctOptionId || q.correctOptionId,
              correctOptionText: resQ?.correctOptionText || q.correctOptionText,
              selectedOptionId: selOpt?.optionId || null,
              selectedOptionText: selText || null,
              isAttempted: !!selText,
            };
          })
        };
        const pathRec = await profileApi.submitForCourse(user!.id, detailedPayload);
        setPathfinderResult(pathRec);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Error submitting quiz results");
    } finally {
      setSubmitting(false);
    }
  };

  const getResultForQ = (qid: number) => results?.find((a) => a.questionId === qid);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );

  const score = results ? results.filter((a) => a.isCorrect || a.correct).length : 0;
  const total = results?.length || 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Quiz Header Area */}
      <section className="text-center space-y-4">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
              isPathfinder ? "bg-orange-500/10 border-orange-500/20 text-orange-600" : "bg-primary/10 border-primary/20 text-primary"
            }`}
        >
            {isPathfinder ? <Sparkles className="w-3 h-3" /> : <Target className="w-3 h-3" />} 
            {isPathfinder ? "AI Career Pathfinder" : "Assessment in Progress"}
        </motion.div>
        <h1 className="text-5xl font-black tracking-tighter uppercase text-foreground">{quizTitle}</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-sm italic">{quizCategory}</p>
      </section>

      {/* Results Overview */}
      <AnimatePresence>
        {results && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden space-y-6"
          >
            {/* Recommendation Card for Pathfinder */}
            {isPathfinder && pathfinderResult && (
              <div className="rounded-[3rem] p-10 border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="w-32 h-32 text-orange-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg">
                      <GraduationCap className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">AI Target Path Identified</p>
                      <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Your Future Track</h2>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 border border-orange-100 mb-8 border-l-[12px] border-l-orange-500">
                    <h3 className="text-4xl font-black text-orange-600 italic mb-4">"{pathfinderResult.courseName}"</h3>
                    <p className="text-foreground/70 font-medium leading-relaxed max-w-2xl">{pathfinderResult.description}</p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4" /> Recommended Industry: <span className="text-foreground">{pathfinderResult.industry}</span>
                  </p>
                </div>
              </div>
            )}

            <div className={`glass-card rounded-[3rem] p-10 border-primary/20 flex flex-col md:flex-row items-center gap-12 bg-white/60 mb-12 shadow-2xl ${isPathfinder ? 'border-t-0' : ''}`}>
               <div className="relative">
                  <div className="w-40 h-40 rounded-full border-[8px] border-primary/10 flex items-center justify-center relative">
                     <span className="text-4xl font-black text-foreground">{percentage}%</span>
                     <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle 
                            cx="80" cy="80" r="72" 
                            fill="transparent" stroke="currentColor" strokeWidth="8"
                            className="text-primary"
                            strokeDasharray={`${(percentage / 100) * 452} 452`}
                        />
                     </svg>
                  </div>
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center shadow-2xl animate-bounce">
                     <Trophy className="text-white w-6 h-6 fill-white" />
                  </div>
               </div>
               
               <div className="flex-1 space-y-6 text-center md:text-left">
                  <div>
                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Assessment Finalized</h2>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Global Intelligence Report</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-green-50 rounded-2xl p-4 border border-green-100 text-center">
                        <div className="text-[10px] text-green-600 font-black uppercase mb-1">Correct</div>
                        <div className="text-xl font-black text-green-700">{score}</div>
                     </div>
                     <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-center">
                        <div className="text-[10px] text-red-600 font-black uppercase mb-1">Wrong</div>
                        <div className="text-xl font-black text-red-700">{total - score}</div>
                     </div>
                     <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
                        <div className="text-[10px] text-blue-600 font-black uppercase mb-1">Attempt</div>
                        <div className="text-xl font-black text-blue-700">{total}</div>
                     </div>
                  </div>

                  <Link to="/dashboard">
                    <Button className="w-full h-14 rounded-2xl brand-gradient font-black text-lg glow-primary text-white shadow-lg">RETURN TO MISSION CONTROL</Button>
                  </Link>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions Area */}
      <div className="space-y-8">
        {questions.map((q, idx) => {
          const r = getResultForQ(q.questionId);
          const isCorrect = r ? (r.isCorrect || r.correct) : null;
          
          return (
            <motion.div
              key={q.questionId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card rounded-[2.5rem] p-8 border border-border transition-all duration-500 overflow-hidden relative bg-white/60 ${
                r ? (isCorrect ? "border-green-300 bg-green-50 shadow-[0_0_30px_rgba(34,197,94,0.05)]" : "border-red-300 bg-red-50 shadow-[0_0_30px_rgba(239,68,68,0.05)]") : "hover:border-primary/40 shadow-xl"
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                     r ? (isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white") : "bg-primary/10 text-primary"
                   }`}>
                      {idx + 1}
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Section Alpha • Part {idx + 1}</div>
                </div>
                
                {r && (
                   <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                     isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                   }`}>
                     {isCorrect ? <><CheckCircle className="w-3 h-3" /> VERIFIED CORRECT</> : <><XCircle className="w-3 h-3" /> DISCREPANCY DETECTED</>}
                   </div>
                )}
              </div>

              <h3 className="text-xl font-black mb-8 leading-tight text-foreground uppercase tracking-tight">{q.title}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt) => {
                  const isSelected = selected[q.questionId] === opt.text;
                  const isAnsCorrect = r?.correctOptionText === opt.text || r?.correctOptionId === opt.optionId;
                  
                  return (
                    <label 
                        key={opt.optionId} 
                        className={`relative group cursor-pointer transition-all duration-300 ${results ? "cursor-default" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.questionId}`}
                        value={opt.text}
                        checked={isSelected}
                        onChange={() => !results && setSelected({ ...selected, [q.questionId]: opt.text })}
                        disabled={!!results}
                        className="hidden"
                      />
                      <div className={`px-6 py-5 rounded-2xl border font-bold text-sm transition-all duration-300 flex items-center justify-between overflow-hidden shadow-sm ${
                        isSelected 
                            ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5" 
                            : r && isAnsCorrect
                                ? "bg-green-100 border-green-400 text-green-700 shadow-sm"
                                : "bg-muted/30 border-border hover:border-primary/30 text-muted-foreground"
                      }`}>
                        <span>{opt.text}</span>
                        {isSelected && <Zap className="w-4 h-4 fill-primary" />}
                        {r && isAnsCorrect && !isSelected && <CheckCircle className="w-4 h-4" />}
                      </div>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Submission Footer */}
      {!results && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center space-y-4 pt-10"
        >
            <Button 
                onClick={submit} 
                disabled={submitting} 
                className="h-20 px-16 rounded-[2.5rem] brand-gradient font-black text-2xl shadow-2xl glow-primary active:scale-95 transition-all group text-white"
            >
                {submitting ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                    <div className="flex items-center gap-4 uppercase tracking-tighter">
                        Finish Assessment <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </div>
                )}
            </Button>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Double check your answers before final submission</p>
        </motion.div>
      )}
    </div>
  );
}
