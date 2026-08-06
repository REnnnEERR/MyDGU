"use client";
import { useEffect, useState } from "react";
import { api } from "@/context/AuthContext";
import type { Profile } from "@/types/course";

export function ApplicantProfileModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<Profile | null>(`/api/profile/${userId}`)
      .then(setProfile)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-du-white rounded-[20px] p-7 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <p className="text-du-gray-500 text-sm">Завантаження...</p>
        ) : !profile ? (
          <p className="text-du-gray-500 text-sm">Профіль не заповнено.</p>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-3">{profile.fullName}</h3>
            {profile.about && (
              <p className="text-du-gray-700 text-sm mb-4">{profile.about}</p>
            )}
            {profile.specialties?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-du-gray-500 mb-1.5">Спеціальності</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.specialties.map((s, i) => (
                    <span
                      key={i}
                      className="bg-du-black text-du-white text-xs px-3 py-1 rounded-full font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.roles?.length > 0 && (
              <div>
                <p className="text-xs text-du-gray-500 mb-1.5">
                  Ролі, у яких може допомогти
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.roles.map((r, i) => (
                    <span
                      key={i}
                      className="bg-du-gray-100 text-du-gray-700 text-xs px-3 py-1 rounded-full font-medium"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <button
          onClick={onClose}
          className="btn-pill btn-pill-outline text-sm py-2 px-5 mt-6"
        >
          Закрити
        </button>
      </div>
    </div>
  );
}
