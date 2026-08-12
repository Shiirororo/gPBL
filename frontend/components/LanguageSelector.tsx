"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const LANGUAGE_OPTIONS = ["Python", "Javascript", "Java", "C++", "C", "Go"] as const;

export default function LanguageSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (language: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => nextValue && onChange(nextValue)}>
      <SelectTrigger className="w-[160px] rounded-lg">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="rounded-lg">
        {LANGUAGE_OPTIONS.map((language) => (
          <SelectItem key={language} value={language}>
            {language === "Javascript" ? "JavaScript" : language}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
