"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ModuleBreadcrumb } from "@/components/Header/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader/SharedDevelopmentHeader";
import { api, useAuth } from "@/context/AuthContext";
import { MessageModal } from "@/components/MessageModal/MessageModal";
import { getCached, setCached } from "@/lib/listCache";
import type { Course, Profile } from "@/types/course";
import styles from "./page.module.css";

const CACHE_KEY = "messages:conversations";

type Conversation = {
  courseId: string;
  otherUserId: string;
  lastMessage: { text: string; createdAt: string; senderId: string };
  unreadCount: number;
};

type ConversationView = Conversation & {
  courseTitle: string;
  otherUserName: string;
};

export default function MessagesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationView[]>(
    () => getCached<ConversationView[]>(CACHE_KEY) || [],
  );
  const [isLoading, setIsLoading] = useState(conversations.length === 0);
  const [openConversation, setOpenConversation] =
    useState<ConversationView | null>(null);
  const hasLoadedOnce = useRef(conversations.length > 0);

  const load = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedOnce.current) setIsLoading(true);
    try {
      const list = await api.get<Conversation[]>("/api/messages/conversations");
      const withDetails = await Promise.all(
        list.map(async (c) => {
          const [course, profile] = await Promise.all([
            api.get<Course>(`/api/courses/${c.courseId}`).catch(() => null),
            api.get<Profile>(`/api/profile/${c.otherUserId}`).catch(() => null),
          ]);
          let otherUserName = profile?.fullName || "";
          if (!otherUserName) {
            try {
              const { email } = await api.get<{ email: string }>(
                `/api/auth/user/${c.otherUserId}`,
              );
              otherUserName = email ? email.split("@")[0] : "Користувач";
            } catch {
              otherUserName = "Користувач";
            }
          }
          return {
            ...c,
            courseTitle: course?.title || "Курс недоступний",
            otherUserName,
          };
        }),
      );
      withDetails.sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime(),
      );
      setConversations(withDetails);
      setCached(CACHE_KEY, withDetails);
      hasLoadedOnce.current = true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
          <p className={styles.stateText}>
            Щоб побачити повідомлення, увійдіть в акаунт.
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
        <SharedDevelopmentHeader active="messages" />

        {isLoading ? (
          <p className={styles.stateText}>Завантаження...</p>
        ) : conversations.length === 0 ? (
          <p className={styles.stateTextItalic}>
            У вас поки немає жодної розмови.
          </p>
        ) : (
          <div className={styles.list}>
            {conversations.map((c) => (
              <button
                key={`${c.courseId}_${c.otherUserId}`}
                onClick={() => {
                  setConversations((prev) =>
                    prev.map((item) =>
                      item.courseId === c.courseId &&
                      item.otherUserId === c.otherUserId
                        ? { ...item, unreadCount: 0 }
                        : item,
                    ),
                  );
                  setOpenConversation(c);
                }}
                className={styles.card}
              >
                <div className={styles.cardInfo}>
                  <div className={styles.cardCourse}>{c.courseTitle}</div>
                  <div className={styles.cardName}>{c.otherUserName}</div>
                  <p className={styles.cardPreview}>{c.lastMessage.text}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{c.unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {openConversation && (
        <MessageModal
          courseId={openConversation.courseId}
          otherUserId={openConversation.otherUserId}
          otherUserLabel={openConversation.otherUserName}
          courseTitle={openConversation.courseTitle}
          onClose={() => {
            setOpenConversation(null);
            load(true);
          }}
        />
      )}
    </div>
  );
}
