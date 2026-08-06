"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ModuleBreadcrumb } from "@/components/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader";
import { api, useAuth } from "@/context/AuthContext";
import { ApplicantProfileModal } from "@/components/ApplicantProfileModal";
import { EditIcon } from "@/components/icons";
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

const STATUS_LABEL: Record<Course["status"], string> = {
  Відкрито: "Набір відкрито",
  Закрито: "Набір закрито",
};

export default function MyCourses() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [tab, setTab] = useState<"co-developer" | "author">("co-developer");

  const [coDeveloperItems, setCoDeveloperItems] = useState<CoDeveloperItem[]>(
    [],
  );
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isCoDevLoading, setIsCoDevLoading] = useState(true);

  const [authorItems, setAuthorItems] = useState<AuthorItem[]>([]);
  const [isAuthorLoading, setIsAuthorLoading] = useState(true);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [viewedApplicantId, setViewedApplicantId] = useState<string | null>(
    null,
  );

  const loadCoDeveloper = useCallback(async () => {
    setIsCoDevLoading(true);
    try {
      const [applications, profile] = await Promise.all([
        api.get<CourseApplication[]>("/api/applications/mine"),
        api.get<Profile | null>("/api/profile/me"),
      ]);
      setMyProfile(profile);

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
    } finally {
      setIsCoDevLoading(false);
    }
  }, []);

  const loadAuthor = useCallback(async () => {
    setIsAuthorLoading(true);
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
    } finally {
      setIsAuthorLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadCoDeveloper();
    loadAuthor();
  }, [user, loadCoDeveloper, loadAuthor]);

  async function cancelApplication(applicationId: string) {
    if (!confirm("Скасувати цю заявку?")) return;
    await api.del(`/api/applications/${applicationId}`);
    loadCoDeveloper();
  }

  async function respondToApplication(
    applicationId: string,
    status: "підтверджено" | "відхилено",
  ) {
    await api.patch(`/api/applications/${applicationId}`, { status });
    loadAuthor();
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
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-du-gray-200 text-du-gray-700 text-xs">
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
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-du-gray-200 text-du-gray-700 text-xs">
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
              coDeveloperItems.map(({ application, course }) => {
                const isPending = application.status === "очікує";
                return (
                  <div
                    key={application._id}
                    className="bg-du-gray-100 rounded-[20px] p-6"
                  >
                    {course ? (
                      <>
                        <Link
                          href={`/shared-development/course/${course._id}`}
                          className="text-xl font-bold text-du-black hover:underline"
                        >
                          {course.title}
                        </Link>
                        <p className="text-du-gray-700 text-sm mt-2 mb-4">
                          {course.description}
                        </p>
                      </>
                    ) : (
                      <p className="text-du-gray-500 text-sm italic mb-4">
                        Курс тимчасово недоступний.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {isPending ? (
                        <span className="bg-du-yellow-deep text-du-gray-700 text-xs px-3 py-1 rounded-full font-semibold">
                          {STATUS_LABEL[course.status]}
                        </span>
                      ) : application.status === "підтверджено" ? (
                        <span className="bg-emerald-600 text-du-white text-xs px-3 py-1 rounded-full font-semibold">
                          Вашу заявку прийнято
                        </span>
                      ) : (
                        <span className="bg-red-600 text-du-white text-xs px-3 py-1 rounded-full font-semibold">
                          Вашу заявку відхилено
                        </span>
                      )}
                      <span className="bg-du-black text-du-white text-xs px-3 py-1 rounded-full font-semibold">
                        {course.specialty}
                      </span>
                    </div>

                    {isPending && (
                      <div className="bg-du-white rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h4 className="font-bold mb-1">Ваша заявка</h4>
                            <p className="text-du-gray-500 text-sm">
                              Перегляньте заявку, як кандидата, яку отримає
                              автор курсу.
                            </p>
                          </div>
                          <button
                            onClick={() => cancelApplication(application._id)}
                            className="btn-pill btn-pill-outline text-sm py-2 px-4 shrink-0"
                          >
                            Скасувати заявку
                          </button>
                        </div>
                        <div className="border-t border-du-gray-200 pt-3">
                          <div className="font-semibold text-sm mb-1">
                            {myProfile?.fullName || "Ваш профіль не заповнений"}
                          </div>
                          {myProfile?.about && (
                            <p className="text-du-gray-500 text-sm mb-2">
                              {myProfile.about}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {(myProfile?.roles || []).map((r, i) => (
                              <span
                                key={i}
                                className="bg-du-gray-100 text-du-gray-700 text-xs px-2.5 py-1 rounded-full font-medium"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
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
                  <div key={course._id} className="bg-du-gray-100">
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
                          {course.status === "Відкрито" && (
                            <button
                              onClick={() => closeEnrollment(course._id)}
                              className="btn-pill btn-pill-outline text-sm py-2 px-4 shrink-0"
                            >
                              Завершити набір
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

async function closeEnrollment(courseId: string) {
  await api.put<Course>(`/api/courses/${courseId}`, { status: "Закрито" });
  loadAuthor();
}
