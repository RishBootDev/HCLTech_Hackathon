import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mentorApi, profileApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Star, Users, Briefcase, Mail, Phone, Award, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Mentors() {
  const { user, isLoggedIn } = useAuth();
  const [mentors, setMentors] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isLoggedIn && user) {
          const p = await profileApi.getByEmail(user.email);
          setProfile(p);
        }
        const availableMentors = await mentorApi.getAvailable();
        setMentors(availableMentors.length > 0 ? availableMentors : await mentorApi.getAll());
      } catch (err) {
        console.error("Failed to load mentor data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoggedIn, user]);

  const assign = async (mentorId: number) => {
    if (!isLoggedIn || !user || !profile?.id) {
      toast({ title: "Login required", description: "Please login and ensure profile is set up.", variant: "destructive" });
      return;
    }
    setAssigning(mentorId);
    try {
      await mentorApi.assign(mentorId, profile.id as number);
      // Fetch profile again to update local state
      const p = await profileApi.getByEmail(user.email);
      setProfile(p);
      toast({ title: "Success!", description: "Mentor assigned successfully. Check your dashboard." });
    } catch {
      toast({ title: "Error", description: "Failed to assign mentor. Check your credits.", variant: "destructive" });
    }
    setAssigning(null);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-black tracking-tight">Expert Mentors</h1>
        <p className="text-gray-500 font-medium mt-1">Direct access to industry veterans who have walked the path you're on.</p>
      </section>

      <div className="bento-grid">
        <AnimatePresence>
        {mentors.length === 0 ? (
          <div className="col-span-full h-80 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-gray-600">
             <Users className="w-16 h-16 opacity-10 mb-4" />
             <p className="font-black uppercase tracking-[0.2em] text-sm">No mentors active currently</p>
          </div>
        ) : mentors.map((m, i) => (
          <motion.div
            key={m.id as number}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bento-item group flex flex-col"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl brand-gradient p-1 shadow-xl group-hover:rotate-6 transition-transform">
                   <div className="w-full h-full rounded-[1.3rem] bg-slate-900 flex items-center justify-center font-black text-2xl">
                      {(m.name as string)?.[0]?.toUpperCase()}
                   </div>
                </div>
                {m.online && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg border-2 border-[#09090b]" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black group-hover:text-primary transition-colors">{m.name as string}</h3>
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 leading-tight">
                    {m.jobRole as string || m.specialization as string || "Industry Expert"}
                </p>
                <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= (m.rating as number || 5) ? "text-orange-400 fill-orange-400" : "text-gray-700"}`} />
                    ))}
                    <span className="text-[10px] font-black ml-2 text-gray-400">{m.rating as number || 5.0}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                        <Award className="w-4 h-4 text-primary" />
                        <span>{m.experience as number || 0} Years Global Experience</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <span>Spec: {m.specialization as string || "Generalist"}</span>
                    </div>
                     <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                        <Zap className="w-4 h-4 text-orange-400" />
                        <span>Required: {m.requiredCredits as number || 0} Credits</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" size="sm" className="rounded-xl bg-white/5 text-[10px] font-black hover:bg-white/10 gap-2">
                        <Mail className="w-3 h-3" /> MAIL
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-xl bg-white/5 text-[10px] font-black hover:bg-white/10 gap-2">
                        <Phone className="w-3 h-3" /> CALL
                    </Button>
                </div>

                {m.description && (
                    <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-2 px-2">"{(m.description as string)}"</p>
                )}
            </div>

            <div className="mt-8">
                {profile?.humanMentor?.id === m.id ? (
                  <Link to={`/mentor-chat?email=${m.email}`} className="w-full">
                    <Button
                      className="w-full h-14 rounded-2xl bg-green-500/10 text-green-500 font-black text-lg border border-green-500/20 hover:bg-green-500/20 transition-all"
                    >
                      OPEN CHAT
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className={`w-full h-14 rounded-2xl brand-gradient font-black text-lg glow-primary active:scale-95 transition-all ${assigning === m.id ? "opacity-50" : ""}`}
                    onClick={() => assign(m.id as number)}
                    disabled={assigning === (m.id as number)}
                  >
                    {assigning === (m.id as number) ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-3 underline decoration-white/30 underline-offset-4">
                          REQUEST ACCESS
                      </div>
                    )}
                  </Button>
                )}
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
