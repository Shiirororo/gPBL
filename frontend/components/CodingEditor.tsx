"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef } from "react";
import type { editor as MonacoEditor } from "monaco-editor";

import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace";
import { useSubmission } from "@/hooks/useSubmission";
import {
  canPasteInternalClipboard,
  createInternalClipboard,
  type InternalClipboardData,
} from "@/lib/restricted-clipboard";

const LANGUAGE_MAP: Record<string, string> = {
  Python: "python",
  Javascript: "javascript",
  Java: "java",
  "C++": "cpp",
  C: "c",
  Go: "go",
};

export default function CodingEditor({ className }: { className?: string }) {
  const { challenge, currentCode, language, setCurrentCode, setLanguage } = useChallengeWorkspace();
  const { submit, isSubmitting, error } = useSubmission();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const internalClipboardRef = useRef<InternalClipboardData | null>(null);
  const challengeIdRef = useRef<number | undefined>(challenge?.challenge_id);
  const removeClipboardListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    challengeIdRef.current = challenge?.challenge_id;
    internalClipboardRef.current = null;
  }, [challenge?.challenge_id]);

  useEffect(() => () => {
    removeClipboardListenersRef.current?.();
    removeClipboardListenersRef.current = null;
    internalClipboardRef.current = null;
    editorRef.current = null;
  }, []);

  const handleEditorMount = useCallback<OnMount>((editor) => {
    editorRef.current = editor;
    removeClipboardListenersRef.current?.();

    const domNode = editor.getDomNode();
    if (!domNode) return;

    const saveSelection = (action: InternalClipboardData["action"]) => {
      const model = editor.getModel();
      const selection = editor.getSelection();
      const challengeId = challengeIdRef.current;

      if (!model || !selection || challengeId === undefined) {
        internalClipboardRef.current = null;
        return;
      }

      const text = selection.isEmpty()
        ? `${model.getLineContent(selection.startLineNumber)}${model.getEOL()}`
        : model.getValueInRange(selection);

      internalClipboardRef.current = createInternalClipboard(
        text,
        challengeId,
        action,
      );
    };

    const handleCopy = () => saveSelection("copy");
    const handleCut = () => saveSelection("cut");
    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const internalClipboard = internalClipboardRef.current;
      if (!canPasteInternalClipboard(
        internalClipboard,
        challengeIdRef.current,
      )) {
        return;
      }

      const selections = editor.getSelections();
      if (!selections?.length) return;

      editor.pushUndoStop();
      editor.executeEdits(
        "restricted-internal-clipboard",
        selections.map((selection) => ({
          range: selection,
          text: internalClipboard.text,
          forceMoveMarkers: true,
        })),
      );
      editor.pushUndoStop();
      editor.focus();
    };
    domNode.addEventListener("copy", handleCopy, true);
    domNode.addEventListener("cut", handleCut, true);
    domNode.addEventListener("paste", handlePaste, true);

    removeClipboardListenersRef.current = () => {
      domNode.removeEventListener("copy", handleCopy, true);
      domNode.removeEventListener("cut", handleCut, true);
      domNode.removeEventListener("paste", handlePaste, true);
      removeClipboardListenersRef.current = null;
    };
  }, []);

  return (
    <Card className={`rounded-xl overflow-hidden h-full flex flex-col ${className ?? ""}`}>
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          <CardDescription className="text-lg bold">
            Select language
            <div className="text-sm">Press ` for AI Assistant</div>
          </CardDescription>
          <div className="flex items-center gap-2">
            <LanguageSelector value={language} onChange={setLanguage} />
            <Button
              className="rounded-lg"
              type="button"
              disabled={isSubmitting || !currentCode.trim()}
              onClick={() => void submit()}
            >
              {isSubmitting ? "Submitting..." : "Run & Submit"}
            </Button>
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </CardHeader>

      <CardContent className="relative flex-1 min-h-0 p-0">
        <div className="absolute inset-0">
          <Editor
            height="100%"
            language={LANGUAGE_MAP[language] ?? "plaintext"}
            value={currentCode}
            onChange={(value) => setCurrentCode(value ?? "")}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              dropIntoEditor: { enabled: false },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
