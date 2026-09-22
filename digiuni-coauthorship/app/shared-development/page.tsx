"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { specialties } from "@/data/specialties";
import { roles } from "@/data/roles";
import { ModuleBreadcrumb } from "@/components/Header/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader/SharedDevelopmentHeader";
import { api } from "@/context/AuthContext";
import type { Course, Profile } from "@/types/course";
import {
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/components/icons/icons";
import styles from "./page.module.css";

const PAGE_SIZE = 4;

const GRADIENT_BORDER = {
  background:
    "radial-gradient(96.04% 161.51% at 3.33% -13.12%, #A6C7BB 0%, #C1BEB3 8.33%, #E4B4A9 23.96%, #E7B2A9 40.9%, #E9B2BC 58.38%, #9086B7 71.65%, #7271BD 82.77%, #4A54C6 90.28%, #2833D0 100%)",
};

export default function SharedDevelopment() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [showSpecFilter, setShowSpecFilter] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const specFilterRef = useRef<HTMLDivElement>(null);
  const roleFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        specFilterRef.current &&
        !specFilterRef.current.contains(e.target as Node)
      ) {
        setShowSpecFilter(false);
      }
      if (
        roleFilterRef.current &&
        !roleFilterRef.current.contains(e.target as Node)
      ) {
        setShowRoleFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ status: "Відкрито" });
    if (search) params.set("search", search);
    if (selectedSpec) params.set("specialty", selectedSpec);
    if (selectedRole) params.set("role", selectedRole);

    try {
      const list = await api.get<Course[]>(`/api/courses?${params.toString()}`);
      setCourses(list);
      setVisibleCount(PAGE_SIZE);

      const uniqueAuthorIds = Array.from(new Set(list.map((c) => c.authorId)));
      const entries = await Promise.all(
        uniqueAuthorIds.map(async (id) => {
          try {
            const profile = await api.get<Profile>(`/api/profile/${id}`);
            return [id, profile.fullName] as const;
          } catch {
            return [id, "Автор курсу"] as const;
          }
        }),
      );
      setAuthorNames(Object.fromEntries(entries));
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedSpec, selectedRole]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const visibleCourses = courses.slice(0, visibleCount);
  const hasMore = visibleCount < courses.length;

  return (
    <div className={styles.wrapper}>
      <ModuleBreadcrumb items={[{ label: "Спільна розробка курсів" }]} />

      <div className={styles.content}>
        <SharedDevelopmentHeader active="catalog" />

        <div className={styles.filterRow}>
          <div className={styles.searchWrap}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за назвою ..."
              className={styles.searchInput}
              style={{
                ...GRADIENT_BORDER,
                backgroundSize: "100% 2px",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "bottom",
              }}
            />
            <span className={styles.searchIcon}>
              <SearchIcon className="w-4 h-4" />
            </span>
          </div>

          <div
            className={styles.filterSelect}
            style={GRADIENT_BORDER}
            ref={specFilterRef}
          >
            <div className={styles.filterSelectInner}>
              <button
                type="button"
                onClick={() => setShowSpecFilter((v) => !v)}
                className={styles.filterTrigger}
              >
                <span
                  style={{
                    color: selectedSpec
                      ? "var(--du-black)"
                      : "var(--du-gray-500)",
                  }}
                >
                  {selectedSpec || "Спеціальність"}
                </span>
              </button>
              <span className={styles.filterChevron}>
                {showSpecFilter ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </span>

              {showSpecFilter && (
                <div className={styles.filterDropdown}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSpec("");
                      setShowSpecFilter(false);
                    }}
                    className={styles.filterOptionMuted}
                  >
                    Усі спеціальності
                  </button>
                  {specialties.map((s) => {
                    const value = `${s.code} ${s.name}`;
                    return (
                      <button
                        type="button"
                        key={s.code}
                        onClick={() => {
                          setSelectedSpec(value);
                          setShowSpecFilter(false);
                        }}
                        className={styles.filterOption}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            className={styles.filterSelect}
            style={GRADIENT_BORDER}
            ref={roleFilterRef}
          >
            <div className={styles.filterSelectInner}>
              <button
                type="button"
                onClick={() => setShowRoleFilter((v) => !v)}
                className={styles.filterTrigger}
              >
                <span
                  style={{
                    color: selectedRole
                      ? "var(--du-black)"
                      : "var(--du-gray-500)",
                  }}
                >
                  {selectedRole || "Роль співавтора"}
                </span>
              </button>
              <span className={styles.filterChevron}>
                {showRoleFilter ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </span>

              {showRoleFilter && (
                <div className={styles.filterDropdown}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("");
                      setShowRoleFilter(false);
                    }}
                    className={styles.filterOptionMuted}
                  >
                    Усі ролі
                  </button>
                  {roles.map((r, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => {
                        setSelectedRole(r);
                        setShowRoleFilter(false);
                      }}
                      className={styles.filterOption}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className={styles.stateText}>Завантаження...</p>
        ) : courses.length === 0 ? (
          <p className={styles.stateTextItalic}>
            Курсів за цими критеріями не знайдено.
          </p>
        ) : (
          <>
            <div className={styles.grid}>
              {visibleCourses.map((course) => (
                <Link
                  href={`/shared-development/course/${course._id}`}
                  key={course._id}
                  className={styles.card}
                >
                  <h3
                    className={styles.cardTitle}
                    style={{
                      fontFamily: '"Diya", var(--font-manrope), sans-serif',
                      fontWeight: 600,
                      fontSize: "28px",
                      lineHeight: "32px",
                      letterSpacing: "-0.56px",
                      verticalAlign: "middle",
                    }}
                  >
                    {course.title}
                  </h3>
                  <p className={styles.cardDescription}>
                    {course.description.length > 200
                      ? course.description.slice(0, 200) + "..."
                      : course.description}
                  </p>
                  <div className={styles.cardAuthor}>
                    {authorNames[course.authorId] || "..."}
                  </div>
                  <div className={styles.tagRow}>
                    {course.requiredRoles.map((r, idx) => (
                      <span key={idx} className={styles.tagOutline}>
                        {r}
                      </span>
                    ))}
                    <span className={styles.tagDark}>{course.specialty}</span>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className={styles.moreWrap}>
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="btn-pill btn-pill-outline text-sm py-2.5 px-6"
                >
                  Показати ще курси
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
