import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { careerToolsApi } from "@/lib/api";
import { FileText, ArrowLeft, Loader2, Target, CheckCircle, AlertTriangle, Lightbulb, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResumeReview() {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleReview = async () => {
    if (!file) {
      toast({ title: "No file selected", description: "Please upload a resume (PDF/Image) to review.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const data = await careerToolsApi.reviewResume(file, role);
      setAnalysis(data);
      toast({ title: "Analysis Complete", description: "AI has finished reviewing your resume." });
    } catch {
      toast({ title: "Review Failed", description: "There was an error analyzing your resume. Ensure the format is correct.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full mix-blend-multiply pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:text-primary/80 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <header className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-black uppercase tracking-widest mb-4">
                <FileText className="w-4 h-4" /> FAANG-Level Review
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">Smart Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Scanner</span></h1>
            <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">Upload your resume to get instant actionable feedback, AI-driven ATS optimization tips, and gap analysis for your targeted role.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Upload Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="glass-card p-8 rounded-[2rem] border border-border shadow-2xl bg-white">
              <h3 className="text-xl font-black mb-6 text-foreground">Upload Document</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block">Target Role (Optional)</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. Data Scientist" 
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="pl-10 h-14 rounded-2xl bg-muted/50 font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 italic font-medium">Entering a role helps AI tailor the specific missing keywords.</p>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-muted/20"}`}
                >
                  <input 
                    type="file" 
                    id="resume" 
                    className="hidden" 
                    accept="image/*, application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="resume" className="cursor-pointer flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${file ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground shadow-sm"}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm text-foreground mb-1">
                      {file ? file.name : "Click to browser or drag file here"}
                    </span>
                    <span className="text-xs text-muted-foreground">PDF or Images up to 5MB</span>
                  </label>
                </div>

                <Button 
                  onClick={handleReview} 
                  disabled={loading || !file}
                  className="w-full h-14 rounded-2xl brand-gradient text-white font-black shadow-xl shadow-primary/20 mt-4 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Scan & Analyze Resume"}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Analysis Results Section */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] glass-card rounded-[2rem] border border-border border-dashed flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-20 h-20 relative mb-6">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <Activity className="absolute inset-0 m-auto text-primary w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-foreground">Extracting Data...</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-2 max-w-sm">Our AI is parsing your layout, checking keyword density, and comparing against FAANG standards.</p>
                </motion.div>
              ) : analysis ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Score Card */}
                  <div className="glass-card p-8 rounded-[2rem] border border-border bg-white shadow-xl flex items-center gap-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" className="stroke-muted fill-none stroke-[8] opacity-20" />
                        <circle cx="64" cy="64" r="56" className={`stroke-current fill-none stroke-[8] ${(analysis.overallScore || 0) > 75 ? "text-green-500" : (analysis.overallScore || 0) > 50 ? "text-yellow-500" : "text-red-500"}`} strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * (analysis.overallScore || 0)) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-foreground">{analysis.overallScore || 0}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground mb-2">Overall Resume Score</h3>
                      <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
                        {analysis.overallScore > 80 ? "Excellent resume! Highly competitive." : "Good start, but missing key elements to pass ATS effectively."}
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50/50 border border-green-200 p-6 rounded-3xl">
                      <div className="flex items-center gap-2 text-green-700 font-black mb-4 uppercase tracking-widest text-xs">
                        <CheckCircle className="w-4 h-4" /> Key Strengths
                      </div>
                      <ul className="space-y-3">
                        {(analysis.strengths || []).map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-green-900 font-medium leading-relaxed">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50/50 border border-red-200 p-6 rounded-3xl">
                      <div className="flex items-center gap-2 text-red-700 font-black mb-4 uppercase tracking-widest text-xs">
                        <AlertTriangle className="w-4 h-4" /> Missing Elements
                      </div>
                      <ul className="space-y-3">
                        {(analysis.weaknesses || []).map((w: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-900 font-medium leading-relaxed">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* ATS Tips */}
                  <div className="bg-blue-50/50 border border-blue-200 p-6 rounded-3xl">
                    <div className="flex items-center gap-2 text-blue-700 font-black mb-4 uppercase tracking-widest text-xs">
                      <Target className="w-4 h-4" /> ATS Formatting Tip
                    </div>
                    <p className="text-sm font-medium text-blue-900 leading-relaxed bg-white/60 p-4 rounded-xl shadow-sm">
                      {analysis.atsOptimization || "Ensure you are using standard readable fonts and removing complex tables to pass standard parsing systems safely."}
                    </p>
                  </div>

                  {/* Actionable Advice */}
                  <div className="glass-card bg-white p-6 rounded-3xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-700 font-black mb-4 uppercase tracking-widest text-xs">
                      <Lightbulb className="w-4 h-4" /> AI Recommendations
                    </div>
                    <ul className="space-y-4">
                      {(analysis.actionableTips || []).map((tip: string, i: number) => (
                        <li key={i} className="text-sm font-semibold text-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-xl font-black uppercase tracking-tighter">Awaiting Document</h3>
                  <p className="font-medium text-sm mt-2 max-w-xs">Upload your resume and enter a target role to generate a comprehensive AI review.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
