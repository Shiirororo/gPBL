export interface ChallengeReference {
  example: string | null;
  hint: string | null;
}

function normalizeOptionalText(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getChallengeReference(
  example: string | null,
  hint: string | null,
): ChallengeReference {
  return {
    example: normalizeOptionalText(example),
    hint: normalizeOptionalText(hint),
  };
}
