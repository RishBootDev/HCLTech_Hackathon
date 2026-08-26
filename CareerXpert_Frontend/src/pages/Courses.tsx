import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { courseApi, profileApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, ChevronUp, Loader2, Book, Users, Star, 
  ArrowRight, PlayCircle, Zap, UserPlus, Compass 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Courses() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isLoggedIn) { navigate("/auth"); return; }

    const fetchProfileAndCourses = async () => {
      try {
        const p = await profileApi.getByEmail(user!.email);
        setProfile(p);

        let data: any[] = [];
        const courseName = searchParams.get("courseName");

        if (user?.role === "ROLE_MENTOR") {
          // Mentors see all courses or filtered by name
          data = courseName
            ? await courseApi.getByName(decodeURIComponent(courseName))
            : await courseApi.getAll();
        } else if (p.humanMentor) {
          // Connected students see ONLY their mentor's courses
          data = await courseApi.getByMentor((p.humanMentor as any).id);
          // If a search name is provided, filter the mentor's courses locally for simplicity 
          // or just show mentor's courses as the "prescribed" curriculum
          if (courseName) {
            data = data.filter((c: any) => 
              c.courseName.toLowerCase().includes(decodeURIComponent(courseName).toLowerCase())
            );
          }
        } else {
          // Not connected - we don't fetch any courses yet, we show suggestions in the UI
          data = [];
        }

        setCourses(data);
      } catch (err) {
        console.error("Failed to fetch", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndCourses();
  }, [searchParams, user, isLoggedIn, navigate]);

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Courses & Mentorship</h1>
          <p className="text-gray-500 font-medium mt-1">Unlock your potential with expert-led courses and personalized guidance.</p>
        </div>
        <Button 
          onClick={async () => { 
            setLoading(true); 
            let data = [];
            if (user?.role === "ROLE_MENTOR") {
              data = await courseApi.getAll();
            } else if (profile?.humanMentor) {
              data = await courseApi.getByMentor(profile.humanMentor.id);
            }
            setCourses(data); 
            setLoading(false); 
          }} 
          className="rounded-2xl h-14 px-8 brand-gradient shadow-xl glow-primary font-black"
        >
          REFRESH CATALOG
        </Button>
      </section>

      <div className="space-y-6">
        {courses.length === 0 && user?.role !== "ROLE_MENTOR" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-8 bg-white border border-border rounded-[3rem] shadow-sm"
          >
            {!profile?.courseRecommendations ? (
              <>
                <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-primary">
                  <Compass className="w-12 h-12" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Discover Your Path</h2>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto">
                    You haven't selected a career path yet. Take our AI Pathfinder quiz to find the curriculum that best fits your goals.
                  </p>
                </div>
                <Link to="/dashboard">
                  <Button className="h-16 px-10 rounded-2xl brand-gradient text-white font-black text-lg gap-3 shadow-xl glow-primary">
                    TAKE PATHFINDER <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            ) : !profile?.humanMentor ? (
              <>
                <div className="w-24 h-24 rounded-[2.5rem] bg-green-50 flex items-center justify-center text-green-600">
                  <UserPlus className="w-12 h-12" />
                </div>
                <div className="space-y-3">
                  <div className="px-4 py-1.5 bg-indigo-50 text-primary text-[10px] font-black rounded-full uppercase tracking-widest inline-block border border-indigo-100">
                    Pathway Identified: {profile.courseRecommendations.courseName}
                  </div>
                  <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Connect with a Mentor</h2>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto">
                    To access this premium curriculum, you must first connect with an industry mentor who will guide you through your {profile.courseRecommendations.courseName} journey.
                  </p>
                </div>
                <Link to="/mentors">
                  <Button className="h-16 px-10 rounded-2xl brand-gradient text-white font-black text-lg gap-3 shadow-xl glow-primary">
                    FIND A MENTOR <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            ) : (
              <div className="py-12 opacity-40">
                <Book className="w-16 h-16 mx-auto mb-4" />
                <p className="font-black text-xl uppercase tracking-widest">No courses available yet</p>
                <p className="text-sm font-medium mt-2 italic">Your mentor hasn't published any courses for this pathway yet.</p>
              </div>
            )}
          </motion.div>
        )}

        {courses.length === 0 && user?.role === "ROLE_MENTOR" && (
          <div className="text-center py-20 opacity-40">
             <Book className="w-16 h-16 mx-auto mb-4" />
             <p className="font-black text-xl uppercase tracking-widest">No Courses Found</p>
             <p className="text-sm font-medium mt-2">Try searching for a different course name.</p>
          </div>
        )}

        {courses.map((course: any, idx) => {
          const id = course.id as number;
          const mentors = course.mentors as Array<Record<string, unknown>> | undefined;
          const tutorials = course.tutorials as Array<Record<string, unknown>> | undefined;
          const isExpMentors = expanded[`mentors-${id}`];
          const isExpTutorials = expanded[`tutorials-${id}`];

          return (
            <motion.div 
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden group hover:border-primary/30 transition-all shadow-2xl"
            >
              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                   <div className="w-20 h-20 rounded-3xl brand-gradient flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <Book className="text-white w-10 h-10" />
                   </div>
                   
                   <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black group-hover:text-primary transition-colors">{course.courseName as string}</h2>
                        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">Premium Pathway</div>
                      </div>
                      <p className="text-gray-400 font-medium leading-relaxed max-w-3xl">{(course.description as string) || "No description provided."}</p>
                      
                      <div className="flex flex-wrap gap-4 pt-4">
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                            <span className="text-xs font-bold">Top Rated Course</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold">{course.careerRoadmap as string || "Certified Curriculum"}</span>
                        </div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-3 w-full md:w-auto">
                      <Button 
                        variant="ghost" 
                        onClick={() => toggle(`mentors-${id}`)}
                        className={`rounded-2xl h-12 flex justify-between gap-4 px-6 font-bold border ${isExpMentors ? "border-primary bg-primary/10 text-primary" : "border-white/5 hover:bg-white/5"}`}
                      >
                        <div className="flex items-center gap-2">
                           <Users className="w-4 h-4" /> Mentors ({mentors?.length || 0})
                        </div>
                        {isExpMentors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => toggle(`tutorials-${id}`)}
                        className={`rounded-2xl h-12 flex justify-between gap-4 px-6 font-bold border ${isExpTutorials ? "border-primary bg-primary/10 text-primary" : "border-white/5 hover:bg-white/5"}`}
                      >
                        <div className="flex items-center gap-2">
                           <PlayCircle className="w-4 h-4" /> Tutorials ({tutorials?.length || 0})
                        </div>
                        {isExpTutorials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                   </div>
                </div>

                <AnimatePresence>
                  {isExpMentors && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 mt-8">
                            {mentors?.length ? mentors.map((m: any, i) => (
                              <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-5 hover:bg-white/10 transition-colors group/mentor">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary">
                                       {(m.name as string)?.[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm">{m.name as string}</h4>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">{m.experience as number || 0} YRS Experience</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 italic mb-4">Expertise in {m.expertise as string || "Core domain"}</p>
                                <Button size="sm" className="w-full rounded-xl bg-white/5 hover:brand-gradient font-bold text-xs">Connect Now</Button>
                              </div>
                            )) : (
                                <div className="col-span-3 py-10 text-center text-gray-600 font-bold uppercase tracking-widest text-xs italic">No mentors assigned to this pathway yet.</div>
                            )}
                        </div>
                    </motion.div>
                  )}
                  
                  {isExpTutorials && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-8 flex gap-4 overflow-x-auto pb-4 border-t border-white/5 mt-8 custom-scrollbar">
                            {tutorials?.length ? tutorials.map((t: any, i) => (
                              <div key={i} className="min-w-[320px] bg-slate-900 border border-white/5 rounded-[2rem] p-6 group/tut">
                                <div className="aspect-video bg-white/5 rounded-2xl mb-4 flex items-center justify-center group-hover/tut:bg-white/10 transition-all relative overflow-hidden">
                                     <PlayCircle className="w-12 h-12 text-primary opacity-40 group-hover/tut:scale-110 group-hover/tut:opacity-100 transition-all" />
                                     <div className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">New</div>
                                </div>
                                <h4 className="font-black text-lg mb-2">{t.name as string}</h4>
                                <p className="text-xs text-gray-500 mb-6 line-clamp-2 italic">{t.description as string}</p>
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Dur: {t.duration as number || 0}m • Cr: {t.credit as number || 0}
                                    </div>
                                    <Button size="sm" className="rounded-xl brand-gradient font-black text-[10px] px-6">ENROLL <ArrowRight className="ml-2 w-3 h-3" /></Button>
                                </div>
                              </div>
                            )) : (
                                <div className="w-full py-10 text-center text-gray-600 font-bold uppercase tracking-widest text-xs italic">Learning modules are arriving soon.</div>
                            )}
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
