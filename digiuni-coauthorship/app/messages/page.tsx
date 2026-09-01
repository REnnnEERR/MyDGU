"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ModuleBreadcrumb } from "@/components/Header";
import { SharedDevelopmentHeader } from "@/components/SharedDevelopmentHeader";
import { api, useAuth } from "@/context/AuthContext";
import { MessageModal } from "@/components/MessageModal";
import { getCached, setCached } from "@/lib/listCache";
import type { Course, Profile } from "@/types/course";

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
        <div className="max-w-[1440px] mx-auto w-full px-20 py-10 text-du-gray-500">
          Щоб побачити повідомлення, увійдіть в акаунт.
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
        <SharedDevelopmentHeader active="messages" />

        {isLoading ? (
          <p className="text-du-gray-500 py-10 text-center">Завантаження...</p>
        ) : conversations.length === 0 ? (
          <p className="text-du-gray-500 italic py-10 text-center">
            У вас поки немає жодної розмови.
          </p>
        ) : (
          <div className="max-w-2xl space-y-3">
            {conversations.map((c) => (
              <button
                key={`${c.courseId}_${c.otherUserId}`}
                onClick={() => {
                  // Одразу прибираємо позначку непрочитаного локально —
                  // фактичне прочитання бекенд зафіксує при відкритті модалки
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
                className="group w-full text-left p-5 flex items-start justify-between gap-4 bg-du-gray-100 hover:bg-[rgba(204,229,255,1)] transition"
              >
                <div className="min-w-0">
                  <div className="text-sm text-du-gray-500 mb-1 truncate">
                    {c.courseTitle}
                  </div>
                  <div className="font-bold text-lg mb-1">
                    {c.otherUserName}
                  </div>
                  <p className="text-du-gray-700 text-sm truncate">
                    {c.lastMessage.text}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded-full bg-du-black text-du-white text-xs font-bold shrink-0">
                    {c.unreadCount}
                  </span>
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
            // тихе оновлення у фоні — без лоадера, без зникнення списку
            load(true);
          }}
        />
      )}
    </div>
  );
}
