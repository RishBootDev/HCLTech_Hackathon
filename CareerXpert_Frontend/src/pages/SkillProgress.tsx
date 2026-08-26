import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, skillProgressApi, smartLearnApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Trophy, Zap, Target, TrendingUp, Plus,
  ChevronRight, Star, BookOpen, BarChart2, CheckCircle2,
  Circle, Trash2, RefreshCw, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SkillProgress {
  id: number;
  skillName: string;
  category: string;
  masteryScore: number;
  totalAttempts: number;
  passedAttempts: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "MASTERED";
  lastPracticedAt: string;
}

const STATUS_CONFIG = {
  MASTERED: { label: "Mastered", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: TrendingUp },
  NOT_STARTED: { label: "Not Started", color: "text-zinc-400", bg: "bg-zinc-50", border: "border-zinc-200", icon: Circle },
};

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-blue-500" : "bg-orange-400";

const CATEGORIES = ["Programming", "Data Science", "Design", "Communication", "Leadership", "DevOps", "AI/ML", "Other"];

export default function SkillProgressPage() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<number | null>(null);
  const [skills, setSkills] = useState<SkillProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "mastered" | "in-progress">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillProgress | null>(null);
  const [savingSkill, setSavingSkill] = useState(false);

  const [newSkill, setNewSkill] = useState({ skillName: "", category: "Programming", masteryScore: 20 });

  // Quiz Assessment States
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    const init = async () => {
      if (!user?.email) return;
      try {
        const p = await profileApi.getByEmail(user.email) as { id: number };
        setProfileId(p.id);
        await loadSkills(p.id, "all");
      } catch {
        toast({ title: "Error", description: "Failed to load skill data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const loadSkills = async (pId: number, tab: typeof activeTab) => {
    setLoading(true);
    try {
      let data: any[];
      if (tab === "mastered") data = await skillProgressApi.getMastered(pId);
      else if (tab === "in-progress") data = await skillProgressApi.getInProgress(pId);
      else data = await skillProgressApi.getAll(pId);
      setSkills(data as SkillProgress[]);
    } catch {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (profileId) await loadSkills(profileId, tab);
  };

  const handleAddSkill = async () => {
    if (!profileId || !newSkill.skillName.trim()) return;
    setSavingSkill(true);
    try {
      await skillProgressApi.updateSkill(profileId, newSkill.skillName, newSkill.category, newSkill.masteryScore);
      toast({ title: "Skill Added!", description: `${newSkill.skillName} tracked successfully.` });
      setIsAddOpen(false);
      setNewSkill({ skillName: "", category: "Programming", masteryScore: 20 });
      await loadSkills(profileId, activeTab);
    } catch {
      toast({ title: "Error", description: "Failed to add skill.", variant: "destructive" });
    } finally {
      setSavingSkill(false);
    }
  };

  const startAssessment = async (skill: SkillProgress) => {
    setSelectedSkill(skill);
    setQuizLoading(true);
    setIsQuizOpen(true);
    setQuizFinished(false);
    setCurrentQuestion(0);
    setAnswers([]);
    
    try {
      const resp = await smartLearnApi.generateSkillQuiz(skill.skillName);
      const data = typeof resp === 'string' ? JSON.parse(resp) : resp;
      if (Array.isArray(data) && data.length > 0) {
        setQuizQuestions(data);
      } else {
        throw new Error("Invalid quiz data");
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Quiz Error", description: "Failed to generate AI quiz. Please try again.", variant: "destructive" });
      setIsQuizOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = (optionIdx: number) => {
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
    if (!profileId || !selectedSkill) return;
    setSavingSkill(true);
    
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (finalAnswers[idx] === q.correctAnswer) correctCount++;
    });
    
    const percentage = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizScore(percentage);
    setQuizFinished(true);

    try {
      await smartLearnApi.saveSkillAttempt(profileId, selectedSkill.skillName, percentage);
      toast({ title: "Assessment Complete!", description: `New Mastery Score: ${percentage}%` });
      await loadSkills(profileId, activeTab);
    } catch {
      toast({ title: "Error", description: "Failed to save results.", variant: "destructive" });
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (skill: SkillProgress) => {
    if (!confirm(`Delete progress for "${skill.skillName}"?`)) return;
    try {
      await skillProgressApi.deleteProgress(skill.id);
      toast({ title: "Deleted", description: `${skill.skillName} removed.` });
      if (profileId) await loadSkills(profileId, activeTab);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const masteredCount = skills.filter(s => s.status === "MASTERED").length;
  const inProgressCount = skills.filter(s => s.status === "IN_PROGRESS").length;
  const avgScore = skills.length > 0
    ? Math.round(skills.reduce((acc, s) => acc + s.masteryScore, 0) / skills.length)
    : 0;

  if (loading && !profileId) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">

      {/* Hero Header */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 shadow-2xl shadow-emerald-500/20"
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">Skill Mastery Tracker</p>
            <h1 className="text-3xl font-black text-white tracking-tight">Your Skill Arsenal</h1>
            <p className="text-white/60 text-sm font-medium mt-1">Track mastery scores across all your technical & soft skills</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { icon: Trophy, label: "Mastered", value: masteredCount, sub: "skills" },
              { icon: TrendingUp, label: "In Progress", value: inProgressCount, sub: "skills" },
              { icon: BarChart2, label: "Avg Score", value: `${avgScore}%`, sub: "overall" },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-white min-w-[90px]">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-white/70" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-white/60">{label}</span>
                </div>
                <div className="text-2xl font-black">{value}</div>
                <div className="text-[10px] text-white/50 font-medium">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tabs */}
        <div className="flex bg-zinc-100 rounded-2xl p-1 gap-1">
          {(["all", "mastered", "in-progress"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-black capitalize transition-all ${
                activeTab === tab
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "all" ? "All Skills" : tab === "mastered" ? "✅ Mastered" : "🔄 In Progress"}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 font-bold"
            onClick={() => profileId && loadSkills(profileId, activeTab)}
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                <Plus className="w-4 h-4" /> Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black">Track New Skill</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="skillName" className="font-bold">Skill Name</Label>
                  <Input
                    id="skillName"
                    placeholder="e.g. React, Python, Public Speaking"
                    value={newSkill.skillName}
                    onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-bold">Category</Label>
                  <select
                    id="category"
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Initial Mastery Score: <span className="text-primary">{newSkill.masteryScore}%</span></Label>
                  <input
                    type="range" min={0} max={100}
                    value={newSkill.masteryScore}
                    onChange={(e) => setNewSkill({ ...newSkill, masteryScore: Number(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                </div>
                <Button
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12"
                  onClick={handleAddSkill}
                  disabled={savingSkill || !newSkill.skillName.trim()}
                >
                  {savingSkill ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Skill
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quiz Assessment Modal */}
      <Dialog open={isQuizOpen} onOpenChange={(open) => !savingSkill && !quizLoading && setIsQuizOpen(open)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent shadow-none">
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-emerald-500/20">
            {quizLoading ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-20 h-20 rounded-full brand-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary/20 animate-pulse">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-black text-foreground">Generating AI Quiz...</h3>
                <p className="text-sm text-muted-foreground animate-pulse">Crafting 10 questions for {selectedSkill?.skillName}</p>
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mt-4" />
              </div>
            ) : quizFinished ? (
              <div className="p-10 text-center space-y-6">
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <Trophy className="w-12 h-12 text-emerald-600" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-black text-foreground">Assessment Complete!</h3>
                  <p className="text-muted-foreground font-bold mt-1">You scored {quizScore}% on {selectedSkill?.skillName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Status</p>
                        <p className={`text-sm font-black ${quizScore >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {quizScore >= 80 ? 'MASTERED' : 'IN PROGRESS'}
                        </p>
                    </div>
                     <div className="bg-zinc-50 rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">New Mastery</p>
                        <p className="text-sm font-black text-primary">{quizScore}%</p>
                    </div>
                </div>
                <Button className="w-full rounded-2xl h-14 font-black text-lg brand-gradient text-white" onClick={() => setIsQuizOpen(false)}>
                    Finish Assessment
                </Button>
              </div>
            ) : (
              <div className="flex flex-col h-[550px]">
                {/* Header */}
                <div className="p-6 bg-zinc-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-foreground">{selectedSkill?.skillName} Test</h3>
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
                        onClick={() => handleAnswer(i)}
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
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Skills Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : skills.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 border-2 border-dashed border-border rounded-2xl"
        >
          <Star className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-black text-foreground mb-2">No Skills Tracked Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Start tracking your skills to visualize your growth over time.</p>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black gap-2"
          >
            <Plus className="w-4 h-4" /> Add Your First Skill
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {skills.map((skill, idx) => {
              const cfg = STATUS_CONFIG[skill.status];
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  {/* Skill Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-foreground leading-tight">{skill.skillName}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{skill.category}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${cfg.bg} ${cfg.border} border`}>
                      <StatusIcon className={`w-3 h-3 ${cfg.color}`} />
                      <span className={`text-[9px] font-black uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mastery</span>
                      <span className="text-sm font-black text-foreground">{skill.masteryScore}%</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.masteryScore}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.05 }}
                        className={`h-full rounded-full ${SCORE_COLOR(skill.masteryScore)}`}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: "Attempts", value: skill.totalAttempts, icon: Target },
                      { label: "Passed", value: skill.passedAttempts, icon: Zap },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-zinc-50 rounded-xl p-2.5 flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground">{label}</p>
                          <p className="text-sm font-black text-foreground">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button
                      size="sm"
                      className="flex-1 rounded-xl font-bold text-xs h-8 gap-1 brand-gradient text-white shadow-sm"
                      onClick={() => startAssessment(skill)}
                    >
                      <ChevronRight className="w-3.5 h-3.5" /> Take Test
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-xl h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteSkill(skill)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <p className="text-[9px] text-muted-foreground/60 font-medium mt-2">
                    Last practiced: {new Date(skill.lastPracticedAt).toLocaleDateString()}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
