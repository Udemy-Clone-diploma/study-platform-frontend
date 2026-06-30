/**
 * Per-lesson note persistence. There is no notes backend yet, so the lesson
 * player's "Take a note" panel stores text in localStorage keyed by course and
 * lesson. The index lets dashboards list real saved notes without knowing
 * every course/lesson pair in advance.
 */
const NOTE_KEY_PREFIX = "nexo:lesson-note:";
const INDEX_KEY = "nexo:lesson-notes:index";
const NOTES_UPDATED_EVENT = "nexo:lesson-notes-updated";

const key = (slug: string, lessonId: number) => `${NOTE_KEY_PREFIX}${slug}:${lessonId}`;
const noteId = (slug: string, lessonId: number) => `${slug}:${lessonId}`;

export type LessonNoteMetadata = {
  courseTitle?: string;
  courseLevel?: "beginner" | "intermediate" | "advanced";
  lessonTitle?: string;
  lessonOrder?: number | null;
};

export type StoredLessonNote = LessonNoteMetadata & {
  id: string;
  slug: string;
  lessonId: number;
  text: string;
  createdAt: string;
  updatedAt: string;
};

function emitNotesUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTES_UPDATED_EVENT));
}

function readIndex(): StoredLessonNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredLessonNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(notes: StoredLessonNote[]): void {
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(notes));
}

function parseNoteStorageKey(storageKey: string): { slug: string; lessonId: number } | null {
  if (!storageKey.startsWith(NOTE_KEY_PREFIX)) return null;
  const value = storageKey.slice(NOTE_KEY_PREFIX.length);
  const delimiter = value.lastIndexOf(":");
  if (delimiter <= 0) return null;

  const slug = value.slice(0, delimiter);
  const lessonId = Number(value.slice(delimiter + 1));
  if (!slug || !Number.isFinite(lessonId) || lessonId <= 0) return null;

  return { slug, lessonId };
}

function upsertIndexedNote(
  slug: string,
  lessonId: number,
  text: string,
  metadata: LessonNoteMetadata = {},
  options: { preserveUpdatedAt?: boolean } = {},
): void {
  const notes = readIndex();
  const id = noteId(slug, lessonId);
  const existing = notes.find((note) => note.id === id);
  const now = new Date().toISOString();
  const next: StoredLessonNote = {
    ...existing,
    ...metadata,
    id,
    slug,
    lessonId,
    text,
    createdAt: existing?.createdAt || now,
    updatedAt: options.preserveUpdatedAt ? existing?.updatedAt || now : now,
  };

  writeIndex([next, ...notes.filter((note) => note.id !== id)]);
}

export function readLessonNote(slug: string, lessonId: number): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key(slug, lessonId)) ?? "";
  } catch {
    return "";
  }
}

export function writeLessonNote(
  slug: string,
  lessonId: number,
  text: string,
  metadata: LessonNoteMetadata = {},
): void {
  if (typeof window === "undefined") return;
  try {
    const notes = readIndex();
    const id = noteId(slug, lessonId);

    if (text.trim()) {
      window.localStorage.setItem(key(slug, lessonId), text);
      upsertIndexedNote(slug, lessonId, text, metadata);
    } else {
      window.localStorage.removeItem(key(slug, lessonId));
      writeIndex(notes.filter((note) => note.id !== id));
    }

    emitNotesUpdated();
  } catch {
    /* ignore storage failures */
  }
}

export function updateLessonNoteMetadata(
  slug: string,
  lessonId: number,
  metadata: LessonNoteMetadata,
): void {
  if (typeof window === "undefined") return;
  try {
    const text = window.localStorage.getItem(key(slug, lessonId)) ?? "";
    if (!text.trim()) return;
    upsertIndexedNote(slug, lessonId, text, metadata, { preserveUpdatedAt: true });
    emitNotesUpdated();
  } catch {
    /* ignore storage failures */
  }
}

export function readLessonNotes(): StoredLessonNote[] {
  if (typeof window === "undefined") return [];

  const byId = new Map<string, StoredLessonNote>();
  for (const note of readIndex()) {
    if (note.text.trim()) byId.set(note.id, note);
  }

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storageKey = window.localStorage.key(index);
      if (!storageKey) continue;

      const parsed = parseNoteStorageKey(storageKey);
      if (!parsed) continue;

      const text = window.localStorage.getItem(storageKey) ?? "";
      if (!text.trim()) continue;

      const id = noteId(parsed.slug, parsed.lessonId);
      const existing = byId.get(id);
      byId.set(id, {
        ...existing,
        id,
        slug: parsed.slug,
        lessonId: parsed.lessonId,
        text,
        createdAt: existing?.createdAt ?? "",
        updatedAt: existing?.updatedAt ?? "",
      });
    }
  } catch {
    return Array.from(byId.values());
  }

  return Array.from(byId.values());
}

export function subscribeToLessonNotes(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === INDEX_KEY ||
      event.key?.startsWith(NOTE_KEY_PREFIX)
    ) {
      listener();
    }
  };

  window.addEventListener(NOTES_UPDATED_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(NOTES_UPDATED_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}
