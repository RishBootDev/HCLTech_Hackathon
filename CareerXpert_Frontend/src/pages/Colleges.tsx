import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, School, Star, Search, MapPin, GraduationCap, Phone, Mail, Building2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Colleges() {
  const { user } = useAuth();
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);

  const fetchColleges = async (type: "recommend" | "view") => {
    if (!user) return;
    setLoading(true);
    try {
      const c = type === "recommend"
        ? await profileApi.recommendColleges(user.id, city)
        : await profileApi.getColleges(user.id);
      setColleges(c);
      if (c.length === 0) {
        toast({ title: "No results", description: "Try searching with a different city." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch colleges", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Simple Header Section */}
      <section className="text-center space-y-3 pt-8">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight">
          Global Institution Explorer
        </h1>
        <p className="text-gray-500 font-medium text-lg">Mapping your academic sanctuary</p>
      </section>

      {/* Filter Card */}
      <section className="max-w-4xl mx-auto">
        <div className="glass-card p-10 rounded-[3rem] border-2 border-orange-100/50 shadow-xl">
           <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2">
                    <MapPin className="text-orange-500 w-6 h-6 group-focus-within:animate-bounce" />
                </div>
                <Input 
                  placeholder="Where do you want to study? (e.g. London, Tokyo, Delhi)" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  className="h-16 pl-16 rounded-2xl border-2 border-orange-100/50 focus:border-orange-400 font-bold text-lg"
                />
              </div>
              <Button 
                onClick={() => fetchColleges("recommend")} 
                disabled={loading}
                className="h-16 px-12 rounded-2xl brand-gradient font-black text-lg shadow-xl glow-orange min-w-[200px] active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "SEARCH NOW"}
              </Button>
           </div>
           
           <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-100 justify-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Quick Links:</p>
              <button onClick={() => { setCity("Delhi"); fetchColleges("recommend"); }} className="text-[10px] font-black uppercase tracking-widest hover:text-orange-500 transition-colors">Delhi</button>
              <button onClick={() => { setCity("Mumbai"); fetchColleges("recommend"); }} className="text-[10px] font-black uppercase tracking-widest hover:text-orange-500 transition-colors">Mumbai</button>
              <button onClick={() => { setCity("Bangalore"); fetchColleges("recommend"); }} className="text-[10px] font-black uppercase tracking-widest hover:text-orange-500 transition-colors">Bangalore</button>
           </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {colleges.length > 0 ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {colleges.map((c, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="glass-card p-8 rounded-[2.5rem] border-2 border-orange-100/50 hover:border-orange-300/50 transition-all hover:shadow-xl group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-orange-400/20 transition-all" />
                  
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                    <Star className="text-orange-500 w-7 h-7 fill-orange-500" />
                  </div>

                  <h3 className="text-2xl font-black leading-tight mb-4 group-hover:text-orange-600 transition-colors">{c.collegeName as string}</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-gray-600 font-semibold text-sm">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="truncate">{c.city as string}, {c.state as string}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600 font-semibold text-sm">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="truncate" title={`${c.address}, ${c.pincode}`}>{c.address as string} - {c.pincode as string}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600 font-semibold text-sm">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="truncate">{c.course as string}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600 font-semibold text-sm">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="truncate">{c.contact as string}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600 font-semibold text-sm">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-pink-500" />
                      </div>
                      <span className="truncate">{c.email as string}</span>
                    </div>

                    <div className="flex items-start gap-3 text-gray-600 font-semibold text-sm">
                      <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-yellow-600" />
                      </div>
                      <span className="line-clamp-2" title={c.facilities as string}>{c.facilities as string}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full rounded-2xl border-2 border-orange-100 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all font-black text-xs uppercase tracking-widest py-6">
                    View Institution Details
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          ) : !loading ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-[400px] border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center p-10"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 grayscale opacity-20">
                <School className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-black text-gray-600 uppercase tracking-tighter mb-2">No institutions discovered yet</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto italic font-medium">Use the search console above to find your ideal academic sanctuary anywhere in the world.</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </div>
  );
}
