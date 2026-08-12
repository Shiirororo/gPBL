"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import type { Challenge } from "@/features/challenges/types";
import type { SubmissionResult } from "@/features/submissions/types";

export interface AIMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  sequence?: number;
  codeSnapshot?: string;
}

interface WorkspaceState {
  challenge: Challenge | null;
  currentCode: string;
  language: string;
  conversationId: number | null;
  revision: number;
  messages: AIMessage[];
  submissionResult: SubmissionResult | null;
  loading: boolean;
  error: string | null;
}

type WorkspaceAction =
  | { type: "setChallenge"; challenge: Challenge }
  | { type: "setCode"; code: string }
  | { type: "setLanguage"; language: string }
  | { type: "setConversation"; conversationId: number | null; revision?: number; messages?: AIMessage[] }
  | { type: "setRevision"; revision: number }
  | { type: "setMessages"; messages: AIMessage[] }
  | { type: "appendMessage"; message: AIMessage }
  | { type: "setSubmissionResult"; result: SubmissionResult | null }
  | { type: "setLoading"; loading: boolean }
  | { type: "setError"; error: string | null };

function reducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "setChallenge":
      // Challenge mới khởi tạo workspace mới và không giữ dữ liệu của challenge trước.
      return {
        ...state,
        challenge: action.challenge,
        currentCode: action.challenge.starter_code ?? "",
        conversationId: null,
        revision: 0,
        messages: [],
        submissionResult: null,
        loading: false,
        error: null,
      };
    case "setCode":
      return { ...state, currentCode: action.code };
    case "setLanguage":
      return { ...state, language: action.language };
    case "setConversation":
      return {
        ...state,
        conversationId: action.conversationId,
        revision: action.revision ?? state.revision,
        messages: action.messages ? [...action.messages] : state.messages,
      };
    case "setRevision":
      return { ...state, revision: action.revision };
    case "setMessages":
      return { ...state, messages: [...action.messages] };
    case "appendMessage":
      return { ...state, messages: [...state.messages, action.message] };
    case "setSubmissionResult":
      return { ...state, submissionResult: action.result };
    case "setLoading":
      return { ...state, loading: action.loading };
    case "setError":
      return { ...state, error: action.error, loading: false };
  }
}

export interface ChallengeWorkspaceValue extends WorkspaceState {
  setChallenge: (challenge: Challenge) => void;
  setCurrentCode: (code: string) => void;
  setLanguage: (language: string) => void;
  setConversation: (conversationId: number | null, revision?: number, messages?: AIMessage[]) => void;
  setRevision: (revision: number) => void;
  setMessages: (messages: AIMessage[]) => void;
  appendMessage: (message: AIMessage) => void;
  setSubmissionResult: (result: SubmissionResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const ChallengeWorkspaceContext = createContext<ChallengeWorkspaceValue | null>(null);

interface ChallengeWorkspaceProviderProps {
  children: ReactNode;
  initialChallenge?: Challenge | null;
}

export function ChallengeWorkspaceProvider({
  children,
  initialChallenge = null,
}: ChallengeWorkspaceProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    challenge: initialChallenge,
    currentCode: initialChallenge?.starter_code ?? "",
    language: "Python",
    conversationId: null,
    revision: 0,
    messages: [],
    submissionResult: null,
    loading: initialChallenge === null,
    error: null,
  });

  // Callback ổn định giúp Monaco và ChatBox không render lại vì identity thay đổi.
  const setChallenge = useCallback((challenge: Challenge) => dispatch({ type: "setChallenge", challenge }), []);
  const setCurrentCode = useCallback((code: string) => dispatch({ type: "setCode", code }), []);
  const setLanguage = useCallback((language: string) => dispatch({ type: "setLanguage", language }), []);
  const setConversation = useCallback((conversationId: number | null, revision?: number, messages?: AIMessage[]) => dispatch({ type: "setConversation", conversationId, revision, messages }), []);
  const setRevision = useCallback((revision: number) => dispatch({ type: "setRevision", revision }), []);
  const setMessages = useCallback((messages: AIMessage[]) => dispatch({ type: "setMessages", messages }), []);
  const appendMessage = useCallback((message: AIMessage) => dispatch({ type: "appendMessage", message }), []);
  const setSubmissionResult = useCallback((result: SubmissionResult | null) => dispatch({ type: "setSubmissionResult", result }), []);
  const setLoading = useCallback((loading: boolean) => dispatch({ type: "setLoading", loading }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: "setError", error }), []);

  const value = useMemo(
    () => ({ ...state, setChallenge, setCurrentCode, setLanguage, setConversation, setRevision, setMessages, appendMessage, setSubmissionResult, setLoading, setError }),
    [state, setChallenge, setCurrentCode, setLanguage, setConversation, setRevision, setMessages, appendMessage, setSubmissionResult, setLoading, setError],
  );

  return <ChallengeWorkspaceContext.Provider value={value}>{children}</ChallengeWorkspaceContext.Provider>;
}
