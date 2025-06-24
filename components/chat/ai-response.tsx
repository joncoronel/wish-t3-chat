"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check } from "lucide-react";
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiHtml5,
  SiCss,
  SiJson,
  SiMarkdown,
  SiGnubash,
  SiYaml,
  SiXml,
  SiDocker,
  SiC,
  SiCplusplus,
  SiGo,
  SiRust,
  SiPhp,
  SiRuby,
  SiSwift,
  SiScala,
  SiSass,
  SiLess,
  SiMysql,
  SiR,
  SiPerl,
  SiLua,
  SiDart,
  SiReact,
  SiVuedotjs,
  SiSvelte,
} from "@icons-pack/react-simple-icons";
import { memo, useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import { type BundledLanguage, codeToHtml } from "shiki";
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";

export type AIResponseProps = HTMLAttributes<HTMLDivElement> & {
  options?: Options;
  children: Options["children"];
};

// Helper function to get appropriate filename and extension based on language
const getFilenameForLanguage = (language: string): string => {
  const languageMap: Record<string, string> = {
    javascript: "script.js",
    typescript: "script.ts",
    python: "script.py",
    java: "Script.java",
    csharp: "Script.cs",
    cpp: "script.cpp",
    c: "script.c",
    go: "script.go",
    rust: "script.rs",
    php: "script.php",
    ruby: "script.rb",
    swift: "script.swift",
    kotlin: "Script.kt",
    scala: "script.scala",
    html: "index.html",
    css: "styles.css",
    scss: "styles.scss",
    sass: "styles.sass",
    less: "styles.less",
    sql: "query.sql",
    bash: "script.sh",
    shell: "script.sh",
    powershell: "script.ps1",
    yaml: "config.yaml",
    yml: "config.yml",
    json: "data.json",
    xml: "data.xml",
    markdown: "README.md",
    md: "README.md",
    dockerfile: "Dockerfile",
    r: "script.R",
    perl: "script.pl",
    lua: "script.lua",
    dart: "script.dart",
    jsx: "component.jsx",
    tsx: "component.tsx",
    vue: "component.vue",
    svelte: "component.svelte",
  };

  return languageMap[language.toLowerCase()] || `code.${language}`;
};

// Helper function to get icon for filename
const getIconForFilename = (filename: string) => {
  // Get file extension
  const extension = filename.toLowerCase().split(".").pop();

  // Direct extension mapping
  const extensionMap: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    js: SiJavascript,
    jsx: SiReact,
    ts: SiTypescript,
    tsx: SiReact,
    py: SiPython,
    html: SiHtml5,
    css: SiCss,
    scss: SiSass,
    sass: SiSass,
    less: SiLess,
    json: SiJson,
    xml: SiXml,
    yaml: SiYaml,
    yml: SiYaml,
    md: SiMarkdown,
    sh: SiGnubash,
    c: SiC,
    cpp: SiCplusplus,
    go: SiGo,
    rs: SiRust,
    swift: SiSwift,
    scala: SiScala,
    php: SiPhp,
    rb: SiRuby,
    r: SiR,
    pl: SiPerl,
    lua: SiLua,
    dart: SiDart,
    sql: SiMysql,
    vue: SiVuedotjs,
    svelte: SiSvelte,
  };

  // Check for special files first
  if (filename === "Dockerfile") {
    return SiDocker;
  }

  // Then check by extension
  if (extension && extensionMap[extension]) {
    return extensionMap[extension];
  }

  return null;
};

// Helper function to download code as file
const downloadCode = (code: string, filename: string) => {
  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Copy button component
const CopyButton = ({
  code,
  onCopy,
  onError,
  timeout = 2000,
}: {
  code: string;
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    if (
      typeof window === "undefined" ||
      !navigator.clipboard.writeText ||
      !code
    ) {
      return;
    }

    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    }, onError);
  };

  const Icon = isCopied ? Check : Copy;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copyToClipboard}
      className="shrink-0"
      title={isCopied ? "Copied!" : "Copy code"}
    >
      <Icon size={14} className="text-muted-foreground" />
    </Button>
  );
};

