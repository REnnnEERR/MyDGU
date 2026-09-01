"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { roles } from "@/data/roles";
import { specialties } from "@/data/specialties";
import { ModuleBreadcrumb } from "@/components/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader";
import { api, useAuth, ApiError } from "@/context/AuthContext";
import type { Profile } from "@/types/course";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/icons";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";

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
      <div className="flex flex-col flex-1">
        <ModuleBreadcrumb
          items={[
            { label: "Спільна розробка курсів", href: "/shared-development" },
            { label: "Мій профіль співрозробника" },
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
            { label: "Мій профіль співрозробника" },
          ]}
        />
        <div className="max-w-[1440px] mx-auto w-full px-20 py-10">
          <p className="text-du-gray-700">
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
    <div className="flex flex-col flex-1">
      <ModuleBreadcrumb
        items={[
          { label: "Спільна розробка курсів", href: "/shared-development" },
          { label: "Мій профіль співрозробника" },
        ]}
      />

      <div className="max-w-[1440px] mx-auto w-full px-20 pt-4 pb-10">
        <SharedDevelopmentHeader active="none" />

        <div className="max-w-2xl">
          <h1 className="inline-block text-2xl font-bold border-b-2 border-du-blue pb-1.5 mb-8">
            Мій профіль співрозробника
          </h1>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 mb-5">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mb-5">
              Профіль збережено.
            </p>
          )}

          <div className="space-y-7">
            <div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ім'я та прізвище"
                className="w-full bg-transparent border-b border-du-gray-500 pb-2 text-sm focus:outline-none focus:border-du-black placeholder:text-du-gray-500"
              />
            </div>

            <div>
              <AutoResizeTextarea
                value={about}
                onChange={setAbout}
                placeholder="Коротко про себе та свій досвід"
                className="w-full"
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
                    mySpecialties.length ? "text-du-black" : "text-du-gray-500"
                  }
                >
                  {mySpecialties.length
                    ? `Обрано: ${mySpecialties.length}`
                    : "Мої спеціальності"}
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
                <div className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto bg-du-white border border-du-gray-200 rounded-2xl shadow-lg p-2">
                  {specialties.map((s) => {
                    const value = `${s.code} ${s.name}`;
                    return (
                      <label
                        key={s.code}
                        className="flex items-center gap-2 text-sm p-2 hover:bg-du-gray-50 rounded-lg cursor-pointer"
                      >
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
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {mySpecialties.map((s, i) => (
                    <span
                      key={i}
                      className="bg-du-gray-100 text-du-gray-700 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-du-gray-500 mb-3">
                Ролі, у яких можу допомогти
              </p>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const selected = myRoles.includes(r);
                  return (
                    <button
                      type="button"
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className="text-sm px-4 py-2 rounded-full font-medium transition"
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
