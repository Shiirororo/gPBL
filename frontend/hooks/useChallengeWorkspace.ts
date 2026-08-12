"use client";

import { useContext } from "react";

import { ChallengeWorkspaceContext } from "@/providers/ChallengeWorkspaceProvider";

export function useChallengeWorkspace() {
  const workspace = useContext(ChallengeWorkspaceContext);

  if (!workspace) {
    throw new Error("useChallengeWorkspace must be used inside ChallengeWorkspaceProvider.");
  }

  return workspace;
}
