"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { roles } from "@/data/roles";
import { specialties } from "@/data/specialties";
import { ModuleBreadcrumb } from "@/components/Header/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader/SharedDevelopmentHeader";
import {
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/components/icons/icons";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea/AutoResizeTextarea";
import { api, useAuth, ApiError } from "@/context/AuthContext";
import type { Profile } from "@/types/course";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState("");
  const [about, setAbout] = useState("");
  const [mySpecialties, setMySpecialties] = useState<string[]>([]);
  const [myRoles, setMyRoles] = useState<string[]>([]);

  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const specialtyPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setIsLoadingProfile(false);
      return;
    }
    api
      .get<Profile | null>("/api/profile/me")
      .then((profile) => {
        if (profile) {
          setFullName(profile.fullName);
          setAbout(profile.about);
          setMySpecialties(profile.specialties || []);
          setMyRoles(profile.roles || []);
        }
      })
      .finally(() => setIsLoadingProfile(false));
  }, [user]);

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

  function handleRoleChange(role: string) {
    setMyRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function handleSpecialtyChange(specialtyValue: string) {
    setMySpecialties((prev) =>
      prev.includes(specialtyValue)
        ? prev.filter((s) => s !== specialtyValue)
        : [...prev, specialtyValue],
    );
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      const updated = await api.put<Profile>("/api/profile/me", {
        fullName,
        about,
        specialties: mySpecialties,
        roles: myRoles,
      });
      setFullName(updated.fullName);
      setAbout(updated.about);
      setMySpecialties(updated.specialties);
      setMyRoles(updated.roles);
      setSaved(true);
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не вдалося зберегти профіль",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isAuthLoading || isLoadingProfile) {
    return (
      <div className={styles.wrapper}>
        <ModuleBreadcrumb
          items={[
            { label: "Спільна розробка курсів", href: "/shared-development" },
            { label: "Мій профіль співрозробника" },
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
            { label: "Мій профіль співрозробника" },
          ]}
        />
        <div className={styles.content}>
          <p>
            Щоб заповнити анкету, спочатку{" "}
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
          { label: "Мій профіль співрозробника" },
        ]}
      />

      <div className={styles.content}>
        <SharedDevelopmentHeader active="none" />

        <div className={styles.formWrap}>
          <h1 className={styles.heading}>Мій профіль співрозробника</h1>

          {error && <p className={styles.errorBox}>{error}</p>}
          {saved && <p className={styles.successBox}>Профіль збережено.</p>}

          <div className={styles.fieldGroup}>
            <div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ім'я та прізвище"
                className={styles.underlineInput}
              />
            </div>

            <div>
              <AutoResizeTextarea
                value={about}
                onChange={setAbout}
                placeholder="Коротко про себе та свій досвід"
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
                    color: mySpecialties.length
                      ? "var(--du-black)"
                      : "var(--du-gray-500)",
                  }}
                >
                  {mySpecialties.length
                    ? `Обрано: ${mySpecialties.length}`
                    : "Мої спеціальності"}
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
                      <label key={s.code} className={styles.checkboxOption}>
                        <input
                          type="checkbox"
                          className="checkbox-round"
                          checked={mySpecialties.includes(value)}
                          onChange={() => handleSpecialtyChange(value)}
                        />
                        {value}
                      </label>
                    );
                  })}
                </div>
              )}

              {mySpecialties.length > 0 && (
                <div className={styles.selectedTags}>
                  {mySpecialties.map((s, i) => (
                    <span key={i} className={styles.selectedTag}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className={styles.rolesLabel}>Ролі, у яких можу допомогти</p>
              <div className={styles.rolesGrid}>
                {roles.map((r) => {
                  const selected = myRoles.includes(r);
                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() => handleRoleChange(r)}
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
              disabled={isSaving || !fullName || mySpecialties.length === 0}
              className="btn-pill btn-pill-black py-3 px-8 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? "Зберігаємо..." : "Зберегти профіль"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
