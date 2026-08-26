import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { BookOpen, Brain, Trophy, Users, CheckCircle, Star, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const tracks = [
  { 
    title: "B.Tech Roadmap", 
    desc: "Semester-wise subjects, coding + core, internships, projects, and placement prep.", 
    modules: 8, 
    learners: "300k+", 
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60"
  },
  { 
    title: "BBA Roadmap", 
    desc: "Business fundamentals, analytics, marketing, finance basics, and interview readiness.", 
    modules: 6, 
    learners: "120k+", 
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60"
  },
  { 
    title: "Class 12 Boards + Career", 
    desc: "Smart notes, PYQs, quizzes; career options and college roadmap guidance.", 
    modules: 7, 
    learners: "350k+", 
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60"
  },
  { 
    title: "Class 10 Foundation", 
    desc: "Strong fundamentals, stream selection help, aptitude + reasoning practice.", 
    modules: 5, 
    learners: "200k+", 
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60"
  },
  { 
    title: "Government Exams", 
    desc: "SSC, Banking, Railways syllabus-wise modules, mocks, and strategy sessions.", 
    modules: 6, 
    learners: "160k+", 
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=60"
  },
  { 
    title: "Skill Tracks", 
    desc: "Communication, Excel/Analytics, Design, Coding basics with projects and certificates.", 
    modules: 9, 
    learners: "180k+", 
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60"
  },
];

const features = [
  { icon: Brain, title: "AI Mentor Support", desc: "Instant help for concepts, planning, doubts, and next steps." },
  { icon: BookOpen, title: "Adaptive Quizzes", desc: "Topic-wise quizzes with explanations and difficulty progression." },
  { icon: CheckCircle, title: "Practice Made Simple", desc: "Real problems organized by track and level." },
  { icon: Users, title: "Built-in Workspace", desc: "Notes, assignments, mock tests — all in one place." },
  { icon: Trophy, title: "Industry Certificates", desc: "Verifiable certificates for portfolios and resumes." },
  { icon: Star, title: "Global Contests", desc: "Compete, climb leaderboards, and get noticed." },
];

const testimonials = [
  { name: "Ritul Jain", college: "LNCT Bhopal", text: "CareerXpert ne Class 12 boards + college roadmap clear kar diya, quizzes se confidence boost hua." },
  { name: "Risabh Dubey", college: "Karond School of Technology", text: "AI Mentor se daily study plan aur mock analysis mila — Govt exams ke liye game-changer." },
  { name: "Dhruv Koli", college: "IIIT-Dharwad", text: "Projects and tournaments ne resume solid banaya, internships crack karna easy ho gaya." },
];

export default function Landing() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen selection:bg-primary/20">


      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-orange-100/60 h-20 shadow-lg shadow-orange-500/5">
        <div className="container mx-auto flex items-center justify-between h-full px-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 brand-gradient rounded-xl flex items-center justify-center shadow-xl shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-black text-lg">CX</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-[#1e293b] group-hover:text-orange-600 transition-colors">CareerXpert</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-10">
            <a href="#tracks" className="text-sm font-bold text-[#1e293b] hover:text-orange-600 transition-all duration-300 relative group">
              Courses
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#features" className="text-sm font-bold text-[#1e293b] hover:text-amber-600 transition-all duration-300 relative group">
              Mentorship
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#resources" className="text-sm font-bold text-[#1e293b] hover:text-yellow-600 transition-all duration-300 relative group">
              Resources
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#about" className="text-sm font-bold text-[#1e293b] hover:text-rose-600 transition-all duration-300 relative group">
              About Us
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-500 group-hover:w-full transition-all duration-300"></span>
            </a>
          </nav>

          <div className="flex gap-4">
            {isLoggedIn ? (
              <Link to="/dashboard">
                <Button className="rounded-xl h-11 px-6 brand-gradient shadow-lg shadow-orange-500/20 font-bold border-none text-white hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="rounded-xl h-11 px-6 font-bold text-[#1e293b] border-2 border-orange-100 bg-white hover:bg-orange-50 hover:border-orange-300/30 transition-all duration-300">Login</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="rounded-xl h-11 px-6 brand-gradient shadow-lg shadow-orange-500/20 font-bold border-none text-white btn-shine hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text Content */}
            <div className="text-left lg:text-left">
              <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-bold text-gray-500 mb-4 tracking-wide"
              >
                  Trusted by Students, Parents & Mentors
              </motion.p>
              
              <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-black text-[#1e293b] mb-6 tracking-tighter leading-[1.1]"
              >
                  Plan Your Future with <span className="gradient-text">CareerXpert</span>
              </motion.h1>

              <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl md:text-2xl font-extrabold text-orange-600 mb-6 tracking-tight"
              >
                  Your Personal AI & Mentor for Career Success
              </motion.h2>

              <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-gray-600 font-medium leading-relaxed mb-10"
              >
                  Career Kart is your one-stop solution for Class 10, Class 12, and college students (BCA, BBA, and more). With real mentors & AI guidance, explore courses, clear doubts, and discover the perfect career path.
              </motion.p>

              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-4 flex-wrap"
              >
                  <Link to="/auth">
                      <Button size="lg" className="h-14 px-10 rounded-xl bg-white text-[#1e293b] text-base font-bold shadow-xl border-2 border-orange-100 hover:bg-orange-50 hover:border-orange-300/30 transition-all duration-300 hover:scale-105">
                          Sign in with Google
                      </Button>
                  </Link>
                  <Link to="#tracks">
                      <Button size="lg" className="h-14 px-10 rounded-xl brand-gradient text-white text-base font-bold shadow-xl shadow-orange-500/30 btn-shine hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105">
                          Explore Courses
                      </Button>
                  </Link>
              </motion.div>
            </div>

            {/* Right side - Hero Image/GIF */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDJ5aGZ1Ym1xZ3FoOHZ5bWZqbmN6dHVvY2J4YnR4MHB0YzRxeHVyZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svkIWwpVYr/giphy.gif"
                  alt="Career Success"
                  className="w-full h-auto rounded-3xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent"></div>
              </div>
              
              {/* Floating stats cards */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl shadow-xl glow-orange"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">50K+</p>
                    <p className="text-xs font-bold text-gray-500">Active Students</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -top-6 -right-6 glass-card p-4 rounded-2xl shadow-xl glow-amber"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl brand-gradient-amber flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">98%</p>
                    <p className="text-xs font-bold text-gray-500">Success Rate</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section with Icons/GIFs */}
      <section className="py-24 px-6 bg-gradient-to-b from-orange-50/50 to-transparent" id="features">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#1e293b] mb-4">Why Choose CareerXpert?</h2>
            <p className="text-gray-500 font-medium text-lg">Everything you need to succeed in your career journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group border-2 border-orange-100/50"
              >
                <div className="w-16 h-16 rounded-2xl brand-gradient-orange flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg glow-orange">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories with Images */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#1e293b] mb-4">Success Stories</h2>
            <p className="text-gray-500 font-medium text-lg">Real students, Real success</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 border-2 border-orange-100/50"
            >
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="https://i.pravatar.cc/150?img=33" 
                  alt="Ritul Jain"
                  className="w-16 h-16 rounded-full border-4 border-orange-200"
                />
                <div>
                  <h4 className="font-black text-gray-900">Ritul Jain</h4>
                  <p className="text-sm text-gray-500 font-semibold">LNCT Bhopal</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed italic">{testimonials[0].text}</p>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 border-2 border-orange-100/50"
            >
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="https://i.pravatar.cc/150?img=12" 
                  alt="Risabh Dubey"
                  className="w-16 h-16 rounded-full border-4 border-amber-200"
                />
                <div>
                  <h4 className="font-black text-gray-900">Risabh Dubey</h4>
                  <p className="text-sm text-gray-500 font-semibold">Karond School of Technology</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed italic">{testimonials[1].text}</p>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 border-2 border-orange-100/50"
            >
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src="https://i.pravatar.cc/150?img=68" 
                  alt="Dhruv Koli"
                  className="w-16 h-16 rounded-full border-4 border-yellow-200"
                />
                <div>
                  <h4 className="font-black text-gray-900">Dhruv Koli</h4>
                  <p className="text-sm text-gray-500 font-semibold">IIIT-Dharwad</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed italic">{testimonials[2].text}</p>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Career Tracks */}
      <section className="py-24 px-6" id="tracks">
        <div className="container mx-auto">
          <div className="mb-16 text-left">
            <h2 className="text-3xl font-black text-[#1e293b] mb-4">Featured Career Tracks</h2>
            <p className="text-gray-500 font-medium">Pick a track, learn with AI Mentor, and test via quizzes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tracks.map((track, i) => (
              <motion.article
                key={track.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="glass-card rounded-[1.5rem] overflow-hidden card-hover-lift group"
              >
                <div className="h-48 bg-muted relative overflow-hidden">
                  <img src={track.image} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/40" />
                  <div className="absolute top-4 right-4 glass-morphism px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-orange-600 animate-pulse-glow">
                    {track.modules} Modules
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold text-[#1e293b]">{track.rating} Rating</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1e293b] mb-3">{track.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">{track.desc}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-[#f1f5f9]">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{track.modules} modules · {track.learners} learners</span>
                    <Link to="/chatbot">
                      <Button className="h-9 rounded-lg brand-gradient text-white text-xs font-bold px-5 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-105">AI Mentor</Button>
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-card py-10 border-t border-blue-100/60 px-6 mt-24">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 group cursor-pointer">
             <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-xs">CX</span>
             </div>
             <span className="text-lg font-bold text-[#1e293b] group-hover:text-primary transition-colors">CareerXpert</span>
          </div>
          
          <div className="flex gap-8 text-sm font-semibold text-gray-400">
            <a href="#" className="hover:text-primary transition-all duration-300 relative group">
              Terms
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all"></span>
            </a>
            <a href="#" className="hover:text-primary transition-all duration-300 relative group">
              Privacy
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all"></span>
            </a>
            <a href="#" className="hover:text-primary transition-all duration-300 relative group">
              Contact
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all"></span>
            </a>
          </div>

          <p className="text-sm font-medium text-gray-400">© 2026 CareerXpert. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
