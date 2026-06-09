import React from "react";
import katex from "katex";

interface MathRendererProps {
  text: string;
}

const sanitizeMath = (math: string): string => {
  if (!math) return "";

  let sanitized = math;

  // 1. Fix missing backslash before end{matrix/pmatrix/bmatrix/etc.}
  sanitized = sanitized.replace(/(?<!\\)end{(matrix|pmatrix|bmatrix|vmatrix|cases)}/g, '\\end{$1}');

  // 2. Fix underscores "___" inside KaTeX causing subscript crash by replacing with escaped underscores inside \text
  sanitized = sanitized.replace(/_{2,}/g, (match) => `\\text{${match.split('').map(() => '\\_').join('')}}`);

  // 3. Fix single underscores that are not used as subscripts (i.e. not preceded by an alphanumeric character, brace, bracket, or backslash)
  // E.g. $_permute$ should become $\_permute$
  sanitized = sanitized.replace(/(?<![a-zA-Z0-9}\)\]\\])_/g, '\\_');

  // 4. Fix row separators inside matrices: if there's a single backslash '\' instead of '\\' separating rows
  // E.g., \begin{pmatrix} 1 & 2 \ 3 & 4 \end{pmatrix} should become \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}
  sanitized = sanitized.replace(/\\begin{(matrix|pmatrix|bmatrix|vmatrix|cases)}(.*?)\\end{\1}/gs, (match, env, content) => {
    // Replace lone backslash '\' with double '\\', ignoring commands starting with \ followed by letters, or existing double backslashes
    const sanitizedContent = content.replace(/\\(?![a-zA-Z\\])/g, '\\\\');
    return `\\begin{${env}}${sanitizedContent}\\end{${env}}`;
  });

  // 5. Fix double backslashes before standard LaTeX commands (e.g. \\sin or \\circ becomes \sin or \circ)
  sanitized = sanitized.replace(/\\\\(?=[a-zA-Z])/g, '\\');

  // 6. Fix missing backslash before cdot
  sanitized = sanitized.replace(/(?<!\\)cdot/g, '\\cdot');

  return sanitized;
};

const ensureMathDelimiters = (text: string): string => {
  if (!text) return "";

  // Normalize literal double backslashes before commands (e.g. \\frac -> \frac)
  let normalized = text.replace(/\\\\(?=[a-zA-Z])/g, "\\");

  // If it already contains math delimiters ($, $$, \[, \() we don't need to auto-wrap
  if (
    normalized.includes("$") ||
    normalized.includes("\\[") ||
    normalized.includes("\\(") ||
    normalized.includes("\\\\(") ||
    normalized.includes("\\\\[")
  ) {
    return normalized;
  }

  // If there are no backslashes, we assume it's normal text
  if (!normalized.includes("\\")) {
    return normalized;
  }

  // 1. Strip all LaTeX commands to check if it's a pure math formula.
  // A command is backslash followed by letters, e.g., \frac, \circ, \theta, \times.
  const stripped = normalized.replace(/\\[a-zA-Z]+/g, "");

  // 2. Check if the stripped text has any "words" (2 or more letters, including accented characters).
  const wordRegex = /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]{2,}/;
  const hasWords = wordRegex.test(stripped);

  if (!hasWords) {
    // It's a pure math formula (e.g. "\frac{11}{16} + \frac{2}{16} = \frac{13}{16}" or "30 \circ").
    // Wrap the entire string in inline math delimiters.
    return `$${normalized}$`;
  } else {
    // It's mixed text (e.g. "¡Hola! Yo convertí \frac{3}{8} a \frac{6}{16}").
    // Wrap only the LaTeX commands and their arguments in inline math delimiters.
    // Match: a backslash, letters, and optionally curly/square bracket groups.
    return normalized.replace(/\\[a-zA-Z]+(?:\s*\[[^\]]*\]|\s*\{[^{}]*\})*/g, (match) => {
      return `$${match}$`;
    });
  }
};

