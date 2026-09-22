"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { specialties } from "@/data/specialties";
import { roles } from "@/data/roles";
import { ModuleBreadcrumb } from "@/components/Header/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader/SharedDevelopmentHeader";
import {
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/components/icons/icons";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea/AutoResizeTextarea";
import { api, ApiError } from "@/context/AuthContext";
import type { Course } from "@/types/course";
import styles from "./page.module.css";

export default function NewCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const specialtyPickerRef = useRef<HTMLDivElement>(null);

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

  function handleRoleToggle(role: string) {
    setRequiredRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const created = await api.post<Course>("/api/courses", {
        title,
        description,
        specialty,
        requiredRoles,
      });
      router.push(`/shared-development/course/${created._id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не вдалося зберегти курс",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <ModuleBreadcrumb
        items={[
          { label: "Спільна розробка курсів", href: "/shared-development" },
          { label: "Створення курсу" },
        ]}
      />

      <div className={styles.content}>
        <SharedDevelopmentHeader active="none" />

        <div className={styles.formWrap}>
          <h1 className={styles.heading}>Новий курс для спільної розробки</h1>

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
                    color: specialty ? "var(--du-black)" : "var(--du-gray-500)",
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
                          name="course-specialty-new"
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
                          ? { background: "rgba(91,90,255,1)", color: "#fff" }
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

            <button
              onClick={handleSave}
              disabled={isSaving || !title || !specialty}
              className="btn-pill btn-pill-black py-3 px-8 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? "Зберігаємо..." : "Створити курс і відкрити набір"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
