"use client";

import { ClientSideSuspense, useThreads } from "@liveblocks/react/suspense";
import {
  FloatingComposer,
  FloatingThreads,
  useLiveblocksExtension,
} from "@liveblocks/react-tiptap";
import { useState, useEffect } from "react";
import Highlight from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { EditorView } from "prosemirror-view";
import { DocumentSpinner } from "../primitives/Spinner";
import { CustomTaskItem } from "./CustomTaskItem";
import { StaticToolbar, SelectionToolbar } from "./Toolbars";
import { Button } from "../primitives/Button";
import { ThemeToggle } from "./ThemeToggle";
import { ShareIcon } from "lucide-react";
import styles from "./TextEditor.module.css";
import { Avatars } from "./Avatars";
import MarkdownIt from "markdown-it";
import htmlDocx from "html-docx-js/dist/html-docx";
import { saveAs } from "file-saver";

export function TextEditor({ content }: { content: string }) {
  return (
    <ClientSideSuspense fallback={<DocumentSpinner />}>
      <Editor initialMarkdown={content} />
    </ClientSideSuspense>
  );
}

const md = new MarkdownIt();

// Collaborative text editor with simple rich text and live cursors
export function Editor({ initialMarkdown }: { initialMarkdown: string }) {
  const [htmlContent, setHtmlContent] = useState("<p>Loading…</p>");

  // Convert Markdown → HTML once:
  useEffect(() => {
    setHtmlContent(md.render(initialMarkdown));
  }, [initialMarkdown]);

  const liveblocks = useLiveblocksExtension({
    initialContent: htmlContent,
    field: "content",
  });

  // Set up editor with plugins, and place user info into Yjs awareness and cursors
  const editor = useEditor({
    editorProps: {
      attributes: {
        // Add styles to editor element
        class: styles.editor,
      },
    },

    extensions: [
      liveblocks,
      StarterKit.configure({
        blockquote: {
          HTMLAttributes: {
            class: "tiptap-blockquote",
          },
        },
        code: {
          HTMLAttributes: {
            class: "tiptap-code",
          },
        },
        codeBlock: {
          languageClassPrefix: "language-",
          HTMLAttributes: {
            class: "tiptap-code-block",
            spellcheck: false,
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "tiptap-heading",
          },
        },
        // The Collaboration extension comes with its own history handling
        history: false,
        horizontalRule: {
          HTMLAttributes: {
            class: "tiptap-hr",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "tiptap-list-item",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "tiptap-ordered-list",
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: "tiptap-paragraph",
          },
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: "tiptap-highlight",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "tiptap-image",
        },
      }),
      Link.configure({
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing…",
        emptyEditorClass: "tiptap-empty",
      }),
      CustomTaskItem,
      TaskList.configure({
        HTMLAttributes: {
          class: "tiptap-task-list",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Typography,
      Youtube.configure({
        modestBranding: true,
        HTMLAttributes: {
          class: "tiptap-youtube",
        },
      }),
    ],
    autofocus: "start",
  });

  const { threads } = useThreads();

  function exportAsDocx() {
    if (!editor) return;

    // 1. Pull the *live* HTML out of ProseMirror
    let html = editor.getHTML();

    // 2. Replace any numeric-entity emojis with real Unicode
    html = html.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    );

    // 3. Replace YouTube iframes with links
    html = html.replace(
      /<iframe[^>]+src="([^"]+)"[^>]*><\/iframe>/g,
      (_match, src) => `<p><a href="${src}">▶️ Watch video on YouTube</a></p>`
    );

    // 4. Wrap in a full <html>…</html> and inject CSS for code blocks
    const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          /* inline code */
          code {
            font-family: Consolas, monospace;
            background-color: #f0f0f0;
            padding: 2px 4px;
            border-radius: 4px;
          }
          /* code blocks */
          pre {
            font-family: Consolas, monospace;
            background-color: #f8f8f8;
            padding: 8px;
            border-radius: 4px;
          }
          mark {
            background-color: #ffeb3b; 
          }
          a {
            color: #0066cc;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

    // 5. Convert → .docx blob & download
    const blob = htmlDocx.asBlob(fullHtml);
    saveAs(blob, "document.docx");
  }

  return (
    <div className={styles.container}>
      <div className={styles.editorHeader}>
        <ThemeToggle />
        <StaticToolbar editor={editor} />
        {/* <Avatars /> */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Avatars />
          <Button
            className={styles.toolbarButton}
            variant="subtle"
            aria-label="Share"
            // onClick={() => {
            //   // Example: Copy current URL to clipboard
            //   navigator.clipboard.writeText(window.location.href);
            // }}
            onClick={exportAsDocx}
          >
            <ShareIcon style={{ width: "18px" }} />
          </Button>
        </div>
      </div>
      <div className={styles.editorPanel}>
        <SelectionToolbar editor={editor} />
        <EditorContent editor={editor} className={styles.editorContainer} />
        <FloatingComposer editor={editor} style={{ width: 350 }} />
        <FloatingThreads threads={threads} editor={editor} />
      </div>
    </div>
  );
}

// Prevents a matchesNode error on hot reloading
EditorView.prototype.updateState = function updateState(state) {
  // @ts-ignore
  if (!this.docView) return;
  // @ts-ignore
  this.updateStateInner(state, this.state.plugins != state.plugins);
};
