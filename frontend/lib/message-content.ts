export type MarkdownMessageRole = "user" | "assistant" | "system";

export function shouldRenderMarkdown(role: MarkdownMessageRole): boolean {
  return role === "assistant";
}
