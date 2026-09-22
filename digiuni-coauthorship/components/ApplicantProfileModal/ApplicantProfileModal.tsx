"use client";
import { useEffect, useState } from "react";
import { api } from "@/context/AuthContext";
import type { Profile } from "@/types/course";
import styles from "./ApplicantProfileModal.module.css";

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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <p className={styles.loadingText}>Завантаження...</p>
        ) : !profile ? (
          <p className={styles.emptyText}>Профіль не заповнено.</p>
        ) : (
          <>
            <h3 className={styles.fullName}>{profile.fullName}</h3>
            {profile.about && <p className={styles.about}>{profile.about}</p>}
            {profile.specialties?.length > 0 && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Спеціальності</p>
                <div className={styles.tagRow}>
                  {profile.specialties.map((s, i) => (
                    <span key={i} className={styles.tagDark}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.roles?.length > 0 && (
              <div>
                <p className={styles.sectionLabel}>
                  Ролі, у яких може допомогти
                </p>
                <div className={styles.tagRow}>
                  {profile.roles.map((r, i) => (
                    <span key={i} className={styles.tagLight}>
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
          className={`${styles.closeButton} btn-pill btn-pill-outline text-sm py-2 px-5`}
        >
          Закрити
        </button>
      </div>
    </div>
  );
}
