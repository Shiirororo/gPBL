"use client";

import Editor from "@monaco-editor/react";

import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace";
import { useSubmission } from "@/hooks/useSubmission";

const LANGUAGE_MAP: Record<string, string> = {
  Python: "python",
  Javascript: "javascript",
  Java: "java",
  "C++": "cpp",
  C: "c",
  Go: "go",
};

export default function CodingEditor({ className }: { className?: string }) {
  const { currentCode, language, setCurrentCode, setLanguage } = useChallengeWorkspace();
  const { submit, isSubmitting, error } = useSubmission();

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
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
