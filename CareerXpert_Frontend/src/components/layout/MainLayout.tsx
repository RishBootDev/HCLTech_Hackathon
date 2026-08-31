import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, getWsConfig } from "@/lib/api";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  School,
  MessageSquare,
  LogOut,
  UserCircle,
  Users,
  Bell,
  Zap,
  Newspaper,
  Brain,
  Mic,
  FileText,
  Compass,
  ChevronRight,
  Settings,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let globalStompClient: Client | null = null;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mentorEmail, setMentorEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "ROLE_MENTOR" && user?.email) {
      profileApi.getByEmail(user.email).then((p: any) => {
        if (p?.humanMentor?.email) {
          setMentorEmail(p.humanMentor.email);
        }
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user?.userId) {
      const { brokerURL, sockJsURL } = getWsConfig("/ws-chat");
      const client = new Client({
        brokerURL,
        webSocketFactory: () => new SockJS(sockJsURL),
        connectHeaders: {
          userId: user.userId.toString(),
        },
        debug: () => {},
        reconnectDelay: 5000,
      });

      client.onConnect = () => {
        console.log("Global presence connected");
        client.subscribe("/topic/status", (msg) => {
          const update = JSON.parse(msg.body);
          window.dispatchEvent(new CustomEvent('user-status-change', { detail: update }));
        });
      };

      client.activate();
      globalStompClient = client;

      return () => {
        if (client) {
          client.deactivate();
          console.log("Global presence deactivated");
        }
      };
    }
  }, [user?.userId]);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const isMentor = user?.role === "ROLE_MENTOR";

  const navItems = isMentor
    ? [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Brain, label: "AI Chat", href: "/chatbot" },
        { icon: BookOpen, label: "My Courses", href: "/my-courses" },
        { icon: GraduationCap, label: "Create Course", href: "/create-course" },
      ]
    : [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: Brain, label: "AI Mentor", href: "/chatbot" },
        { icon: Users, label: "Human Mentor", href: mentorEmail ? `/mentor-chat?email=${mentorEmail}` : "/mentors" },

        { icon: BookOpen, label: "Quizzes", href: "/quiz-list" },
        { icon: GraduationCap, label: "Courses", href: "/courses" },
        { icon: Users, label: "Mentors", href: "/mentors" },
        { icon: School, label: "Colleges", href: "/colleges" },
        { icon: Newspaper, label: "News Feed", href: "/news" },
        { icon: Mic, label: "Mock Interview", href: "/mock-interview" },
        { icon: FileText, label: "Resume Review", href: "/resume-review" },
        { icon: Compass, label: "Pathfinder", href: "/recommendation-quiz" },
        { icon: TrendingUp, label: "Skill Progress", href: "/skill-progress" },
        { icon: Brain, label: "SmartLearn", href: "/smartlearn" },
      ];

  return (
    <div className="min-h-screen text-foreground font-sans">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-60 glass-card border-r-2 border-orange-100/60 z-50 flex flex-col py-5 px-3 transition-all duration-300 shadow-2xl ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 mb-6 px-3 group cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-9 h-9 brand-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 animate-pulse-glow">
            <Zap className="text-white w-5 h-5 fill-white" />
          </div>
          <span className="text-lg font-black tracking-tighter gradient-text">
            CAREERXPERT
          </span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar pr-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={`${item.href}-${item.label}`}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg glow-orange scale-105"
                    : "hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 text-muted-foreground hover:text-orange-600 hover:scale-102"
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "" : "group-hover:scale-125 transition-transform duration-300"}`} />
                <span className="text-sm font-semibold truncate">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-active-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90 shadow-lg"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="mt-4 pt-4 border-t-2 border-orange-100/60 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border border-orange-100/50 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 border-2 border-white flex items-center justify-center text-sm font-black text-white overflow-hidden shadow-md">
              {user?.fullName?.[0]?.toUpperCase() || <UserCircle className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-foreground">{user?.fullName || "User"}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {user?.role?.replace("ROLE_", "") || "STUDENT"}
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all text-sm font-semibold h-9 hover:scale-105"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Top Header */}
        {location.pathname !== '/chatbot' && (
          <header className="h-16 glass-card sticky top-0 z-40 px-6 flex items-center justify-between border-b-2 border-orange-100/60 shadow-lg glow-orange">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-foreground rounded" />
              <span className="block w-5 h-0.5 bg-foreground rounded" />
              <span className="block w-5 h-0.5 bg-foreground rounded" />
            </div>
          </button>

          {/* Page Title from location */}
          <div className="hidden lg:block">
            <p className="text-sm font-bold text-muted-foreground capitalize">
              {location.pathname.replace("/", "").replace("-", " ") || "Dashboard"}
            </p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-orange-50 transition-all hover:scale-110">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse shadow-lg shadow-rose-500/50" />
            </Button>
            <Link to="/chatbot">
              <Button className="brand-gradient rounded-xl h-10 px-4 shadow-lg glow-orange active:scale-95 transition-all font-bold gap-2 text-sm btn-shine hover:shadow-xl">
                <Zap className="w-4 h-4 fill-white animate-pulse" />
                Ask AI
              </Button>
            </Link>
          </div>
        </header>
        )}

        {/* Page Content */}
        <main className={`${location.pathname === '/chatbot' ? '' : 'p-6'} flex-1 relative overflow-hidden`}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
