import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { careerToolsApi } from "@/lib/api";
import { Mic, ArrowRight, ArrowLeft, Loader2, Sparkles, User, BadgeAlert, Code, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MockInterview() {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("Entry Level");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const handleGenerate = async () => {
    if (!role.trim()) {
      toast({ title: "Role required", description: "Please enter a role (e.g., Software Engineer, Data Analyst, etc.)" });
      return;
    }
    
    setLoading(true);
    try {
      let data = await careerToolsApi.generateMockInterview(role, experience);
      
      // AI sometimes wraps the array in an object like { "questions": [...] }
      if (data && !Array.isArray(data) && typeof data === 'object') {
        const potentialArray = (data as any).questions || Object.values(data).find(Array.isArray);
        if (potentialArray) {
          data = potentialArray;
        }
      }

      const finalQuestions = Array.isArray(data) ? data : [];
      setQuestions(finalQuestions);
      setActiveQuestion(0);
      setShowHint(false);
      
      if (finalQuestions.length > 0) {
        toast({ title: "Questions Ready!", description: "AI generated realistic interview scenarios for you." });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      toast({ title: "Generation Failed", description: "Could not generate questions. Please try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:text-primary/80 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <header className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 text-xs font-black uppercase tracking-widest mb-4">
                <Sparkles className="w-4 h-4" /> Next-Gen AI Feature
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">AI Mock Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-primary">Simulator</span></h1>
            <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">Generate hyper-realistic technical and behavioral interview scenarios tailored to your target job profile.</p>
        </header>

        {questions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 md:p-12 rounded-[2.5rem] border border-border shadow-2xl max-w-2xl mx-auto relative overflow-hidden"
          >
            <div className="flex flex-col gap-6 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Target Role / Designation</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Full Stack Developer, Product Manager..." 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="pl-12 h-16 rounded-2xl bg-white text-lg font-bold shadow-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Experience Level</label>
                <select 
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full h-16 rounded-2xl bg-white border border-border px-4 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Entry Level">Entry Level (0-2 years)</option>
                  <option value="Mid Level">Mid Level (3-5 years)</option>
                  <option value="Senior Level">Senior Level (5+ years)</option>
                </select>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="w-full h-16 rounded-2xl brand-gradient text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center gap-3 mt-4"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
                {loading ? "Generating Scenarios..." : "Start Simulation"}
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Scenario {activeQuestion + 1} of {questions.length}
              </div>
              <div className="flex items-center gap-2">
                {questions.map((_, i) => (
                  <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === activeQuestion ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"}`} />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={activeQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-8 md:p-12 rounded-[2.5rem] border border-border shadow-xl bg-white"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-black uppercase tracking-widest text-xs mb-8">
                  {questions[activeQuestion]?.type === "Technical" ? <Code className="w-4 h-4" /> : <BadgeAlert className="w-4 h-4" />}
                  {questions[activeQuestion]?.type} Round
                </div>
                
                <h2 className="text-2xl md:text-3xl font-black text-foreground mb-10 leading-relaxed shadow-sm p-6 bg-muted/30 rounded-3xl border border-muted">
                  "{questions[activeQuestion]?.question}"
                </h2>

                <div className="space-y-4">
                  {!showHint ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowHint(true)}
                      className="rounded-2xl h-14 w-full md:w-auto px-8 font-bold text-primary border-primary/20 hover:bg-primary/5"
                    >
                      <Sparkles className="w-4 h-4 mr-2" /> Show AI Hint & Keywords
                    </Button>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-purple-500/5 border border-purple-500/20 rounded-3xl p-6 text-purple-900"
                    >
                      <p className="font-semibold italic mb-4">💡 {questions[activeQuestion]?.hint}</p>
                      <div>
                        <p className="text-xs uppercase tracking-widest font-black text-purple-500 mb-2">Target Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {(questions[activeQuestion]?.expectedKeywords || []).map((kw: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-white border border-purple-100 rounded-lg text-xs font-bold text-purple-700 flex items-center gap-1 shadow-sm">
                              <CheckCircle2 className="w-3 h-3 text-green-500" /> {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center px-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                   setActiveQuestion(Math.max(0, activeQuestion - 1));
                   setShowHint(false);
                }}
                disabled={activeQuestion === 0}
                className="rounded-xl font-bold"
              >
                Previous
              </Button>
              <Button 
                onClick={() => {
                   if (activeQuestion < questions.length - 1) {
                     setActiveQuestion(activeQuestion + 1);
                     setShowHint(false);
                   } else {
                     toast({ title: "Simulation Complete", description: "Great job! Keep practicing." });
                     setQuestions([]);
                   }
                }}
                className="rounded-xl font-bold brand-gradient px-8 text-white shadow-lg shadow-primary/20"
              >
                {activeQuestion < questions.length - 1 ? "Next Scenario" : "Finish Review"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
