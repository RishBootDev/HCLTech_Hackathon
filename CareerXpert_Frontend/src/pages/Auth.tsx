import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, mentorApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  User, 
  Users, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  Compass, 
  Sparkles, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Eye, 
  EyeOff, 
  Github, 
  Chrome,
  ArrowRight,
  Calendar,
  Star,
  Tag,
  Cpu,
  School,
  Hash,
  CheckCircle2
} from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [userType, setUserType] = useState<"student" | "mentor">("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Student Signup state
  const [studentSignup, setStudentSignup] = useState({
    fullName: "", email: "", password: "", phoneNumber: "", gender: "",
    dateOfBirth: "", location: "", educationLevel: "", stream: "", schoolDetails: "", preference: "", interests: "", skills: "",
  });

  // Mentor Signup state
  const [mentorSignup, setMentorSignup] = useState({
    name: "", email: "", password: "", phone: "", jobRole: "", specialization: "", experience: "", description: "", requiredCredits: 100,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(loginEmail, loginPassword);
      login(res.token, res.user);
      toast({ 
        title: "Welcome back!", 
        description: `Successfully authenticated as ${res.user.fullName}`,
      });
      navigate("/dashboard");
    } catch {
      toast({ 
        title: "Authentication Failed", 
        description: "Please check your credentials and try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (userType === "student") {
        if (!studentSignup.fullName || !studentSignup.email || !studentSignup.password) {
          throw new Error("Required fields missing");
        }
        await authApi.signup({ ...studentSignup, credit: 100 });
      } else {
        if (!mentorSignup.name || !mentorSignup.email || !mentorSignup.password || !mentorSignup.jobRole || !mentorSignup.phone || !mentorSignup.specialization) {
          throw new Error("Required fields missing");
        }
        const payload = {
          name: mentorSignup.name,
          phone: mentorSignup.phone,
          jobRole: mentorSignup.jobRole,
          specialization: mentorSignup.specialization,
          experience: Number(mentorSignup.experience),
          description: mentorSignup.description,
          requiredCredits: Number(mentorSignup.requiredCredits),
          user: {
            email: mentorSignup.email,
            password: mentorSignup.password,
          },
        };
        await mentorApi.register(payload);
      }
      toast({ 
        title: "Account Created Successfully", 
        description: "Welcome to CareerXpert! You can now log in.",
      });
      setIsLogin(true);
    } catch (err) {
      toast({ 
        title: "Registration Failed", 
        description: (err as Error).message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Animated Colorful Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-400/30 to-amber-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-br from-yellow-400/25 to-orange-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-br from-amber-400/30 to-yellow-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-br from-rose-400/20 to-pink-300/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-teal-400/15 to-emerald-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(251, 146, 60, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(251, 146, 60, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            animation: 'patternMove 30s linear infinite'
          }} />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        {/* Subtle Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-300/30 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-yellow-300/25 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 group z-50">
        <div className="w-10 h-10 brand-gradient text-white rounded-xl flex items-center justify-center shadow-lg glow-orange group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-current" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">CareerXpert</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-6xl glass-card rounded-[2rem] overflow-hidden flex flex-col lg:flex-row min-h-[600px] md:min-h-[760px] shadow-2xl glow-orange relative z-10 border-2 border-orange-100/50"
      >
        {/* Left Side: Illustration / Brand Visual */}
        <div className="lg:w-[45%] relative p-8 md:p-12 flex flex-col justify-between items-start text-white overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 group">
          {/* Background Image with overlay */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-[15000ms]" />
          
          {/* Enhanced Gradient overlay with colors */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/98 via-orange-900/30 to-amber-900/20 pointer-events-none" />
          
          {/* Animated accent glow */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-amber-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10 space-y-8 w-full mt-8 lg:mt-0">
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2, duration: 0.5 }}
               className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 backdrop-blur-md border border-orange-400/30 flex items-center justify-center shadow-lg glow-orange"
            >
                <Compass className="text-orange-300 w-7 h-7" />
            </motion.div>
            
            <div className="space-y-4">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight"
              >
                  Find your true <br /> career potential.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-slate-300 font-medium text-lg leading-relaxed max-w-sm"
              >
                Join thousands of students connecting with world-class mentors to build their future.
              </motion.p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-6 w-full mt-12 lg:mt-0">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.5, duration: 0.5 }}
               className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 w-full max-w-sm"
             >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white flex items-center justify-center overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+44}`} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                      ))}
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Trusted by 10,000+ top mentors
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Industry Experts
                </div>
             </motion.div>
          </div>
        </div>

        {/* Right Side: Authentication Forms */}
        <div className="flex-1 p-6 md:p-12 lg:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-md w-full mx-auto lg:max-w-xl">
            <div className="mb-8 text-center lg:text-left">
              <motion.h2 
                layout
                className="text-3xl font-bold text-slate-900 tracking-tight mb-2"
              >
                {isLogin ? "Welcome back" : "Create an account"}
              </motion.h2>
              <motion.p layout className="text-slate-500 mb-6">
                {isLogin ? "Enter your details to access your account." : "Register to start your career journey."}
              </motion.p>
              
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                 <button 
                  type="button"
                  onClick={() => setUserType("student")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all gap-2 flex items-center ${userType === "student" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                 >
                   <GraduationCap className="w-4 h-4" /> Student
                 </button>
                 <button 
                  type="button"
                  onClick={() => setUserType("mentor")}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all gap-2 flex items-center ${userType === "mentor" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                 >
                   <Briefcase className="w-4 h-4" /> Mentor
                 </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin} 
                  className="space-y-4 w-full"
              >
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="name@example.com" 
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)} 
                      required 
                      className="h-12 pl-10 rounded-xl bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-slate-700">Password</Label>
                    <button type="button" className="text-sm font-medium text-primary hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)} 
                      required 
                      className="h-12 pl-10 pr-10 rounded-xl bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-sm active:scale-[0.98] transition-all mt-6" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </Button>

                <div className="relative py-6">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-sm font-medium text-slate-500 bg-transparent">
                    <span className="bg-white px-2">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" type="button" className="h-12 rounded-xl border-slate-200 text-slate-700 font-medium hover:bg-slate-50 gap-2">
                    <Chrome className="w-5 h-5 text-[#4285F4]" /> Google
                  </Button>
                  <Button variant="outline" type="button" className="h-12 rounded-xl border-slate-200 text-slate-700 font-medium hover:bg-slate-50 gap-2">
                    <Github className="w-5 h-5 text-slate-900" /> GitHub
                  </Button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignup} 
                  className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar w-full"
              >
                {userType === "student" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="John Doe" value={studentSignup.fullName} onChange={(e) => setStudentSignup({ ...studentSignup, fullName: e.target.value })} required className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input type="email" placeholder="john@example.com" value={studentSignup.email} onChange={(e) => setStudentSignup({ ...studentSignup, email: e.target.value })} required className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input type="password" placeholder="••••••••" value={studentSignup.password} onChange={(e) => setStudentSignup({ ...studentSignup, password: e.target.value })} required className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="(555) 123-4567" value={studentSignup.phoneNumber} onChange={(e) => setStudentSignup({ ...studentSignup, phoneNumber: e.target.value })} className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="City, Country" value={studentSignup.location} onChange={(e) => setStudentSignup({ ...studentSignup, location: e.target.value })} className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                     <div className={`${studentSignup.educationLevel === "Class 12" ? "md:col-span-1" : "md:col-span-2"} space-y-2 transition-all duration-300`}>
                      <Label className="text-sm font-medium text-slate-700">Education Level *</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        <select 
                          value={studentSignup.educationLevel} 
                          onChange={(e) => setStudentSignup({ ...studentSignup, educationLevel: e.target.value, stream: e.target.value === "Class 10" ? "" : studentSignup.stream })}
                          className="w-full h-12 pl-10 rounded-xl bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none border outline-none font-medium"
                          required
                        >
                          <option value="">Select Level</option>
                          <option value="Class 10">Class 10</option>
                          <option value="Class 12">Class 12</option>
                        </select>
                      </div>
                    </div>

                    {studentSignup.educationLevel === "Class 12" && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-2"
                      >
                        <Label className="text-sm font-medium text-slate-700">Academic Stream *</Label>
                        <div className="relative">
                          <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                          <select 
                            value={studentSignup.stream} 
                            onChange={(e) => setStudentSignup({ ...studentSignup, stream: e.target.value })}
                            className="w-full h-12 pl-10 rounded-xl bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none border outline-none font-medium"
                            required
                          >
                            <option value="">Select Stream</option>
                            <option value="PCM">PCM (Science)</option>
                            <option value="PCB">PCB (Science)</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Arts">Humanities / Arts</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Institution</Label>
                      <div className="relative">
                        <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="High School or University Name" value={studentSignup.schoolDetails} onChange={(e) => setStudentSignup({ ...studentSignup, schoolDetails: e.target.value })} className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Gender</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        <select 
                          value={studentSignup.gender} 
                          onChange={(e) => setStudentSignup({ ...studentSignup, gender: e.target.value })}
                          className="w-full h-12 pl-10 rounded-xl bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none border outline-none font-medium"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input type="date" value={studentSignup.dateOfBirth} onChange={(e) => setStudentSignup({ ...studentSignup, dateOfBirth: e.target.value })} className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Career Preferences</Label>
                      <div className="relative">
                        <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="E.g. Software Engineer, Doctor" value={studentSignup.preference} onChange={(e) => setStudentSignup({ ...studentSignup, preference: e.target.value })} className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Interests</Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="Coding, Reading, Sports" value={studentSignup.interests} onChange={(e) => setStudentSignup({ ...studentSignup, interests: e.target.value })} className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Skills</Label>
                      <div className="relative">
                        <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="Python, Public Speaking" value={studentSignup.skills} onChange={(e) => setStudentSignup({ ...studentSignup, skills: e.target.value })} className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="md:col-span-2 pt-2">
                       <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all" disabled={loading}>
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="Dr. Jane Smith" value={mentorSignup.name} onChange={(e) => setMentorSignup({ ...mentorSignup, name: e.target.value })} required className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input type="email" placeholder="jane@expert.com" value={mentorSignup.email} onChange={(e) => setMentorSignup({ ...mentorSignup, email: e.target.value })} required className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input type="password" placeholder="••••••••" value={mentorSignup.password} onChange={(e) => setMentorSignup({ ...mentorSignup, password: e.target.value })} required className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="(555) 123-4567" value={mentorSignup.phone} onChange={(e) => setMentorSignup({ ...mentorSignup, phone: e.target.value })} required className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Current Job Title *</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input placeholder="Senior Engineer at Google" value={mentorSignup.jobRole} onChange={(e) => setMentorSignup({ ...mentorSignup, jobRole: e.target.value })} required className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Specialization *</Label>
                      <Input placeholder="E.g. Web Development" value={mentorSignup.specialization} onChange={(e) => setMentorSignup({ ...mentorSignup, specialization: e.target.value })} required className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Years of Experience</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input type="number" placeholder="5" value={mentorSignup.experience} onChange={(e) => setMentorSignup({ ...mentorSignup, experience: e.target.value })} className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Required Credits</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input type="number" placeholder="100" value={mentorSignup.requiredCredits} onChange={(e) => setMentorSignup({ ...mentorSignup, requiredCredits: Number(e.target.value) })} className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium" />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Bio</Label>
                      <textarea 
                        placeholder="Tell students about your background..." 
                        value={mentorSignup.description} 
                        onChange={(e) => setMentorSignup({ ...mentorSignup, description: e.target.value })} 
                        className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 text-slate-900 border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none border font-medium"
                      />
                    </div>
                    <div className="md:col-span-2 pt-2">
                       <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base transition-all" disabled={loading}>
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
                       </Button>
                    </div>
                  </div>
                )}
              </motion.form>
            )}
            </AnimatePresence>

            <motion.div 
              layout
              className="mt-6 text-center"
            >
               <p className="text-slate-600 font-medium text-sm flex flex-wrap justify-center items-center gap-1">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button 
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setShowPassword(false);
                      }} 
                      className="text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                      {isLogin ? "Sign up" : "Log in"}
                  </button>
               </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
