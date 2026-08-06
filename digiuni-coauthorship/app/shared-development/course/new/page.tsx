"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { specialties } from "@/data/specialties";
import { roles } from "@/data/roles";
import { ModuleBreadcrumb } from "@/components/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader";
import { api, ApiError } from "@/context/AuthContext";
import type { Course } from "@/types/course";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/icons";

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
    <div className="flex flex-col flex-1">
      <ModuleBreadcrumb
        items={[
          { label: "Спільна розробка курсів", href: "/shared-development" },
          { label: "Створення курсу" },
        ]}
      />

      <div className="max-w-[1440px] mx-auto w-full px-20 pt-4 pb-10">
        <SharedDevelopmentHeader active="none" />

        <div className="max-w-2xl">
          <h1 className="inline-block text-2xl font-bold border-b-2 border-du-blue pb-1.5 mb-8">
            Новий курс для спільної розробки
          </h1>

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
                  className={specialty ? "text-du-black" : "text-du-gray-500"}
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
                          name="course-specialty"
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
