"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ModuleBreadcrumb } from "@/components/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader";
import { api, useAuth } from "@/context/AuthContext";
import { ApplicantProfileModal } from "@/components/ApplicantProfileModal";
import { EditIcon } from "@/components/icons";
import { getCached, setCached } from "@/lib/listCache";
import type { Course, CourseApplication, Profile } from "@/types/course";

type CoDeveloperItem = {
  application: CourseApplication;
  course: Course | null;
};

type AuthorItem = {
  course: Course;
  applications: CourseApplication[];
  applicantProfiles: Record<string, Profile | null>;
};

type CoDeveloperGroup = {
  course: Course | null;
  applications: CourseApplication[];
};

const STATUS_LABEL: Record<Course["status"], string> = {
  Відкрито: "Набір відкрито",
  Закрито: "Набір закрито",
};

const CO_DEV_CACHE_KEY = "my-courses:co-developer";
const AUTHOR_CACHE_KEY = "my-courses:author";
const PROFILE_CACHE_KEY = "my-courses:my-profile";

export default function MyCourses() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [tab, setTab] = useState<"co-developer" | "author">("co-developer");

  const [coDeveloperItems, setCoDeveloperItems] = useState<CoDeveloperItem[]>(
    () => getCached<CoDeveloperItem[]>(CO_DEV_CACHE_KEY) || [],
  );
  const [myProfile, setMyProfile] = useState<Profile | null>(
    () => getCached<Profile | null>(PROFILE_CACHE_KEY) ?? null,
  );
  const [isCoDevLoading, setIsCoDevLoading] = useState(
    coDeveloperItems.length === 0,
  );
  const hasLoadedCoDevOnce = useRef(coDeveloperItems.length > 0);

  const [authorItems, setAuthorItems] = useState<AuthorItem[]>(
    () => getCached<AuthorItem[]>(AUTHOR_CACHE_KEY) || [],
  );
  const [isAuthorLoading, setIsAuthorLoading] = useState(
    authorItems.length === 0,
  );
  const hasLoadedAuthorOnce = useRef(authorItems.length > 0);

  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [expandedCoDevCourseId, setExpandedCoDevCourseId] = useState<
    string | null
  >(null);
  const [viewedApplicantId, setViewedApplicantId] = useState<string | null>(
    null,
  );

  const loadCoDeveloper = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedCoDevOnce.current) setIsCoDevLoading(true);
    try {
      const [applications, profile] = await Promise.all([
        api.get<CourseApplication[]>("/api/applications/mine"),
        api.get<Profile | null>("/api/profile/me"),
      ]);
      setMyProfile(profile);
      setCached(PROFILE_CACHE_KEY, profile);

      const coDevApps = applications.filter((a) => a.type === "співавтор");
      const items = await Promise.all(
        coDevApps.map(async (application) => {
          try {
            const course = await api.get<Course>(
              `/api/courses/${application.courseId}`,
            );
            return { application, course };
          } catch {
            return { application, course: null };
          }
        }),
      );
      setCoDeveloperItems(items);
      setCached(CO_DEV_CACHE_KEY, items);
      hasLoadedCoDevOnce.current = true;
    } finally {
      setIsCoDevLoading(false);
    }
  }, []);

  const loadAuthor = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedAuthorOnce.current) setIsAuthorLoading(true);
    try {
      const courses = await api.get<Course[]>("/api/courses/mine");
      const items = await Promise.all(
        courses.map(async (course) => {
          try {
            const applications = await api.get<CourseApplication[]>(
              `/api/applications/course/${course._id}`,
            );
            const pending = applications.filter((a) => a.status === "очікує");
            const profileEntries = await Promise.all(
              pending.map(async (a) => {
                try {
                  const profile = await api.get<Profile>(
                    `/api/profile/${a.applicantId}`,
                  );
                  return [a.applicantId, profile] as const;
                } catch {
                  return [a.applicantId, null] as const;
                }
              }),
            );
            return {
              course,
              applications,
              applicantProfiles: Object.fromEntries(profileEntries),
            };
          } catch {
            return { course, applications: [], applicantProfiles: {} };
          }
        }),
      );
      setAuthorItems(items);
      setCached(AUTHOR_CACHE_KEY, items);
      hasLoadedAuthorOnce.current = true;
    } finally {
      setIsAuthorLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadCoDeveloper();
    loadAuthor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Скасувати одну заявку — прибираємо її локально, без повного перезавантаження
  async function cancelApplication(applicationId: string) {
    await api.del(`/api/applications/${applicationId}`);
    setCoDeveloperItems((prev) => {
      const next = prev.filter(
        (item) => item.application._id !== applicationId,
      );
      setCached(CO_DEV_CACHE_KEY, next);
      return next;
    });
  }

  // Скасувати всі заявки, що очікують, по курсу — так само локально
  async function cancelAllPending(applications: CourseApplication[]) {
    if (!confirm("Скасувати заявку на цей курс?")) return;
    const idsToCancel = applications
      .filter((a) => a.status === "очікує")
      .map((a) => a._id);
    await Promise.all(
      idsToCancel.map((id) => api.del(`/api/applications/${id}`)),
    );
    setCoDeveloperItems((prev) => {
      const next = prev.filter(
        (item) => !idsToCancel.includes(item.application._id),
      );
      setCached(CO_DEV_CACHE_KEY, next);
      return next;
    });
  }

  // Прийняти/відхилити заявку — міняємо статус лише в потрібному елементі
  async function respondToApplication(
    applicationId: string,
    status: "підтверджено" | "відхилено",
  ) {
    await api.patch(`/api/applications/${applicationId}`, { status });
    setAuthorItems((prev) => {
      const next = prev.map((item) => ({
        ...item,
        applications: item.applications.map((a) =>
          a._id === applicationId ? { ...a, status } : a,
        ),
      }));
      setCached(AUTHOR_CACHE_KEY, next);
      return next;
    });
  }

  // Завершити/відкрити набір — оновлюємо статус тільки цього курсу
  async function closeEnrollment(courseId: string) {
    await api.put<Course>(`/api/courses/${courseId}`, { status: "Закрито" });
    setAuthorItems((prev) => {
      const next = prev.map((item) =>
        item.course._id === courseId
          ? { ...item, course: { ...item.course, status: "Закрито" as const } }
          : item,
      );
      setCached(AUTHOR_CACHE_KEY, next);
      return next;
    });
  }

  async function reopenEnrollment(courseId: string) {
    await api.put<Course>(`/api/courses/${courseId}`, { status: "Відкрито" });
    setAuthorItems((prev) => {
      const next = prev.map((item) =>
        item.course._id === courseId
          ? { ...item, course: { ...item.course, status: "Відкрито" as const } }
          : item,
      );
      setCached(AUTHOR_CACHE_KEY, next);
      return next;
    });
  }

  if (isAuthLoading) {
    return (
      <div className="flex flex-col flex-1">
        <ModuleBreadcrumb
          items={[
            { label: "Спільна розробка курсів", href: "/shared-development" },
          ]}
        />
        <div className="max-w-[1440px] mx-auto w-full px-20 py-10 text-du-gray-500">
          Завантаження...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col flex-1">
        <ModuleBreadcrumb
          items={[
            { label: "Спільна розробка курсів", href: "/shared-development" },
          ]}
        />
        <div className="max-w-[1440px] mx-auto w-full px-20 py-10">
          <p className="text-du-gray-700">
            Щоб побачити свої курси, спочатку{" "}
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
      <ModuleBreadcrumb
        items={[
          { label: "Спільна розробка курсів", href: "/shared-development" },
        ]}
      />

      <div className="max-w-[1440px] mx-auto w-full px-20 pt-4 pb-10">
        <SharedDevelopmentHeader active="my-courses" />

        <div className="flex items-center gap-6 text-sm font-medium mb-6 border-b border-du-gray-200">
          <button
            onClick={() => setTab("co-developer")}
            className={`pb-3 flex items-center gap-1.5 ${
              tab === "co-developer"
                ? "text-du-black border-b-2 border-du-black"
                : "text-du-gray-500 hover:text-du-black"
            }`}
          >
            Я співрозробник
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-du-black text-du-white text-xs">
              {coDeveloperItems.length}
            </span>
          </button>
          <button
            onClick={() => setTab("author")}
            className={`pb-3 flex items-center gap-1.5 ${
              tab === "author"
                ? "text-du-black border-b-2 border-du-black"
                : "text-du-gray-500 hover:text-du-black"
            }`}
          >
            Я автор
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-du-black text-du-white text-xs">
              {authorItems.length}
            </span>
          </button>
        </div>

        {tab === "co-developer" && (
          <div className="space-y-5">
            {isCoDevLoading ? (
              <p className="text-du-gray-500 py-10 text-center">
                Завантаження...
              </p>
            ) : coDeveloperItems.length === 0 ? (
              <p className="text-du-gray-500 italic py-10 text-center">
                Ви ще не подавали заявок як співрозробник.
              </p>
            ) : (
              (() => {
                const grouped = new Map<string, CoDeveloperGroup>();
                coDeveloperItems.forEach(({ application, course }) => {
                  const key = application.courseId;
                  if (!grouped.has(key)) {
                    grouped.set(key, { course, applications: [] });
                  }
                  grouped.get(key)!.applications.push(application);
                });

                const rawAbout = myProfile?.about || "";
                const myAboutTruncated =
                  rawAbout.length > 200
                    ? rawAbout.slice(0, 200) + "..."
                    : rawAbout;

                return Array.from(grouped.entries()).map(
                  ([courseId, { course, applications }]) => {
                    const rawDescription = course?.description || "";
                    const descriptionTruncated =
                      rawDescription.length > 200
                        ? rawDescription.slice(0, 200) + "..."
                        : rawDescription;

                    const hasConfirmed = applications.some(
                      (a) => a.status === "підтверджено",
                    );
                    const allRejected = applications.every(
                      (a) => a.status === "відхилено",
                    );
                    const hasPending = applications.some(
                      (a) => a.status === "очікує",
                    );
                    const isExpanded = expandedCoDevCourseId === courseId;

                    return (
                      <div
                        key={courseId}
                        style={{
                          backgroundColor: "rgba(234,234,234,1)",
                          ...(isExpanded
                            ? { border: "2px solid rgba(234,234,234,1)" }
                            : {}),
                        }}
                      >
                        <div
                          onClick={() =>
                            setExpandedCoDevCourseId(
                              isExpanded ? null : courseId,
                            )
                          }
                          className="p-6 cursor-pointer"
                        >
                          {course ? (
                            <>
                              <Link
                                href={`/shared-development/course/${course._id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xl font-bold text-du-black hover:underline"
                              >
                                {course.title}
                              </Link>
                              <p className="text-du-gray-700 text-sm mt-2 mb-4">
                                {descriptionTruncated}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {hasConfirmed ? (
                                  <span
                                    className="text-white text-xs px-3 py-1 rounded-full font-semibold"
                                    style={{ background: "rgba(4,198,93,1)" }}
                                  >
                                    Вашу заявку прийнято
                                  </span>
                                ) : allRejected ? (
                                  <span
                                    className="text-white text-xs px-3 py-1 rounded-full font-semibold"
                                    style={{ background: "rgba(255,56,0,1)" }}
                                  >
                                    Вашу заявку відхилено
                                  </span>
                                ) : (
                                  <span className="bg-du-yellow-deep text-du-gray-700 text-xs px-3 py-1 rounded-full font-semibold">
                                    {course.status === "Закрито"
                                      ? "Набір закрито"
                                      : "Набір відкрито"}
                                  </span>
                                )}
                                <span className="bg-du-black text-du-white text-xs px-3 py-1 rounded-full font-semibold">
                                  {course.specialty}
                                </span>
                              </div>
                            </>
                          ) : (
                            <p className="text-du-gray-500 text-sm italic">
                              Курс тимчасово недоступний.
                            </p>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="bg-du-white p-5">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h4 className="font-bold mb-1">Ваша заявка</h4>
                                <p className="text-du-gray-500 text-sm">
                                  Перегляньте заявку, як кандидата, яку отримає
                                  автор курсу.
                                </p>
                              </div>
                              {hasPending && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelAllPending(applications);
                                  }}
                                  className="btn-pill btn-pill-outline text-sm py-2 px-4 shrink-0"
                                >
                                  Скасувати заявку
                                </button>
                              )}
                            </div>
                            <div className="space-y-3">
                              {applications.map((a) => (
                                <div
                                  key={a._id}
                                  className="flex items-center gap-4 p-4"
                                  style={{ background: "rgba(231,238,243,1)" }}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-sm mb-1">
                                      {myProfile?.fullName ||
                                        "Ваш профіль не заповнений"}
                                    </div>
                                    {myAboutTruncated && (
                                      <p className="text-du-gray-500 text-sm">
                                        {myAboutTruncated}
                                      </p>
                                    )}
                                  </div>

                                  <span className="bg-du-white text-du-gray-700 text-xs px-2.5 py-1 rounded-full font-medium shrink-0">
                                    {a.role}
                                  </span>

                                  <div className="shrink-0 min-w-[168px] flex justify-end">
                                    {a.status === "підтверджено" && (
                                      <span
                                        className="text-white text-xs px-2.5 py-1 rounded-full font-semibold"
                                        style={{
                                          background: "rgba(4,198,93,1)",
                                        }}
                                      >
                                        Вашу заявку прийнято
                                      </span>
                                    )}
                                    {a.status === "відхилено" && (
                                      <span
                                        className="text-white text-xs px-2.5 py-1 rounded-full font-semibold"
                                        style={{
                                          background: "rgba(255,56,0,1)",
                                        }}
                                      >
                                        Вашу заявку відхилено
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  },
                );
              })()
            )}
          </div>
        )}

        {tab === "author" && (
          <div className="space-y-5">
            {isAuthorLoading ? (
              <p className="text-du-gray-500 py-10 text-center">
                Завантаження...
              </p>
            ) : authorItems.length === 0 ? (
              <p className="text-du-gray-500 italic py-10 text-center">
                У вас поки немає створених курсів.
              </p>
            ) : (
              authorItems.map(({ course, applications, applicantProfiles }) => {
                const pending = applications.filter(
                  (a) => a.status === "очікує",
                );
                const isExpanded = expandedCourseId === course._id;
                return (
                  <div
                    key={course._id}
                    style={{
                      backgroundColor: "rgba(234,234,234,1)",
                      ...(isExpanded
                        ? { border: "2px solid rgba(234,234,234,1)" }
                        : {}),
                    }}
                  >
                    <div
                      onClick={() =>
                        setExpandedCourseId(isExpanded ? null : course._id)
                      }
                      className="p-6 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {pending.length > 0 && (
                            <span
                              className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full text-white text-xs font-bold shrink-0"
                              style={{ background: "rgba(255,56,0,1)" }}
                            >
                              {pending.length}
                            </span>
                          )}
                          <Link
                            href={`/shared-development/course/${course._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xl font-bold text-du-black hover:underline"
                          >
                            {course.title}
                          </Link>
                        </div>
                        <Link
                          href={`/shared-development/course/${course._id}?edit=1`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-du-gray-500 hover:text-du-black shrink-0"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Link>
                      </div>
                      <p className="text-du-gray-700 text-sm mb-4">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {course.status === "Відкрито" ? (
                          <span className="bg-du-yellow-deep text-du-gray-700 text-xs px-3 py-1 rounded-full font-semibold">
                            {STATUS_LABEL[course.status]}
                          </span>
                        ) : (
                          <span
                            className="text-white text-xs px-3 py-1 rounded-full font-semibold"
                            style={{ background: "rgba(255,56,0,1)" }}
                          >
                            {STATUS_LABEL[course.status]}
                          </span>
                        )}
                        <span className="bg-du-black text-du-white text-xs px-3 py-1 rounded-full font-semibold">
                          {course.specialty}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-du-white p-6">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <h4 className="font-bold text-lg">
                            Заявки від співробітників
                          </h4>
                          {course.status === "Відкрито" ? (
                            <button
                              onClick={() => closeEnrollment(course._id)}
                              className="btn-pill btn-pill-outline text-sm py-2 px-4 shrink-0"
                            >
                              Завершити набір
                            </button>
                          ) : (
                            <button
                              onClick={() => reopenEnrollment(course._id)}
                              className="btn-pill btn-pill-black text-sm py-2 px-4 shrink-0"
                            >
                              Відкрити набір
                            </button>
                          )}
                        </div>
                        <p className="text-du-gray-500 text-sm mb-4">
                          Перегляньте профілі кандидатів і прийміть тих, кого
                          хочете додати до курсу.
                        </p>

                        {pending.length === 0 ? (
                          <p className="text-du-gray-500 text-sm italic">
                            Заявок на розгляді немає.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {pending.map((application) => {
                              const profile =
                                applicantProfiles[application.applicantId];
                              const aboutText = profile?.about || "";
                              const truncatedAbout =
                                aboutText.length > 200
                                  ? aboutText.slice(0, 200) + "..."
                                  : aboutText;

                              return (
                                <div
                                  key={application._id}
                                  className="flex items-center justify-between gap-4 p-4"
                                  style={{ background: "rgba(231,238,243,1)" }}
                                >
                                  <button
                                    onClick={() =>
                                      setViewedApplicantId(
                                        application.applicantId,
                                      )
                                    }
                                    className="min-w-0 text-left"
                                  >
                                    <div className="font-semibold text-sm mb-1 hover:underline">
                                      {profile?.fullName || "Кандидат"}
                                    </div>
                                    {truncatedAbout && (
                                      <p className="text-du-gray-500 text-sm hover:underline">
                                        {truncatedAbout}
                                      </p>
                                    )}
                                  </button>

                                  {application.role && (
                                    <span className="bg-du-white text-du-gray-700 text-xs px-2.5 py-1 rounded-full font-medium shrink-0">
                                      {application.role}
                                    </span>
                                  )}

                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      onClick={() =>
                                        respondToApplication(
                                          application._id,
                                          "підтверджено",
                                        )
                                      }
                                      className="text-white text-xs font-semibold py-1.5 px-4 rounded-full"
                                      style={{ background: "rgba(4,198,93,1)" }}
                                    >
                                      Підтвердити
                                    </button>
                                    <button
                                      onClick={() =>
                                        respondToApplication(
                                          application._id,
                                          "відхилено",
                                        )
                                      }
                                      className="text-white text-xs font-semibold py-1.5 px-4 rounded-full"
                                      style={{ background: "rgba(255,56,0,1)" }}
                                    >
                                      Відхилити
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {viewedApplicantId && (
        <ApplicantProfileModal
          userId={viewedApplicantId}
          onClose={() => setViewedApplicantId(null)}
        />
      )}
    </div>
  );
}