// Code block component
const CodeBlock = ({
  language,
  code,
  filename,
}: {
  language: string;
  code: string;
  filename: string;
}) => {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    const highlight = async () => {
      try {
        const highlighted = await codeToHtml(code, {
          lang: language as BundledLanguage,
          themes: {
            light: "github-light",
            dark: "github-dark-default",
          },
          transformers: [
            transformerNotationDiff({
              matchAlgorithm: "v3",
            }),
            transformerNotationHighlight({
              matchAlgorithm: "v3",
            }),
            transformerNotationWordHighlight({
              matchAlgorithm: "v3",
            }),
            transformerNotationFocus({
              matchAlgorithm: "v3",
            }),
            transformerNotationErrorLevel({
              matchAlgorithm: "v3",
            }),
          ],
        });
        setHtml(highlighted);
      } catch (error) {
        // Silently fail and show fallback
      }
    };

    highlight();
  }, [code, language]);

  if (!html) {
    // Fallback for when syntax highlighting fails
    return (
      <div className="not-prose border-primary/30 dark:border-primary/20 my-4 h-auto w-full overflow-hidden rounded-md border">
        {/* Header */}
        <div className="bg-primary/20 dark:bg-primary/10 text-secondary-foreground border-primary/30 dark:border-primary/20 flex flex-row items-center border-b p-1">
          <div className="flex grow flex-row items-center gap-2">
            <div className="text-muted-foreground flex items-center gap-2 bg-transparent px-4 py-1.5 text-xs">
              {(() => {
                const Icon = getIconForFilename(filename);
                const FinalIcon = Icon || SiJavascript;
                return <FinalIcon className="h-4 w-4 shrink-0" />;
              })()}
              <span className="flex-1 truncate">{filename}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => downloadCode(code, filename)}
              title="Download code"
              className="shrink-0"
            >
              <Download size={14} className="text-muted-foreground" />
            </Button>
            <CopyButton code={code} />
          </div>
        </div>
        <div className="bg-card dark:bg-muted mt-0 text-sm">
          <pre className="py-0">
            <code className="grid w-full overflow-x-auto bg-transparent py-4">
              {code.split("\n").map((line, i) => (
                <span key={i} className="relative w-full px-4">
                  {line}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="not-prose border-primary/30 dark:border-primary/20 my-4 h-auto w-full overflow-hidden rounded-md border">
      {/* Header */}
      <div className="bg-primary/20 dark:bg-primary/10 text-secondary-foreground border-primary/30 dark:border-primary/20 flex flex-row items-center border-b p-1">
        <div className="flex grow flex-row items-center gap-2">
          <div className="text-muted-foreground flex items-center gap-2 bg-transparent px-4 py-1.5 text-xs">
            {(() => {
              const Icon = getIconForFilename(filename);
              const FinalIcon = Icon || SiJavascript;
              return <FinalIcon className="h-4 w-4 shrink-0" />;
            })()}
            <span className="flex-1 truncate">{filename}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => downloadCode(code, filename)}
            title="Download code"
            className="shrink-0"
          >
            <Download size={14} className="text-muted-foreground" />
          </Button>
          <CopyButton code={code} />
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          "mt-0 text-sm",
          "[&_pre]:py-0",
          "[&_.shiki]:!bg-card",
          "[&_code]:w-full",
          "[&_code]:grid",
          "[&_code]:overflow-x-auto",
          "[&_code]:bg-transparent",
          "[&_code]:py-4",
          "[&_.line]:px-4",
          "[&_.line]:w-full",
          "[&_.line]:relative",
          // Dark mode styles
          "dark:[&_.shiki]:!text-[var(--shiki-dark)]",
          "dark:[&_.shiki]:!bg-muted",
          "dark:[&_.shiki]:![font-style:var(--shiki-dark-font-style)]",
          "dark:[&_.shiki]:![font-weight:var(--shiki-dark-font-weight)]",
          "dark:[&_.shiki]:![text-decoration:var(--shiki-dark-text-decoration)]",
          "dark:[&_.shiki_span]:!text-[var(--shiki-dark)]",
          "dark:[&_.shiki_span]:![font-style:var(--shiki-dark-font-style)]",
          "dark:[&_.shiki_span]:![font-weight:var(--shiki-dark-font-weight)]",
          "dark:[&_.shiki_span]:![text-decoration:var(--shiki-dark-text-decoration)]",
          // Line highlighting
          "[&_.line.highlighted]:bg-[color-mix(in_oklch,_hsl(var(--primary))_8%,_transparent)]",
          "[&_.line.highlighted]:after:bg-primary",
          "[&_.line.highlighted]:after:absolute",
          "[&_.line.highlighted]:after:left-0",
          "[&_.line.highlighted]:after:top-0",
          "[&_.line.highlighted]:after:bottom-0",
          "[&_.line.highlighted]:after:w-0.5",
          "dark:[&_.line.highlighted]:!bg-[color-mix(in_oklch,_hsl(var(--primary))_12%,_transparent)]",
          // Diff highlighting
          "[&_.line.diff]:after:absolute",
          "[&_.line.diff]:after:left-0",
          "[&_.line.diff]:after:top-0",
          "[&_.line.diff]:after:bottom-0",
          "[&_.line.diff]:after:w-0.5",
          "[&_.line.diff.add]:bg-emerald-50",
          "[&_.line.diff.add]:after:bg-emerald-500",
          "[&_.line.diff.remove]:bg-rose-50",
          "[&_.line.diff.remove]:after:bg-rose-500",
          "dark:[&_.line.diff.add]:!bg-emerald-500/10",
          "dark:[&_.line.diff.remove]:!bg-rose-500/10",
          // Focus highlighting
          "[&_code:has(.focused)_.line]:blur-[2px]",
          "[&_code:has(.focused)_.line.focused]:blur-none",
          // Word highlighting
          "bg-[color-mix(in_oklch,_hsl(var(--primary))_25%,_transparent)]! [&_.highlighted-word]:rounded-sm",
          "dark:[&_.highlighted-word]:!bg-[color-mix(in_oklch,_hsl(var(--primary))_30%,_transparent)]!",
        )}
      >
        <div dangerouslySetInnerHTML={{ __html: html || "" }} />
      </div>
    </div>
  );
};

