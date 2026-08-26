import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mentorApi, courseApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Book, Users, Star, PlayCircle, Layers, 
  PlusCircle, Settings, Trash2, Edit3, Eye
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

export default function MyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentor, setMentor] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchMyCourses = async () => {
    try {
      if (!user?.email) return;
      const m = await mentorApi.getByEmail(user.email);
      setMentor(m);
      const data = await courseApi.getByMentor(m.id as any);
      setCourses(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch your courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, [user]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this course? All associated modules and lessons will be removed.")) return;
    
    setDeletingId(id);
    try {
      await courseApi.delete(id);
      toast({ title: "Course Deleted", description: "The curriculum has been removed successfully." });
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast({ title: "Deletion Failed", description: "Could not delete the course. Please try again.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <span className="text-slate-500 font-medium">Retrieving your curriculum...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-8 mt-6">
      {/* Dynamic Header */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Expert Mentor Portal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              Your Designed <br /> <span className="text-primary italic">Curriculum</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-xl text-base md:text-lg">
              Manage and scale your educational impact. You have designed {courses.length} specialized pathways.
            </p>
          </div>

          <Link to="/create-course">
            <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-lg shadow-lg hover:shadow-primary/20 transition-all gap-3">
              <PlusCircle className="w-6 h-6" /> Design New Course
            </Button>
          </Link>
        </div>
      </section>

      {/* Course Grid */}
      <div className="grid grid-cols-1 gap-6">
        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
                <Book className="w-10 h-10" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Courses Found</h3>
                <p className="text-slate-500 font-medium mt-1">You haven't architected any courses yet. Start your journey today.</p>
            </div>
            <Link to="/create-course">
                <Button className="h-12 px-6 rounded-xl font-semibold bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-primary transition-all">
                    Start Architecting
                </Button>
            </Link>
          </div>
        ) : (
          courses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-50 text-primary flex items-center justify-center flex-shrink-0 border border-slate-100 group-hover:bg-primary/5 transition-colors">
                  <Book className="w-8 h-8 md:w-10 md:h-10" />
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors">
                      {course.courseName}
                    </h2>
                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                      {course.category || "General"}
                    </span>
                  </div>
                  
                  <p className="text-slate-500 font-medium leading-relaxed max-w-3xl text-sm line-clamp-2">
                    {course.description || "In-depth curriculum designed for mastery in this specific domain."}
                  </p>

                  <div className="flex flex-wrap gap-5 pt-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Modules</p>
                        <p className="font-semibold text-slate-800 text-sm leading-none">{course.modules?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                        <PlayCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tutorials</p>
                        <p className="font-semibold text-slate-800 text-sm leading-none">{course.tutorials?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Enrollments</p>
                        <p className="font-semibold text-slate-800 text-sm leading-none">{(course.enrollmentCount as number) || "50+"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full lg:w-[220px] shrink-0 mt-4 lg:mt-0">
                   <Link to={`/smartlearn?courseId=${course.id}`} className="w-full">
                     <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-all gap-2">
                        <Settings className="w-4 h-4" /> Manage Curriculum
                     </Button>
                   </Link>
                   <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-10 rounded-xl font-medium text-xs text-slate-700 border-slate-200 hover:bg-slate-50 transition-all gap-1.5 px-0">
                        <Edit3 className="w-4 h-4 text-blue-500" /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleDelete(course.id)}
                        disabled={deletingId === course.id}
                        className="h-10 rounded-xl font-medium text-xs border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all gap-1.5 px-0"
                      >
                        {deletingId === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-500" />} Delete
                      </Button>
                   </div>
                   <Link to="/courses" className="w-full">
                    <Button variant="ghost" className="w-full h-9 rounded-lg font-medium text-xs text-slate-500 hover:text-primary hover:bg-primary/5 gap-2">
                        <Eye className="w-4 h-4" /> View as Student
                    </Button>
                   </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
