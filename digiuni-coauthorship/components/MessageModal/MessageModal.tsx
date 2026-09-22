"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { api, useAuth, ApiError } from "@/context/AuthContext";
import styles from "./MessageModal.module.css";

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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.headerOuter}>
          <div className={styles.headerInner}>
            <div className={styles.headerText}>
              {courseTitle && (
                <div className={styles.courseTitle}>{courseTitle}</div>
              )}
              <h3 className={styles.otherUserLabel}>{otherUserLabel}</h3>
            </div>
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Закрити"
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.messages}>
          {isLoading ? (
            <p className={styles.emptyText}>Завантаження...</p>
          ) : messages.length === 0 ? (
            <p className={styles.emptyItalic}>
              Повідомлень поки немає. Напишіть перше.
            </p>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === user?.id;
              return (
                <div
                  key={m._id}
                  className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}
                >
                  {m.text}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.footerOuter}>
          <div className={styles.footerInner}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ваше повідомлення..."
              rows={2}
              className={styles.textarea}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !text.trim()}
              className={`${styles.sendButton} btn-pill btn-pill-black py-3 px-6 disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Надіслати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
