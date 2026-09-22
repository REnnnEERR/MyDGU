"use client";
import { useState, useEffect, use, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { specialties } from "@/data/specialties";
import { roles } from "@/data/roles";
import { ModuleBreadcrumb } from "@/components/Header/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader/SharedDevelopmentHeader";
import {
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/components/icons/icons";
import { api, useAuth, ApiError } from "@/context/AuthContext";
import { ApplicantProfileModal } from "@/components/ApplicantProfileModal/ApplicantProfileModal";
import { MessageModal } from "@/components/MessageModal/MessageModal";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea/AutoResizeTextarea";
import type { Course, CourseApplication, Profile } from "@/types/course";
import styles from "./page.module.css";

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
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTarget, setMessageTarget] = useState<string | null>(null);

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

  async function handleReopenEnrollment() {
    if (!course) return;
    const updated = await api.put<Course>(`/api/courses/${course._id}`, {
      status: "Відкрито",
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

  if (isLoading) {
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

  if (notFound || !course) {
    return (
      <div className={styles.wrapper}>
        <ModuleBreadcrumb
          items={[
            { label: "Спільна розробка курсів", href: "/shared-development" },
          ]}
        />
        <div className={styles.content}>
          <p className={styles.stateText}>Курс не знайдено.</p>
        </div>
      </div>
    );
  }

  const appliedRoleNames = myApplications
    .filter((a) => a.type === "співавтор")
    .map((a) => a.role);

  return (
    <div className={styles.wrapper}>
      <ModuleBreadcrumb
        items={[
          { label: "Спільна розробка курсів", href: "/shared-development" },
          { label: course.title },
        ]}
      />

      <div className={styles.content}>
        {isEditing ? (
          <>
            <SharedDevelopmentHeader
              active="none"
              subtitle="Опишіть курс, оберіть спеціальність і позначте, які ролі співавторів вам потрібні — від графічного дизайнера до фахівця зі ШІ."
            />

            <div className={styles.editForm}>
              <h2 className={styles.editHeading}>Редагування курсу</h2>

              {error && <p className={styles.errorBox}>{error}</p>}

              <div className={styles.fieldGroup}>
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Назва курсу"
                    className={styles.underlineInput}
                  />
                </div>

                <div>
                  <AutoResizeTextarea
                    value={description}
                    onChange={setDescription}
                    placeholder="Короткий опис курсу"
                  />
                </div>

                <div className={styles.comboWrap} ref={specialtyPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowSpecialtyPicker((v) => !v)}
                    className={styles.comboTrigger}
                  >
                    <SearchIcon className="w-4 h-4" />
                    <span
                      style={{
                        color: specialty
                          ? "var(--du-black)"
                          : "var(--du-gray-500)",
                      }}
                    >
                      {specialty || "Спеціальність курсу"}
                    </span>
                    <span className={styles.comboChevron}>
                      {showSpecialtyPicker ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </span>
                  </button>

                  {showSpecialtyPicker && (
                    <div className={styles.comboDropdown}>
                      {specialties.map((s) => {
                        const value = `${s.code} ${s.name}`;
                        return (
                          <label key={s.code} className={styles.comboOption}>
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
                  <p className={styles.rolesLabel}>Яких фахівців шукаєте</p>
                  <div className={styles.rolesGrid}>
                    {roles.map((r) => {
                      const selected = requiredRoles.includes(r);
                      return (
                        <button
                          type="button"
                          key={r}
                          onClick={() => handleRoleToggle(r)}
                          className={styles.roleChip}
                          style={
                            selected
                              ? {
                                  background: "rgba(91,90,255,1)",
                                  color: "#fff",
                                }
                              : {
                                  background: "rgba(255,219,77,1)",
                                  color: "#1a1a1a",
                                }
                          }
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.editActions}>
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
              <div className={styles.topActions}>
                {course.status === "Відкрито" ? (
                  <button
                    onClick={handleCloseEnrollment}
                    className="btn-pill btn-pill-outline text-sm py-2 px-4"
                  >
                    Завершити набір
                  </button>
                ) : (
                  <button
                    onClick={handleReopenEnrollment}
                    className="btn-pill btn-pill-black text-sm py-2 px-4"
                  >
                    Відкрити набір
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

            {error && <p className={styles.errorBox}>{error}</p>}

            <div className={styles.viewGrid}>
              <div>
                <h1 className={styles.title}>{course.title}</h1>
                <span className={styles.specialtyTag}>{course.specialty}</span>

                <h2 className={styles.sectionHeading}>Опис курсу</h2>
                <p className={styles.description}>{course.description}</p>
              </div>

              {isAuthor ? (
                <div className={styles.authorSidebar}>
                  <div className={styles.authorSidebarHeaderRow}>
                    <h3 className={styles.authorSidebarTitle}>
                      Заявки від співрозробників
                    </h3>
                    <Link href="/messages" className={styles.messagesLink}>
                      Повідомлення
                    </Link>
                  </div>
                  {applications.length === 0 ? (
                    <p className={styles.emptyHint}>
                      Поки що немає жодної заявки.
                    </p>
                  ) : (
                    <div className={styles.applicationRows}>
                      {applications.map((app) => (
                        <div key={app._id} className={styles.applicationRow}>
                          <div className={styles.applicationRowTop}>
                            <button
                              onClick={() =>
                                setViewedApplicantId(app.applicantId)
                              }
                              className={styles.applicantNameButton}
                            >
                              {applicantNames[app.applicantId] || "..."}
                            </button>
                            <button
                              onClick={() => {
                                setMessageTarget(app.applicantId);
                                setShowMessageModal(true);
                              }}
                              className={styles.writeButton}
                            >
                              Написати
                            </button>
                          </div>
                          <div className={styles.applicationRoleText}>
                            {app.type === "співавтор"
                              ? `Роль: ${app.role}`
                              : "Записався як слухач"}
                          </div>
                          {app.status === "очікує" ? (
                            <div className={styles.applicationActions}>
                              <button
                                onClick={() =>
                                  handleApplicationStatus(app._id, "відхилено")
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
                              className={
                                app.status === "підтверджено"
                                  ? styles.statusConfirmed
                                  : styles.statusRejected
                              }
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
                </div>
              ) : !user ? (
                <div className={styles.guestBox}>
                  <div className={styles.guestPad}>
                    <h3 className={styles.guestTitleMb}>
                      Бажаєте стати співавтором?
                    </h3>
                    <p className={styles.guestText}>
                      Щоб подати заявку на курс,{" "}
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
              ) : course.status === "Закрито" ? (
                <div className={styles.guestBox}>
                  <div className={styles.guestPad}>
                    <h3 className={styles.guestTitleMb}>Набір завершено</h3>
                    <p className={styles.guestText}>
                      Автор курсу вже закрив набір співрозробників.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.guestBox}>
                  <div className={styles.guestPad}>
                    <div className={styles.sectionInner}>
                      <h3 className={styles.guestTitle}>
                        Бажаєте стати співавтором?
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setMessageTarget(course.authorId);
                        setShowMessageModal(true);
                      }}
                      className="text-sm text-du-blue font-medium hover:underline mt-3"
                    >
                      Написати автору курсу
                    </button>
                  </div>

                  <div className={styles.guestPad} style={{ paddingTop: 0 }}>
                    <div className={styles.sectionInner}>
                      <p className={styles.rolesHint}>
                        Оберіть роль, у якій можете допомогти. Автор курсу
                        отримає вашу заявку.
                      </p>

                      <div className={styles.applyRoles}>
                        {requiredRoles.map((r, i) => {
                          const alreadyApplied = appliedRoleNames.includes(r);
                          const selected = selectedApplyRoles.includes(r);
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={alreadyApplied}
                              onClick={() => toggleApplyRole(r)}
                              className={styles.applyRoleButton}
                              style={
                                alreadyApplied
                                  ? {
                                      background: "rgba(234,234,234,1)",
                                      color: "rgba(140,140,140,1)",
                                      cursor: "default",
                                    }
                                  : selected
                                    ? {
                                        background: "rgba(234,234,234,1)",
                                        color: "#000",
                                      }
                                    : {
                                        border: "2px solid rgba(0,0,0,1)",
                                        color: "#000",
                                      }
                              }
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className={styles.guestPad} style={{ paddingTop: 0 }}>
                    {appliedRoleNames.length < requiredRoles.length && (
                      <button
                        onClick={handleApplyAsCoauthor}
                        disabled={isApplying || selectedApplyRoles.length === 0}
                        className="w-full btn-pill btn-pill-black btn-outline-on-hover text-sm py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Подати заявку
                      </button>
                    )}

                    {appliedRoleNames.length > 0 && (
                      <div
                        className={
                          appliedRoleNames.length < requiredRoles.length
                            ? styles.sentBannerMt
                            : styles.sentBanner
                        }
                      >
                        Заявку надіслано.
                        <br />
                        Автор курсу побачить вашу роль і профіль.
                      </div>
                    )}
                  </div>
                </div>
              )}
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

      {showMessageModal && messageTarget && (
        <MessageModal
          courseId={course._id}
          otherUserId={messageTarget}
          otherUserLabel={
            messageTarget === course.authorId
              ? "Автор курсу"
              : applicantNames[messageTarget] || "Кандидат"
          }
          courseTitle={course.title}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}
