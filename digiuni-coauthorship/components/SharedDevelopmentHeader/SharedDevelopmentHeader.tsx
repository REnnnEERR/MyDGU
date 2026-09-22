"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useAuth } from "@/context/AuthContext";
import type { Course, CourseApplication } from "@/types/course";
import styles from "./SharedDevelopmentHeader.module.css";

const DEFAULT_SUBTITLE =
  "Знаходьте фахівців для своїх курсів або долучайтеся до курсів інших авторів у ролі співрозробника.";

export function SharedDevelopmentHeader({
  active,
  subtitle = DEFAULT_SUBTITLE,
}: {
  active: "catalog" | "my-courses" | "messages" | "none";
  subtitle?: string;
}) {
  const { user } = useAuth();
  const [myCoursesCount, setMyCoursesCount] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    api
      .get<{ unreadCount: number }[]>("/api/messages/conversations")
      .then((list) =>
        setUnreadCount(list.reduce((sum, c) => sum + c.unreadCount, 0)),
      )
      .catch(() => setUnreadCount(0));
  }, [user]);

  return (
    <>
      <h1 className={styles.title}>Спільна розробка курсів</h1>

      <div className={styles.bannerFullBleed}>
        <div className={styles.bannerInner}>
          <p className={styles.subtitle}>{subtitle}</p>

          <div className={styles.row}>
            <div className={styles.tabs}>
              <Link
                href="/shared-development"
                className={active === "catalog" ? styles.tabActive : styles.tab}
              >
                Каталог курсів
              </Link>
              {user && (
                <Link
                  href="/shared-development/my-courses"
                  className={`${active === "my-courses" ? styles.tabActive : styles.tab} ${styles.tabWithBadge}`}
                >
                  Мої курси
                  {myCoursesCount !== null && (
                    <span className={styles.badge}>{myCoursesCount}</span>
                  )}
                </Link>
              )}
              {user && (
                <Link
                  href="/messages"
                  className={`${active === "messages" ? styles.tabActive : styles.tab} ${styles.tabWithBadge}`}
                >
                  Повідомлення
                  {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount}</span>
                  )}
                </Link>
              )}
            </div>

            <div className={styles.buttons}>
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
