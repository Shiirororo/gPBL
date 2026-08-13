export const INTERNAL_CLIPBOARD_TTL_MS = 10 * 60 * 1_000;

export interface InternalClipboardData {
  text: string;
  challengeId: number;
  action: "copy" | "cut";
  copiedAt: number;
}

export function createInternalClipboard(
  text: string,
  challengeId: number,
  action: InternalClipboardData["action"],
  copiedAt = Date.now(),
): InternalClipboardData {
  return { text, challengeId, action, copiedAt };
}

export function canPasteInternalClipboard(
  clipboard: InternalClipboardData | null,
  challengeId: number | undefined,
  now = Date.now(),
): clipboard is InternalClipboardData {
  if (!clipboard || challengeId === undefined || !clipboard.text) return false;

  const age = now - clipboard.copiedAt;
  return clipboard.challengeId === challengeId
    && age >= 0
    && age <= INTERNAL_CLIPBOARD_TTL_MS;
}
