"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  liveblocksConfig,
  LiveblocksPlugin,
  FloatingToolbar,
} from "@liveblocks/react-lexical";
import { Threads } from "./Threads";
import { $getRoot, $createTextNode, $createParagraphNode } from "lexical";

interface EditorProps {
  content: string;
}

export function Editor({ content }: EditorProps) {
  // Build the Liveblocks config *and* inject your text as the
  // initial editorState, so it’s part of the shared document
  const initialConfig = {
    ...liveblocksConfig({
      namespace: "Demo",
      onError: (err) => {
        console.error(err);
        throw err;
      },
    }),
    editorState: (editor) => {
      if (!content) return;
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(content));
        root.append(paragraph);
      });
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor">
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={<div className="placeholder">Start typing here…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <LiveblocksPlugin>
          <Threads />
          <FloatingToolbar />
        </LiveblocksPlugin>
      </div>
    </LexicalComposer>
  );
}
