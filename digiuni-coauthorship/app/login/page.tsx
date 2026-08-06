"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, ApiError } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/shared-development");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не вдалося увійти");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-extrabold tracking-tight mb-7">Вхід</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border border-du-gray-200 rounded-xl focus:outline-none focus:border-du-black"
              placeholder="you@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-du-gray-200 rounded-xl focus:outline-none focus:border-du-black"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-pill btn-pill-black py-3 disabled:opacity-50"
          >
            {isSubmitting ? "Входимо..." : "Увійти"}
          </button>
        </form>

        <p className="text-sm text-du-gray-500 mt-6 text-center">
          Немає акаунта?{" "}
          <Link href="/register" className="text-du-blue font-medium hover:underline">
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  );
}