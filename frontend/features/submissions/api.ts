import type {
  SubmissionDetail,
  SubmissionResult,
  SubmissionSummary,
  SubmitCodeInput,
} from "./types";

export class SubmissionApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "SubmissionApiError";
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : "The submission request could not be completed.";
    throw new SubmissionApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function submitCode(
  input: SubmitCodeInput,
  signal?: AbortSignal,
): Promise<SubmissionResult> {
  const response = await fetch(`/api/submissions/challenge/${input.challengeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: input.code, language: input.language }),
    signal,
  });

  return readResponse<SubmissionResult>(response);
}

export async function listSubmissions(
  challengeId: number,
  signal?: AbortSignal,
): Promise<SubmissionSummary[]> {
  const response = await fetch(`/api/submissions/challenge/${challengeId}`, { signal });
  return readResponse<SubmissionSummary[]>(response);
}

export async function getSubmission(
  resultId: number,
  signal?: AbortSignal,
): Promise<SubmissionDetail> {
  const response = await fetch(`/api/submissions/${resultId}`, { signal });
  return readResponse<SubmissionDetail>(response);
}
