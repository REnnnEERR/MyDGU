"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ModuleBreadcrumb } from "@/components/Header";
import { api, useAuth } from "@/context/AuthContext";
import type { CoAuthoredCourse } from "@/types/course";

export default function MyRolesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [courses, setCourses] = useState<CoAuthoredCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    api
      .get<CoAuthoredCourse[]>("/api/applications/co-authored-courses")
      .then(setCourses)
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex flex-col flex-1">
        <ModuleBreadcrumb current="Курси як співавтора" />
        <div className="max-w-6xl mx-auto w-full px-6 py-10 text-du-gray-500">
          Завантаження...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col flex-1">
        <ModuleBreadcrumb current="Курси як співавтора" />
        <div className="max-w-6xl mx-auto w-full px-6 py-10">
          <p className="text-du-gray-700">
            Щоб побачити курси, де ви співавтор, спочатку{" "}
            <Link
              href="/login"
              className="text-du-blue font-medium hover:underline"
            >
              увійдіть
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <ModuleBreadcrumb current="Курси як співавтора" />

      <div className="max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Курси як співавтора
          </h1>
          <Link
            href="/shared-development"
            className="text-sm font-medium text-du-blue hover:underline"
          >
            ← Назад до каталогу
          </Link>
        </div>

        {courses.length === 0 ? (
          <p className="text-du-gray-500 italic py-10 text-center">
            Поки що немає курсів, де вас підтвердили як співавтора.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Link
                href={`/shared-development/course/${course._id}`}
                key={course._id}
                className="block p-6 bg-du-white rounded-3xl border border-du-gray-200 hover:border-du-black transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-du-lime-card text-du-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Ваша роль: {course.myRole}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-du-black mb-2">
                  {course.title}
                </h3>
                <p className="text-du-gray-700 text-sm line-clamp-2 mb-4">
                  {course.description}
                </p>
                <div className="text-xs text-du-gray-500 mb-3">
                  <strong className="text-du-gray-700">Спеціальність:</strong>{" "}
                  {course.specialty}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {course.requiredRoles.map((r, idx) => (
                    <span
                      key={idx}
                      className="bg-du-yellow-soft text-du-gray-700 text-xs px-2.5 py-1 rounded-full font-medium"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
