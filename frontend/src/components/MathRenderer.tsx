import React from "react";
import katex from "katex";

interface MathRendererProps {
  text: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  if (!text) return null;

  // Split text by $$ (block math expressions)
  const blockParts = text.split(/\$\$(.*?)\$\$/gs);

  return (
    <>
      {blockParts.map((blockPart, blockIdx) => {
        const isBlock = blockIdx % 2 === 1;

        if (isBlock) {
          try {
            const html = katex.renderToString(blockPart, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <div
                key={blockIdx}
                className="my-4 overflow-x-auto text-center py-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return (
              <pre key={blockIdx} className="text-red-500 text-sm overflow-auto">
                {blockPart}
              </pre>
            );
          }
        }

        // Split remaining string by $ (inline math expressions)
        const inlineParts = blockPart.split(/\$(.*?)\$/g);
        return (
          <span key={blockIdx} className="whitespace-pre-wrap">
            {inlineParts.map((inlinePart, inlineIdx) => {
              const isInline = inlineIdx % 2 === 1;
              if (isInline) {
                try {
                  const html = katex.renderToString(inlinePart, {
                    displayMode: false,
                    throwOnError: false,
                  });
                  return (
                    <span
                      key={inlineIdx}
                      className="inline-block mx-0.5 font-semibold text-mathPurple-600 dark:text-mathPurple-400"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                } catch (e) {
                  return (
                    <code key={inlineIdx} className="text-red-500 bg-red-100 dark:bg-red-950 px-1 rounded">
                      {inlinePart}
                    </code>
                  );
                }
              }
              return inlinePart;
            })}
          </span>
        );
      })}
    </>
  );
};
