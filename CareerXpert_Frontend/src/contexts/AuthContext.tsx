import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isTokenExpired } from "@/lib/api";
import { toast } from "sonner";

interface User {
  id: number;
  userId: number; // Added to support direct chat using User entity IDs
  fullName: string;
  email: string;
  role: string;
  humanMentorEmail?: string;
  mentorId?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (!savedToken || isTokenExpired(savedToken)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken || isTokenExpired(savedToken)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return savedToken;
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("hasClickedRecommendedCourse");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      logout();
      toast.error("Session expired. Please log in again.");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorizedEvent);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorizedEvent);
    };
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const isLoggedIn = !!user && !!token && !isTokenExpired(token);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
