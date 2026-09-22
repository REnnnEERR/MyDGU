"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ModuleBreadcrumb } from "@/components/Header/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader/SharedDevelopmentHeader";
import { api, useAuth } from "@/context/AuthContext";
import { ApplicantProfileModal } from "@/components/ApplicantProfileModal/ApplicantProfileModal";
import { EditIcon } from "@/components/icons/icons";
import { getCached, setCached } from "@/lib/listCache";
import type { Course, CourseApplication, Profile } from "@/types/course";
import styles from "./page.module.css";

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

  const [authorItems, setAuthorItems] = useState<AuthorItem[]>(
    () => getCached<AuthorItem[]>(AUTHOR_CACHE_KEY) || [],
  );
  const [isAuthorLoading, setIsAuthorLoading] = useState(
    authorItems.length === 0,
  );

  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [expandedCoDevCourseId, setExpandedCoDevCourseId] = useState<
    string | null
  >(null);
  const [viewedApplicantId, setViewedApplicantId] = useState<string | null>(
    null,
  );

  const loadCoDeveloper = useCallback(async (silent = false) => {
    if (!silent) setIsCoDevLoading(true);
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
    } finally {
      setIsCoDevLoading(false);
    }
  }, []);

  const loadAuthor = useCallback(async (silent = false) => {
    if (!silent) setIsAuthorLoading(true);
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
      <div className={styles.wrapper}>
        <ModuleBreadcrumb
          items={[
            { label: "Спільна розробка курсів", href: "/shared-development" },
          ]}
        />
        <div className={styles.content}>
          <p className={styles.stateText}>Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.wrapper}>
        <ModuleBreadcrumb
          items={[
            { label: "Спільна розробка курсів", href: "/shared-development" },
          ]}
        />
        <div className={styles.content}>
          <p>
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
    <div className={styles.wrapper}>
      <ModuleBreadcrumb
        items={[
          { label: "Спільна розробка курсів", href: "/shared-development" },
        ]}
      />

      <div className={styles.content}>
        <SharedDevelopmentHeader active="my-courses" />

        <div className={styles.tabsRow}>
          <button
            onClick={() => setTab("co-developer")}
            className={
              tab === "co-developer" ? styles.tabButtonActive : styles.tabButton
            }
          >
            Я співрозробник
            <span className={styles.badge}>{coDeveloperItems.length}</span>
          </button>
          <button
            onClick={() => setTab("author")}
            className={
              tab === "author" ? styles.tabButtonActive : styles.tabButton
            }
          >
            Я автор
            <span className={styles.badge}>{authorItems.length}</span>
          </button>
        </div>

        {tab === "co-developer" && (
          <div className={styles.list}>
            {isCoDevLoading ? (
              <p className={styles.stateText}>Завантаження...</p>
            ) : coDeveloperItems.length === 0 ? (
              <p className={styles.stateTextItalic}>
                Ви ще не подавали заявок як співрозробник.
              </p>
            ) : (
              (() => {
                const grouped = new Map<string, CoDeveloperGroup>();
                coDeveloperItems.forEach(({ application, course }) => {
                  const key = application.courseId;
                  if (!grouped.has(key))
                    grouped.set(key, { course, applications: [] });
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
                        className={
                          isExpanded
                            ? styles.groupCardExpanded
                            : styles.groupCard
                        }
                      >
                        <div
                          onClick={() =>
                            setExpandedCoDevCourseId(
                              isExpanded ? null : courseId,
                            )
                          }
                          className={styles.cardHead}
                        >
                          {course ? (
                            <>
                              <Link
                                href={`/shared-development/course/${course._id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={styles.courseLink}
                              >
                                {course.title}
                              </Link>
                              <p className={styles.cardDescription}>
                                {descriptionTruncated}
                              </p>
                              <div className={styles.tagRow}>
                                {hasConfirmed ? (
                                  <span className={styles.tagGreen}>
                                    Вашу заявку прийнято
                                  </span>
                                ) : allRejected ? (
                                  <span className={styles.tagRed}>
                                    Вашу заявку відхилено
                                  </span>
                                ) : (
                                  <span className={styles.tagYellow}>
                                    {course.status === "Закрито"
                                      ? "Набір закрито"
                                      : "Набір відкрито"}
                                  </span>
                                )}
                                <span className={styles.tagDark}>
                                  {course.specialty}
                                </span>
                              </div>
                            </>
                          ) : (
                            <p className={styles.stateTextItalic}>
                              Курс тимчасово недоступний.
                            </p>
                          )}
                        </div>

                        {isExpanded && (
                          <div className={styles.expandedPanel}>
                            <div className={styles.applyBoxHeader}>
                              <div>
                                <h4 className={styles.applyBoxTitle}>
                                  Ваша заявка
                                </h4>
                                <p className={styles.applyBoxSubtitle}>
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
                            <div className={styles.roleRows}>
                              {applications.map((a) => (
                                <div key={a._id} className={styles.roleRow}>
                                  <div className={styles.roleRowName}>
                                    <div className={styles.applicantName}>
                                      {myProfile?.fullName ||
                                        "Ваш профіль не заповнений"}
                                    </div>
                                    {myAboutTruncated && (
                                      <p className={styles.applicantAbout}>
                                        {myAboutTruncated}
                                      </p>
                                    )}
                                  </div>
                                  <span className={styles.roleTag}>
                                    {a.role}
                                  </span>
                                  <div className={styles.roleRowStatus}>
                                    {a.status === "підтверджено" && (
                                      <span className={styles.tagGreen}>
                                        Вашу заявку прийнято
                                      </span>
                                    )}
                                    {a.status === "відхилено" && (
                                      <span className={styles.tagRed}>
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
          <div className={styles.list}>
            {isAuthorLoading ? (
              <p className={styles.stateText}>Завантаження...</p>
            ) : authorItems.length === 0 ? (
              <p className={styles.stateTextItalic}>
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
                    className={
                      isExpanded ? styles.groupCardExpanded : styles.groupCard
                    }
                  >
                    <div
                      onClick={() =>
                        setExpandedCourseId(isExpanded ? null : course._id)
                      }
                      className={styles.cardHead}
                    >
                      <div className={styles.cardHeadRow}>
                        <div className={styles.cardHeadRowLeft}>
                          {pending.length > 0 && (
                            <span className={styles.pendingCircle}>
                              {pending.length}
                            </span>
                          )}
                          <Link
                            href={`/shared-development/course/${course._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className={styles.courseLink}
                          >
                            {course.title}
                          </Link>
                        </div>
                        <Link
                          href={`/shared-development/course/${course._id}?edit=1`}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.editLink}
                        >
                          <EditIcon className="w-4 h-4" />
                        </Link>
                      </div>
                      <p className={styles.cardDescription}>
                        {course.description}
                      </p>
                      <div className={styles.tagRow}>
                        {course.status === "Відкрито" ? (
                          <span className={styles.tagYellow}>
                            Набір відкрито
                          </span>
                        ) : (
                          <span className={styles.tagRed}>Набір закрито</span>
                        )}
                        <span className={styles.tagDark}>
                          {course.specialty}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.expandedPanelLg}>
                        <div className={styles.authorPanelHeader}>
                          <h4 className={styles.authorPanelTitle}>
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
                        <p className={styles.authorPanelHint}>
                          Перегляньте профілі кандидатів і прийміть тих, кого
                          хочете додати до курсу.
                        </p>

                        {pending.length === 0 ? (
                          <p className={styles.stateTextItalic}>
                            Заявок на розгляді немає.
                          </p>
                        ) : (
                          <div className={styles.applicantRows}>
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
                                  className={styles.applicantRow}
                                >
                                  <button
                                    onClick={() =>
                                      setViewedApplicantId(
                                        application.applicantId,
                                      )
                                    }
                                    className={styles.applicantInfoButton}
                                  >
                                    <div className={styles.applicantName}>
                                      {profile?.fullName || "Кандидат"}
                                    </div>
                                    {truncatedAbout && (
                                      <p className={styles.applicantAbout}>
                                        {truncatedAbout}
                                      </p>
                                    )}
                                  </button>

                                  {application.role && (
                                    <span className={styles.roleTag}>
                                      {application.role}
                                    </span>
                                  )}

                                  <div className={styles.applicantActions}>
                                    <button
                                      onClick={() =>
                                        respondToApplication(
                                          application._id,
                                          "підтверджено",
                                        )
                                      }
                                      className={styles.confirmButton}
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
                                      className={styles.rejectButton}
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
