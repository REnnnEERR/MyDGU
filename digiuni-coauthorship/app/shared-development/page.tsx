"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { specialties } from "@/data/specialties";
import { roles } from "@/data/roles";
import { ModuleBreadcrumb } from "@/components/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader";
import { api } from "@/context/AuthContext";
import type { Course, Profile } from "@/types/course";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/icons";

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
    <div className="flex flex-col flex-1">
      <ModuleBreadcrumb items={[{ label: "Спільна розробка курсів" }]} />

      <div className="max-w-[1440px] mx-auto w-full px-20 pt-4 pb-10">
        <SharedDevelopmentHeader active="catalog" />

        <div className="flex flex-nowrap items-center gap-3 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за назвою ..."
              className="w-full h-[48px] bg-transparent pl-1 pr-11 text-sm focus:outline-none placeholder:text-du-gray-500"
              style={{
                ...GRADIENT_BORDER,
                backgroundSize: "100% 2px",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "bottom",
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-du-gray-500">
              <SearchIcon className="w-4 h-4" />
            </span>
          </div>

          <div
            className="relative shrink-0 w-[252px] rounded-full p-[2px]"
            style={GRADIENT_BORDER}
            ref={specFilterRef}
          >
            <div className="relative rounded-full bg-du-white">
              <button
                type="button"
                onClick={() => setShowSpecFilter((v) => !v)}
                className="w-full h-[44px] rounded-full bg-transparent pl-5 pr-9 text-sm text-left truncate"
              >
                <span
                  className={
                    selectedSpec ? "text-du-black" : "text-du-gray-500"
                  }
                >
                  {selectedSpec || "Спеціальність"}
                </span>
              </button>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-du-gray-500 pointer-events-none">
                {showSpecFilter ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </span>

              {showSpecFilter && (
                <div className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto bg-du-white border border-du-gray-200 rounded-2xl shadow-lg p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSpec("");
                      setShowSpecFilter(false);
                    }}
                    className="block w-full text-left text-sm p-2 hover:bg-du-gray-50 rounded-lg text-du-gray-500"
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
                        className="block w-full text-left text-sm p-2 hover:bg-du-gray-50 rounded-lg"
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
            className="relative shrink-0 w-[252px] rounded-full p-[2px]"
            style={GRADIENT_BORDER}
            ref={roleFilterRef}
          >
            <div className="relative rounded-full bg-du-white">
              <button
                type="button"
                onClick={() => setShowRoleFilter((v) => !v)}
                className="w-full h-[44px] rounded-full bg-transparent pl-5 pr-9 text-sm text-left truncate"
              >
                <span
                  className={
                    selectedRole ? "text-du-black" : "text-du-gray-500"
                  }
                >
                  {selectedRole || "Роль співавтора"}
                </span>
              </button>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-du-gray-500 pointer-events-none">
                {showRoleFilter ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </span>

              {showRoleFilter && (
                <div className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto bg-du-white border border-du-gray-200 rounded-2xl shadow-lg p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("");
                      setShowRoleFilter(false);
                    }}
                    className="block w-full text-left text-sm p-2 hover:bg-du-gray-50 rounded-lg text-du-gray-500"
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
                      className="block w-full text-left text-sm p-2 hover:bg-du-gray-50 rounded-lg"
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
          <p className="text-du-gray-500 py-10 text-center">Завантаження...</p>
        ) : courses.length === 0 ? (
          <p className="text-du-gray-500 italic py-10 text-center">
            Курсів за цими критеріями не знайдено.
          </p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {visibleCourses.map((course) => (
                <Link
                  href={`/shared-development/course/${course._id}`}
                  key={course._id}
                  className="group block p-6 bg-du-gray-100 hover:bg-[rgba(204,229,255,1)] transition"
                >
                  <h3
                    className="inline-block text-du-black mb-2 underline decoration-transparent group-hover:decoration-du-black transition-colors"
                    style={{
                      fontFamily: '"Diya", var(--font-manrope), sans-serif',
                      fontWeight: 600,
                      fontSize: "28px",
                      lineHeight: "32px",
                      letterSpacing: "-0.56px",
                      verticalAlign: "middle",
                      textDecorationStyle: "solid",
                      textUnderlineOffset: "4px",
                      textDecorationThickness: "2px",
                    }}
                  >
                    {course.title}
                  </h3>
                  <p className="text-du-gray-700 text-sm line-clamp-3 mb-3">
                    {course.description}
                  </p>
                  <div className="text-xs text-du-gray-500 mb-4">
                    {authorNames[course.authorId] || "..."}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {course.requiredRoles.map((r, idx) => (
                      <span
                        key={idx}
                        className="bg-du-white text-du-gray-700 border border-du-gray-200 text-xs px-3 py-1 rounded-full font-medium"
                      >
                        {r}
                      </span>
                    ))}
                    <span className="bg-du-black text-du-white text-xs px-3 py-1 rounded-full font-medium">
                      {course.specialty}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
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
