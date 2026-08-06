"use client";
import { useState, useEffect, use, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { specialties } from "@/data/specialties";
import { roles } from "@/data/roles";
import { ModuleBreadcrumb } from "@/components/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/icons";
import { api, useAuth, ApiError } from "@/context/AuthContext";
import { ApplicantProfileModal } from "@/components/ApplicantProfileModal";
import type { Course, CourseApplication, Profile } from "@/types/course";

export default function CourseViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const specialtyPickerRef = useRef<HTMLDivElement>(null);

  const [applications, setApplications] = useState<CourseApplication[]>([]);
  const [applicantNames, setApplicantNames] = useState<Record<string, string>>(
    {},
  );

  const [myApplications, setMyApplications] = useState<CourseApplication[]>([]);
  const [selectedApplyRoles, setSelectedApplyRoles] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [viewedApplicantId, setViewedApplicantId] = useState<string | null>(
    null,
  );

  const isAuthor = !!(user && course && course.authorId === user.id);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAuthor && searchParams.get("edit") === "1" && !isEditing) {
      handleStartEditing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthor, course]);

  const loadCourse = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Course>(`/api/courses/${id}`);
      setCourse(data);
      setTitle(data.title);
      setDescription(data.description);
      setSpecialty(data.specialty);
      setRequiredRoles(data.requiredRoles);
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        specialtyPickerRef.current &&
        !specialtyPickerRef.current.contains(e.target as Node)
      ) {
        setShowSpecialtyPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!course || !user || course.authorId !== user.id) return;
    api
      .get<CourseApplication[]>(`/api/applications/course/${course._id}`)
      .then(async (list) => {
        setApplications(list);
        const uniqueIds = Array.from(new Set(list.map((a) => a.applicantId)));
        const entries = await Promise.all(
          uniqueIds.map(async (uid) => {
            try {
              const profile = await api.get<Profile>(`/api/profile/${uid}`);
              return [uid, profile.fullName] as const;
            } catch {
              return [uid, "Кандидат"] as const;
            }
          }),
        );
        setApplicantNames(Object.fromEntries(entries));
      });
  }, [course, user]);

  useEffect(() => {
    if (!user || !course || isAuthor) return;
    api
      .get<CourseApplication[]>("/api/applications/mine")
      .then((list) =>
        setMyApplications(list.filter((a) => a.courseId === course._id)),
      );
  }, [user, course, isAuthor]);

  function handleRoleToggle(role: string) {
    setRequiredRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function handleStartEditing() {
    if (!course) return;
    setTitle(course.title);
    setDescription(course.description);
    setSpecialty(course.specialty);
    setRequiredRoles(course.requiredRoles);
    setError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    if (!course) return;
    setError(null);
    setIsSaving(true);
    try {
      const updated = await api.put<Course>(`/api/courses/${course._id}`, {
        title,
        description,
        specialty,
        requiredRoles,
      });
      setCourse(updated);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не вдалося зберегти курс",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCloseEnrollment() {
    if (!course) return;
    const updated = await api.put<Course>(`/api/courses/${course._id}`, {
      status: "Закрито",
    });
    setCourse(updated);
  }

  async function handleApplicationStatus(
    applicationId: string,
    status: "підтверджено" | "відхилено",
  ) {
    const updated = await api.patch<CourseApplication>(
      `/api/applications/${applicationId}`,
      {
        status,
      },
    );
    setApplications((prev) =>
      prev.map((a) => (a._id === applicationId ? updated : a)),
    );
  }

  function toggleApplyRole(role: string) {
    setSelectedApplyRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  async function handleApplyAsCoauthor() {
    if (!course || selectedApplyRoles.length === 0) return;
    setError(null);
    setIsApplying(true);
    try {
      const created = await Promise.all(
        selectedApplyRoles.map((role) =>
          api.post<CourseApplication>("/api/applications", {
            courseId: course._id,
            type: "співавтор",
            role,
          }),
        ),
      );
      setMyApplications((prev) => [...prev, ...created]);
      setSelectedApplyRoles([]);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не вдалося подати заявку",
      );
    } finally {
      setIsApplying(false);
    }
  }

  async function handleApplyAsListener() {
    if (!course) return;
    setError(null);
    setIsApplying(true);
    try {
      const application = await api.post<CourseApplication>(
        "/api/applications",
        {
          courseId: course._id,
          type: "слухач",
        },
      );
      setMyApplications((prev) => [...prev, application]);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не вдалося подати заявку",
      );
    } finally {
      setIsApplying(false);
    }
  }

  if (isLoading) {
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

  if (notFound || !course) {
    return (
      <div className="flex flex-col flex-1">
        <ModuleBreadcrumb
          items={[
            { label: "Спільна розробка курсів", href: "/shared-development" },
          ]}
        />
        <div className="max-w-[1440px] mx-auto w-full px-20 py-10 text-du-gray-500">
          Курс не знайдено.
        </div>
      </div>
    );
  }

  const hasAppliedAsCoauthor = myApplications.some(
    (a) => a.type === "співавтор",
  );
  const hasAppliedAsListener = myApplications.some((a) => a.type === "слухач");

  return (
    <div className="flex flex-col flex-1">
      <ModuleBreadcrumb
        items={[
          { label: "Спільна розробка курсів", href: "/shared-development" },
          { label: course.title },
        ]}
      />

      <div className="max-w-[1440px] mx-auto w-full px-20 pt-4 pb-10">
        {isEditing ? (
          <>
            <SharedDevelopmentHeader
              active="none"
              subtitle="Опишіть курс, оберіть спеціальність і позначте, які ролі співавторів вам потрібні — від графічного дизайнера до фахівця зі ШІ."
            />

            <div className="max-w-2xl">
              <h2 className="inline-block text-2xl font-bold border-b-2 border-du-blue pb-1.5 mb-8">
                Редагування курсу
              </h2>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 mb-5">
                  {error}
                </p>
              )}

              <div className="space-y-7">
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Назва курсу"
                    className="w-full bg-transparent border-b border-du-gray-500 pb-2 text-sm focus:outline-none focus:border-du-black placeholder:text-du-gray-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Короткий опис курсу"
                    className="w-full bg-transparent border-b border-du-gray-500 pb-2 text-sm focus:outline-none focus:border-du-black placeholder:text-du-gray-500"
                  />
                </div>

                <div className="relative" ref={specialtyPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowSpecialtyPicker((v) => !v)}
                    className="w-full flex items-center gap-2 border-b border-du-gray-500 pb-2 text-sm text-left"
                  >
                    <SearchIcon className="w-4 h-4 text-du-gray-500" />
                    <span
                      className={
                        specialty ? "text-du-black" : "text-du-gray-500"
                      }
                    >
                      {specialty || "Спеціальність курсу"}
                    </span>
                    <span className="ml-auto text-du-gray-500">
                      {showSpecialtyPicker ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </span>
                  </button>

                  {showSpecialtyPicker && (
                    <div className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto bg-du-white border border-du-gray-200">
                      {specialties.map((s) => {
                        const value = `${s.code} ${s.name}`;
                        return (
                          <label
                            key={s.code}
                            className="flex items-center gap-3 text-sm p-3 hover:bg-du-gray-50 cursor-pointer border-b border-du-gray-100 last:border-b-0"
                          >
                            <input
                              type="radio"
                              name="course-specialty-edit"
                              className="radio-round"
                              checked={specialty === value}
                              onChange={() => {
                                setSpecialty(value);
                                setShowSpecialtyPicker(false);
                              }}
                            />
                            {value}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-du-gray-500 mb-3">
                    Яких фахівців шукаєте
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => {
                      const selected = requiredRoles.includes(r);
                      return (
                        <button
                          type="button"
                          key={r}
                          onClick={() => handleRoleToggle(r)}
                          className={`text-sm px-4 py-2 rounded-full font-medium transition ${
                            selected
                              ? "bg-du-yellow-deep text-du-gray-700"
                              : "bg-du-gray-100 text-du-gray-500 hover:bg-du-gray-200"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !title || !specialty}
                    className="btn-pill btn-pill-black py-3 px-8 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Зберігаємо..." : "Зберегти зміни"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-pill btn-pill-outline py-3 px-8"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {isAuthor && (
              <div className="flex justify-end gap-2 mb-4">
                {course.status === "Відкрито" && (
                  <button
                    onClick={handleCloseEnrollment}
                    className="btn-pill btn-pill-outline text-sm py-2 px-4"
                  >
                    Завершити набір
                  </button>
                )}
                <button
                  onClick={handleStartEditing}
                  className="btn-pill btn-pill-outline text-sm py-2 px-4"
                >
                  Редагувати
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 mb-5">
                {error}
              </p>
            )}

            <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                  {course.title}
                </h1>
                <span className="inline-block bg-du-black text-du-white text-xs px-3 py-1 rounded-full font-semibold mb-6">
                  {course.specialty}
                </span>

                <h2 className="text-xl font-bold border-b border-du-gray-200 pb-2 mb-4">
                  Опис курсу
                </h2>
                <p className="text-du-gray-700 whitespace-pre-line leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="bg-du-gray-100 rounded-[20px] p-6 md:sticky md:top-6">
                {isAuthor ? (
                  <>
                    <h3 className="font-bold text-lg mb-4">
                      Заявки від співрозробників
                    </h3>
                    {applications.length === 0 ? (
                      <p className="text-sm text-du-gray-500 italic">
                        Поки що немає жодної заявки.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {applications.map((app) => (
                          <div
                            key={app._id}
                            className="bg-du-white rounded-2xl p-4"
                          >
                            <button
                              onClick={() =>
                                setViewedApplicantId(app.applicantId)
                              }
                              className="font-semibold text-sm mb-1 hover:underline text-left"
                            >
                              {applicantNames[app.applicantId] || "..."}
                            </button>
                            <div className="text-xs text-du-gray-500 mb-3">
                              {app.type === "співавтор"
                                ? `Роль: ${app.role}`
                                : "Записався як слухач"}
                            </div>
                            {app.status === "очікує" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleApplicationStatus(
                                      app._id,
                                      "відхилено",
                                    )
                                  }
                                  className="btn-pill btn-pill-outline text-xs py-1.5 px-3"
                                >
                                  Відхилити
                                </button>
                                <button
                                  onClick={() =>
                                    handleApplicationStatus(
                                      app._id,
                                      "підтверджено",
                                    )
                                  }
                                  className="btn-pill btn-pill-black text-xs py-1.5 px-3"
                                >
                                  Прийняти
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                  app.status === "підтверджено"
                                    ? "bg-emerald-600 text-du-white"
                                    : "bg-red-600 text-du-white"
                                }`}
                              >
                                {app.status === "підтверджено"
                                  ? "Прийнято"
                                  : "Відхилено"}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : !user ? (
                  <>
                    <h3 className="font-bold text-lg mb-2">
                      Бажаєте стати співавтором?
                    </h3>
                    <p className="text-sm text-du-gray-500 mb-4">
                      Щоб подати заявку на курс,{" "}
                      <Link
                        href="/login"
                        className="text-du-blue font-medium hover:underline"
                      >
                        увійдіть
                      </Link>
                      .
                    </p>
                  </>
                ) : course.status === "Закрито" ? (
                  <>
                    <h3 className="font-bold text-lg mb-2">Набір завершено</h3>
                    <p className="text-sm text-du-gray-500">
                      Автор курсу вже закрив набір співрозробників.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-lg mb-1">
                      Бажаєте стати співавтором?
                    </h3>
                    <p className="text-sm text-du-gray-500 mb-4">
                      Оберіть роль, у якій можете допомогти. Автор курсу отримає
                      вашу заявку.
                    </p>

                    {(() => {
                      const appliedRoles = myApplications.filter(
                        (a) => a.type === "співавтор",
                      );
                      const appliedRoleNames = appliedRoles.map((a) => a.role);
                      const availableRoles = requiredRoles.filter(
                        (r) => !appliedRoleNames.includes(r),
                      );

                      return (
                        <>
                          {appliedRoles.length > 0 && (
                            <div className="space-y-2 mb-4">
                              {appliedRoles.map((a) => (
                                <div
                                  key={a._id}
                                  className="flex items-center justify-between gap-2 bg-du-white rounded-full pl-4 pr-1.5 py-1.5"
                                >
                                  <span className="text-sm">{a.role}</span>
                                  {a.status === "очікує" ? (
                                    <span className="bg-du-yellow-deep text-du-gray-700 text-xs px-3 py-1 rounded-full font-semibold">
                                      Очікує
                                    </span>
                                  ) : a.status === "підтверджено" ? (
                                    <span className="bg-emerald-600 text-du-white text-xs px-3 py-1 rounded-full font-semibold">
                                      Прийнято
                                    </span>
                                  ) : (
                                    <span className="bg-red-600 text-du-white text-xs px-3 py-1 rounded-full font-semibold">
                                      Відхилено
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {availableRoles.length > 0 && (
                            <>
                              <div className="flex flex-col gap-2 mb-4">
                                {availableRoles.map((r, i) => (
                                  <label
                                    key={i}
                                    className="flex items-center gap-2.5 text-sm px-4 py-2 rounded-full border border-du-gray-200 bg-du-white hover:border-du-black cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      className="checkbox-round"
                                      checked={selectedApplyRoles.includes(r)}
                                      onChange={() => toggleApplyRole(r)}
                                    />
                                    {r}
                                  </label>
                                ))}
                              </div>
                              <button
                                onClick={handleApplyAsCoauthor}
                                disabled={
                                  isApplying || selectedApplyRoles.length === 0
                                }
                                className="w-full btn-pill btn-pill-black text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Подати заявку
                              </button>
                            </>
                          )}
                        </>
                      );
                    })()}

                    <div className="border-t border-du-gray-200 mt-5 pt-4">
                      {hasAppliedAsListener ? (
                        <p className="text-sm text-du-gray-700">
                          Ви вже записані на цей курс як слухач.
                        </p>
                      ) : (
                        <button
                          onClick={handleApplyAsListener}
                          disabled={isApplying}
                          className="w-full btn-pill btn-pill-outline text-sm py-2.5 disabled:opacity-40"
                        >
                          Записатися як слухач
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
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
