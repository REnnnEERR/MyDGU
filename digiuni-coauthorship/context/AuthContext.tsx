"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { getToken, setToken, removeToken } from "@/lib/token";
import type { User } from "@/types/course";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    // Токен збережений — декодуємо email/id прямо з payload JWT (без секрету, лише щоб прочитати),
    // сервер усе одно перевіряє підпис при кожному реальному запиті.
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      // payload містить лише userId — email підвантажимо окремим запитом при потребі.
      setUser({ id: payload.userId, email: "" });
    } catch {
      removeToken();
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>("/api/auth/login", {
      email,
      password,
    });
    setToken(data.token);
    setUser(data.user);
  }

  async function register(email: string, password: string) {
    const data = await api.post<{ token: string; user: User }>("/api/auth/register", {
      email,
      password,
    });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    removeToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth має використовуватись всередині <AuthProvider>");
  return ctx;
}

export { ApiError };
export { api } from "@/lib/api";