export const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  if (!text) return null;

  // Pre-process raw text to ensure LaTeX expressions are wrapped in standard math delimiters
  const delimitedText = ensureMathDelimiters(text);

  // Pre-process common LaTeX math delimiters to ensure standard KaTeX parsing
  let cleanedText = delimitedText
    .replace(/\\\\\[(.*?)\\\\\]/gs, (_, g1) => `$$${g1}$$`)
    .replace(/\\\[(.*?)\\\]/gs, (_, g1) => `$$${g1}$$`)
    .replace(/\\\\\((.*?)\\\\\)/gs, (_, g1) => `$${g1}$`)
    .replace(/\\\((.*?)\\\)/gs, (_, g1) => `$${g1}$`);

  const blockMaths: string[] = [];
  const inlineMaths: string[] = [];

  // 1. Extract block math $$...$$ first to prevent markdown engines from corrupting math symbols
  let processedText = cleanedText.replace(/\$\$(.*?)\$\$/gs, (match, mathContent) => {
    blockMaths.push(mathContent);
    return `___BLOCK_MATH_${blockMaths.length - 1}___`;
  });

  // 2. Extract inline math $...$
  processedText = processedText.replace(/\$(.*?)\$/g, (match, mathContent) => {
    inlineMaths.push(mathContent);
    return `___INLINE_MATH_${inlineMaths.length - 1}___`;
  });

  // 3. Parse Markdown elements line-by-line
  const lines = processedText.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      continue;
    }

    const isListItem = line.startsWith("- ") || line.startsWith("* ");
    if (isListItem) {
      if (!inList) {
        htmlLines.push("<ul class='my-3.5 space-y-2 list-disc pl-6 text-paper-600 dark:text-paper-300'>");
        inList = true;
      }
      line = line.substring(2).trim();
      line = parseInlineMarkdown(line);
      htmlLines.push(`<li>${line}</li>`);
    } else {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }

      if (line.startsWith("#### ")) {
        line = line.substring(5).trim();
        line = parseInlineMarkdown(line);
        htmlLines.push(`<h4 class="text-xs font-extrabold text-paper-700 dark:text-paper-200 mt-4 mb-1.5 uppercase tracking-wide">${line}</h4>`);
      } else if (line.startsWith("### ")) {
        line = line.substring(4).trim();
        line = parseInlineMarkdown(line);
        htmlLines.push(`<h3 class="text-sm font-black text-paper-800 dark:text-white mt-5 mb-2 uppercase tracking-wide">${line}</h3>`);
      } else if (line.startsWith("## ")) {
        line = line.substring(3).trim();
        line = parseInlineMarkdown(line);
        htmlLines.push(`<h2 class="text-base font-extrabold text-paper-800 dark:text-white mt-6 mb-3 border-b border-paper-100 dark:border-paper-800/60 pb-1.5">${line}</h2>`);
      } else if (line.startsWith("# ")) {
        line = line.substring(2).trim();
        line = parseInlineMarkdown(line);
        htmlLines.push(`<h1 class="text-lg font-black text-paper-900 dark:text-white mt-8 mb-4">${line}</h1>`);
      } else {
        line = parseInlineMarkdown(line);
        htmlLines.push(`<p class="my-3 text-paper-600 dark:text-paper-300 leading-relaxed">${line}</p>`);
      }
    }
  }

  if (inList) {
    htmlLines.push("</ul>");
  }

  let finalHtml = htmlLines.join("\n");

  // 4. Restore block math placeholders with pre-rendered KaTeX blocks
  finalHtml = finalHtml.replace(/___BLOCK_MATH_(\d+)___/g, (match, indexStr) => {
    const idx = parseInt(indexStr);
    const mathContent = blockMaths[idx];
    try {
      const rendered = katex.renderToString(sanitizeMath(mathContent), {
        displayMode: true,
        throwOnError: false,
      });
      return `<div class="my-4 overflow-x-auto text-center py-2.5 bg-paper-100/50 dark:bg-paper-900/40 border border-paper-200/20 dark:border-paper-800/20 rounded-2xl">${rendered}</div>`;
    } catch (e) {
      return `<pre class="text-red-500 text-xs p-2 bg-red-500/10 rounded">${mathContent}</pre>`;
    }
  });

  // 5. Restore inline math placeholders with pre-rendered KaTeX spans
  finalHtml = finalHtml.replace(/___INLINE_MATH_(\d+)___/g, (match, indexStr) => {
    const idx = parseInt(indexStr);
    const mathContent = inlineMaths[idx];
    try {
      const rendered = katex.renderToString(sanitizeMath(mathContent), {
        displayMode: false,
        throwOnError: false,
      });
      return `<span class="inline-block mx-0.5 font-semibold text-primary-600 dark:text-primary-400">${rendered}</span>`;
    } catch (e) {
      return `<code class="text-red-500 bg-red-100 dark:bg-red-950 px-1 rounded">${mathContent}</code>`;
    }
  });

  return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: finalHtml }} />;
};

function parseInlineMarkdown(text: string): string {
  let temp = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold **...**
  temp = temp.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-paper-800 dark:text-white">$1</strong>');
  // Italic *...*
  temp = temp.replace(/\*(.*?)\*/g, '<em class="italic text-paper-700 dark:text-paper-200">$1</em>');
  
  return temp;
}
