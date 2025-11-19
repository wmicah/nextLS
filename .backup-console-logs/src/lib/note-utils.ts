/**
 * Utility functions for handling notes in both old (string) and new (array) formats
 */

export type NoteContent =
  | string
  | null
  | Array<{
      id: string;
      content: string;
      title: string | null;
      type: string;
      priority: string;
      isPrivate: boolean;
      createdAt: string;
      updatedAt: string;
      coachId: string;
      clientId: string;
    }>;

/**
 * Safely extracts note content from either string or array format
 * @param notes - The notes field which can be string, null, or array of note objects
 * @returns A string representation of the notes content
 */
export function extractNoteContent(notes: NoteContent): string {
  if (!notes) return "";

  if (typeof notes === "string") {
    return notes;
  }

  if (Array.isArray(notes)) {
    return notes.map(note => note.content).join("\n\n");
  }

  return "";
}

/**
 * Safely extracts the first note's content for display
 * @param notes - The notes field which can be string, null, or array of note objects
 * @returns A string representation of the first note's content
 */
export function extractFirstNoteContent(notes: NoteContent): string {
  if (!notes) return "";

  if (typeof notes === "string") {
    return notes;
  }

  if (Array.isArray(notes) && notes.length > 0) {
    return notes[0]?.content || "";
  }

  return "";
}

/**
 * Checks if notes exist and have content
 * @param notes - The notes field which can be string, null, or array of note objects
 * @returns boolean indicating if notes exist and have content
 */
export function hasNoteContent(notes: NoteContent): boolean {
  if (!notes) return false;

  if (typeof notes === "string") {
    return notes.trim().length > 0;
  }

  if (Array.isArray(notes)) {
    return (
      notes.length > 0 && notes.some(note => note.content.trim().length > 0)
    );
  }

  return false;
}

/**
 * Gets the count of notes
 * @param notes - The notes field which can be string, null, or array of note objects
 * @returns number of notes
 */
export function getNoteCount(notes: NoteContent): number {
  if (!notes) return 0;

  if (typeof notes === "string") {
    return notes.trim().length > 0 ? 1 : 0;
  }

  if (Array.isArray(notes)) {
    return notes.length;
  }

  return 0;
}
