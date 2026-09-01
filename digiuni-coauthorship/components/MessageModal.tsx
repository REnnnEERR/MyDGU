"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { api, useAuth, ApiError } from "@/context/AuthContext";

type Message = {
  _id: string;
  courseId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
};

export function MessageModal({
  courseId,
  otherUserId,
  otherUserLabel,
  courseTitle,
  onClose,
}: {
  courseId: string;
  otherUserId: string;
  otherUserLabel: string;
  courseTitle?: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await api.get<Message[]>(
        `/api/messages/course/${courseId}/with/${otherUserId}`,
      );
      setMessages(list);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, otherUserId]);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim()) return;
    setError(null);
    setIsSending(true);
    const draft = text.trim();
    try {
      const created = await api.post<Message>("/api/messages", {
        courseId,
        recipientId: otherUserId,
        text: draft,
      });
      setMessages((prev) => [...prev, created]);
      setText("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Не вдалося надіслати повідомлення",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-du-white w-full max-w-2xl flex flex-col"
        style={{ border: "2px solid rgba(0,0,0,1)", height: "640px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5">
          <div
            className="flex items-start justify-between gap-4 pb-5"
            style={{ borderBottom: "2px solid rgba(0,0,0,1)" }}
          >
            <div className="min-w-0">
              {courseTitle && (
                <div className="text-xs text-du-gray-500 mb-1 truncate">
                  {courseTitle}
                </div>
              )}
              <h3 className="text-lg font-bold truncate">{otherUserLabel}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-du-gray-500 hover:text-du-black text-2xl leading-none shrink-0"
              aria-label="Закрити"
            >
              ×
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 py-5 space-y-3"
          style={{ background: "rgba(248,248,246,1)" }}
        >
          {isLoading ? (
            <p className="text-du-gray-500 text-sm">Завантаження...</p>
          ) : messages.length === 0 ? (
            <p className="text-du-gray-500 text-sm italic">
              Повідомлень поки немає. Напишіть перше.
            </p>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === user?.id;
              return (
                <div
                  key={m._id}
                  className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed rounded-full ${
                    isMine ? "ml-auto" : ""
                  }`}
                  style={{
                    background: isMine
                      ? "rgba(234,234,234,1)"
                      : "rgba(231,238,243,1)",
                  }}
                >
                  {m.text}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border-t border-red-200 p-2.5">
            {error}
          </p>
        )}

        <div className="px-6 pb-5">
          <div
            className="flex gap-3 items-end pt-5"
            style={{ borderTop: "2px solid rgba(0,0,0,1)" }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ваше повідомлення..."
              rows={2}
              className="flex-1 border border-du-gray-200 p-3 text-sm focus:outline-none focus:border-du-black resize min-h-[44px] max-h-[240px]"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !text.trim()}
              className="btn-pill btn-pill-black py-3 px-6 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Надіслати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
