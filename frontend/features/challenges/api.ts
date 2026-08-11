import type { Challenge, ChallengeApiError } from "./types";

export class ChallengeRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ChallengeRequestError";
  }
}

async function parseResponse(response: Response): Promise<Challenge> {
  const body = (await response.json().catch(() => ({}))) as
    | Challenge
    | ChallengeApiError;

  if (!response.ok) {
    const error = body as ChallengeApiError;
    throw new ChallengeRequestError(
      error.error ?? error.detail ?? "Unable to load the challenge.",
      response.status,
    );
  }

  return body as Challenge;
}

// Hàm này gọi BFF của Next thay vì để trình duyệt gọi Django trực tiếp.
export async function getChallenge(
  challengeId: number,
  signal?: AbortSignal,
): Promise<Challenge> {
  const response = await fetch(`/api/challenges/${challengeId}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  return parseResponse(response);
}

// API danh sách được chuẩn bị sẵn; backend sẽ cần hỗ trợ GET collection.
export async function getChallenges(signal?: AbortSignal): Promise<Challenge[]> {
  const response = await fetch("/api/challenges", {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const body = (await response.json().catch(() => ({}))) as
    | Challenge[]
    | ChallengeApiError;

  if (!response.ok) {
    const error = body as ChallengeApiError;
    throw new ChallengeRequestError(
      error.error ?? error.detail ?? "Unable to load challenges.",
      response.status,
    );
  }

  return body as Challenge[];
}
