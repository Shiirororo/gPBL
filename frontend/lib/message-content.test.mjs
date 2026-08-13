import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { shouldRenderMarkdown } from "./message-content.ts";

test("renders assistant messages as Markdown", () => {
  assert.equal(shouldRenderMarkdown("assistant"), true);
});

test("keeps user and system messages as plain text", () => {
  assert.equal(shouldRenderMarkdown("user"), false);
  assert.equal(shouldRenderMarkdown("system"), false);
});

test("renders GFM without executing raw HTML or unsafe links", () => {
  const markdown = "**Bold**\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n[unsafe](javascript:alert(1))\n\n<script>alert(1)</script>";
  const html = renderToStaticMarkup(
    createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, markdown),
  );

  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /<table>/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.doesNotMatch(html, /<script>/);
});
