"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionApiError, submitCode } from "@/features/submissions/api";
import type { SubmissionResult } from "@/features/submissions/types";
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAssessmentCheck } from "@/hooks/useAssessmentCheck";
import { challengeQueryKeys } from "@/lib/challenge-query-policy";

interface SubmitArguments {
  challengeId: number;
  code: string;
  language: string;
}

export function useSubmission() {
  const queryClient = useQueryClient();
  const workspace = useChallengeWorkspace();
  const { refreshCurrentUser } = useCurrentUser();
  const { recheckAssessment } = useAssessmentCheck();
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async (input?: Partial<SubmitArguments>) => {
    const resolvedInput: SubmitArguments = {
      challengeId: input?.challengeId ?? workspace.challenge?.challenge_id ?? 0,
      code: input?.code ?? workspace.currentCode,
      language: input?.language ?? workspace.language,
    };

    if (!resolvedInput.challengeId) {
      setError("Open a challenge before submitting code.");
      return null;
    }
    if (!resolvedInput.code.trim()) {
      setError("Write some code before submitting.");
      return null;
    }
    if (!resolvedInput.language.trim()) {
      setError("Select a programming language before submitting.");
      return null;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const nextResult = await submitCode(resolvedInput);
      setResult(nextResult);
      workspace.setSubmissionResult(nextResult);
      void queryClient.invalidateQueries({ queryKey: challengeQueryKeys.all });
      if (nextResult.status === "AC") {
        void refreshCurrentUser();
        
        // Check for new assessments on 100% AC
        if (nextResult.passed_testcases === nextResult.total_testcases) {
          setTimeout(() => recheckAssessment(), 1000); // Small delay for DB consistency
        }
      }
      return nextResult;
    } catch (cause) {
      const message = cause instanceof SubmissionApiError
          ? cause.message
          : "The submission request could not be completed.";
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [workspace, refreshCurrentUser, recheckAssessment, queryClient]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    workspace.setSubmissionResult(null);
  }, [workspace]);

  return { result, error, isSubmitting, submit, clearResult };
}
