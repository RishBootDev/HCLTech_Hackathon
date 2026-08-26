import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Chatbot from "./pages/Chatbot";
import CourseChat from "./pages/CourseChat";
import Courses from "./pages/Courses";
import QuizList from "./pages/QuizList";
import TakeQuiz from "./pages/TakeQuiz";
import RecommendationQuiz from "./pages/RecommendationQuiz";
import Mentors from "./pages/Mentors";
import Colleges from "./pages/Colleges";
import MockInterview from "./pages/MockInterview";
import ResumeReview from "./pages/ResumeReview";
import NewsPage from "./pages/NewsPage";

import MentorChat from "./pages/MentorChat";
import SkillProgress from "./pages/SkillProgress";
import SmartLearn from "./pages/SmartLearn";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";
import CreateCourse from "./pages/CreateCourse";
import MyCourses from "./pages/MyCourses";

const queryClient = new QueryClient();

// Component to manage body class based on route and auth state
const BodyClassManager = () => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const isLandingOrAuth = location.pathname === '/' || location.pathname === '/auth';
    
    if (isLandingOrAuth) {
      document.body.className = 'landing-page';
    } else if (isLoggedIn) {
      document.body.className = 'app-authenticated';
    } else {
      document.body.className = '';
    }
  }, [location.pathname, isLoggedIn]);

  return null;
};

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/auth" />;
  
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/dashboard" />;
  }
  
  return <MainLayout>{children}</MainLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BodyClassManager />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />

            <Route path="/news" element={<ProtectedRoute><NewsPage /></ProtectedRoute>} />
            <Route path="/course-chat" element={<ProtectedRoute><CourseChat /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/quiz-list" element={<ProtectedRoute><QuizList /></ProtectedRoute>} />
            <Route path="/take-quiz/:id" element={<ProtectedRoute><TakeQuiz /></ProtectedRoute>} />
            <Route path="/recommendation-quiz" element={<ProtectedRoute><RecommendationQuiz /></ProtectedRoute>} />
            <Route path="/mentors" element={<ProtectedRoute><Mentors /></ProtectedRoute>} />
            <Route path="/colleges" element={<ProtectedRoute><Colleges /></ProtectedRoute>} />
            <Route path="/mock-interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
            <Route path="/resume-review" element={<ProtectedRoute><ResumeReview /></ProtectedRoute>} />
            <Route path="/mentor-chat" element={<ProtectedRoute><MentorChat /></ProtectedRoute>} />
            <Route path="/create-course" element={<ProtectedRoute allowedRole="ROLE_MENTOR"><CreateCourse /></ProtectedRoute>} />
            <Route path="/skill-progress" element={<ProtectedRoute><SkillProgress /></ProtectedRoute>} />
            <Route path="/smartlearn" element={<ProtectedRoute><SmartLearn /></ProtectedRoute>} />
            <Route path="/my-courses" element={<ProtectedRoute allowedRole="ROLE_MENTOR"><MyCourses /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