const components: Options["components"] = {
  ol: ({ children, className, ...props }) => (
    <ol className={cn("ml-4 list-outside list-decimal", className)} {...props}>
      {children}
    </ol>
  ),
  li: ({ children, className, ...props }) => (
    <li className={cn("py-1", className)} {...props}>
      {children}
    </li>
  ),
  ul: ({ children, className, ...props }) => (
    <ul className={cn("ml-4 list-outside list-disc", className)} {...props}>
      {children}
    </ul>
  ),
  strong: ({ children, className, ...props }) => (
    <span className={cn("font-semibold", className)} {...props}>
      {children}
    </span>
  ),
  a: ({ children, className, ...props }) => (
    <a
      className={cn("text-primary font-medium underline", className)}
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  h1: ({ children, className, ...props }) => (
    <h1
      className={cn("mt-6 mb-2 text-3xl font-semibold", className)}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, className, ...props }) => (
    <h2
      className={cn("mt-6 mb-2 text-2xl font-semibold", className)}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, className, ...props }) => (
    <h3 className={cn("mt-6 mb-2 text-xl font-semibold", className)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, className, ...props }) => (
    <h4 className={cn("mt-6 mb-2 text-lg font-semibold", className)} {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, className, ...props }) => (
    <h5
      className={cn("mt-6 mb-2 text-base font-semibold", className)}
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, className, ...props }) => (
    <h6 className={cn("mt-6 mb-2 text-sm font-semibold", className)} {...props}>
      {children}
    </h6>
  ),
  code: ({ className, children, ...props }) => {
    // For inline code (no language class), render as simple code element
    if (!className || !className.includes("language-")) {
      return (
        <code
          className={cn(
            "dark:text-primary dark:bg-primary/25 bg-primary/20 text-primary-foreground rounded px-1 py-0.5 text-sm font-medium",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    }

    // For code blocks with language, extract language and render with syntax highlighting
    const match = className.match(/language-(\w+)/);
    const language = match ? match[1] : "text";
    const code = String(children).replace(/\n$/, "");
    const filename = getFilenameForLanguage(language);

    return <CodeBlock language={language} code={code} filename={filename} />;
  },
};

export const AIResponse = memo(
  ({ className, options, children, ...props }: AIResponseProps) => (
    <div
      className={cn(
        "w-full overflow-hidden [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        {...options}
      >
        {children}
      </ReactMarkdown>
    </div>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

AIResponse.displayName = "AIResponse";
