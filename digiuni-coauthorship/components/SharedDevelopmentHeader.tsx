"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useAuth } from "@/context/AuthContext";
import type { Course, CourseApplication } from "@/types/course";

const DEFAULT_SUBTITLE =
  "Знаходьте фахівців для своїх курсів або долучайтеся до курсів інших авторів у ролі співрозробника.";

export function SharedDevelopmentHeader({
  active,
  subtitle = DEFAULT_SUBTITLE,
}: {
  active: "catalog" | "my-courses" | "none";
  subtitle?: string;
}) {
  const { user } = useAuth();
  const [myCoursesCount, setMyCoursesCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setMyCoursesCount(null);
      return;
    }
    (async () => {
      try {
        const [authored, applications] = await Promise.all([
          api.get<Course[]>("/api/courses/mine"),
          api.get<CourseApplication[]>("/api/applications/mine"),
        ]);
        const uniqueAppliedCourseIds = new Set(
          applications.map((a) => a.courseId),
        );
        setMyCoursesCount(authored.length + uniqueAppliedCourseIds.size);
      } catch {
        setMyCoursesCount(null);
      }
    })();
  }, [user]);

  return (
    <>
      <h1
        className="mb-6"
        style={{
          fontFamily: '"Diya", var(--font-manrope), sans-serif',
          fontWeight: 600,
          fontSize: "56px",
          lineHeight: "60px",
          letterSpacing: "-1.12px",
        }}
      >
        Спільна розробка курсів
      </h1>

      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-du-banner-bg mb-8">
        <div className="max-w-[1440px] mx-auto px-20 h-[208px] flex flex-col justify-center gap-7">
          <p
            className="text-du-banner-text max-w-[820px]"
            style={{
              fontFamily: '"Diya", var(--font-manrope), sans-serif',
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              letterSpacing: "-0.32px",
            }}
          >
            {subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5 text-sm font-medium">
              <Link
                href="/shared-development"
                className={
                  active === "catalog"
                    ? "text-du-black border-b-2 border-du-black pb-1"
                    : "text-du-gray-500 hover:text-du-black pb-1"
                }
              >
                Каталог курсів
              </Link>
              {user && (
                <Link
                  href="/shared-development/my-courses"
                  className={
                    (active === "my-courses"
                      ? "text-du-black border-b-2 border-du-black"
                      : "text-du-gray-500 hover:text-du-black") +
                    " pb-1 flex items-center gap-1.5"
                  }
                >
                  Мої курси
                  {myCoursesCount !== null && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-du-black text-du-white text-xs">
                      {myCoursesCount}
                    </span>
                  )}
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {user && (
                <Link
                  href="/shared-development/profile"
                  className="btn-pill btn-pill-outline text-sm py-2 px-5"
                >
                  Ваша анкета
                </Link>
              )}
              {user ? (
                <Link
                  href="/shared-development/course/new"
                  className="btn-pill btn-pill-black btn-outline-on-hover text-sm py-2 px-5"
                >
                  Створити курс
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="btn-pill btn-pill-black btn-outline-on-hover text-sm py-2 px-5"
                >
                  Увійти, щоб створити курс
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
