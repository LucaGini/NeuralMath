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

  // 3. Fix single underscores that are not used as subscripts (i.e. not preceded by an alphanumeric character, brace, or bracket)
  // E.g. $_permute$ should become $\_permute$
  sanitized = sanitized.replace(/(?<![a-zA-Z0-9}\)\]])_/g, '\\_');

  // 3. Fix row separators inside matrices: if there's a single backslash '\' instead of '\\' separating rows
  // E.g., \begin{pmatrix} 1 & 2 \ 3 & 4 \end{pmatrix} should become \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}
  sanitized = sanitized.replace(/\\begin{(matrix|pmatrix|bmatrix|vmatrix|cases)}(.*?)\\end{\1}/gs, (match, env, content) => {
    // Replace lone backslash '\' with double '\\', ignoring commands starting with \ followed by letters, or existing double backslashes
    const sanitizedContent = content.replace(/\\(?![a-zA-Z\\])/g, '\\\\');
    return `\\begin{${env}}${sanitizedContent}\\end{${env}}`;
  });

  return sanitized;
};

export const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  if (!text) return null;

  // Pre-process common LaTeX math delimiters to ensure standard KaTeX parsing
  let cleanedText = text
    .replace(/\\\\\[(.*?)\\\\\]/gs, '$$$$$1$$$$')
    .replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$$$')
    .replace(/\\\\\((.*?)\\\\\)/gs, '$$1$')
    .replace(/\\\((.*?)\\\)/gs, '$$1$');

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
        htmlLines.push("<ul class='my-3.5 space-y-2 list-disc pl-6 text-slate-600 dark:text-slate-350'>");
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

      if (line.startsWith("### ")) {
        line = line.substring(4).trim();
        line = parseInlineMarkdown(line);
        htmlLines.push(`<h3 class="text-sm font-black text-slate-800 dark:text-white mt-5 mb-2 uppercase tracking-wide">${line}</h3>`);
      } else if (line.startsWith("## ")) {
        line = line.substring(3).trim();
        line = parseInlineMarkdown(line);
        htmlLines.push(`<h2 class="text-base font-extrabold text-slate-850 dark:text-white mt-6 mb-3 border-b border-slate-100 dark:border-slate-850/60 pb-1.5">${line}</h2>`);
      } else if (line.startsWith("# ")) {
        line = line.substring(2).trim();
        line = parseInlineMarkdown(line);
        htmlLines.push(`<h1 class="text-lg font-black text-slate-900 dark:text-white mt-8 mb-4">${line}</h1>`);
      } else {
        line = parseInlineMarkdown(line);
        htmlLines.push(`<p class="my-3 text-slate-650 dark:text-slate-350 leading-relaxed">${line}</p>`);
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
      return `<div class="my-4 overflow-x-auto text-center py-2.5 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-850/20 rounded-2xl">${rendered}</div>`;
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
      return `<span class="inline-block mx-0.5 font-semibold text-mathPurple-600 dark:text-mathPurple-400">${rendered}</span>`;
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
  temp = temp.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-slate-800 dark:text-white">$1</strong>');
  // Italic *...*
  temp = temp.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 dark:text-slate-200">$1</em>');
  
  return temp;
}
