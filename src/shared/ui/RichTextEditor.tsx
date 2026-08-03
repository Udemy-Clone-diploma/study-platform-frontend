"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { StarterKit } from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Table as TableIcon,
  Columns3,
  Rows3,
  Trash2,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  hideToolbarOnMobile?: boolean;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // Without this, the button click blurs the editor first, collapsing the
      // text selection the command (e.g. toggleBold) was supposed to apply to.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 6,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        background: active ? "var(--color-text-primary)" : "transparent",
        color: active ? "var(--color-bg)" : "var(--color-text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

const contentClassName =
  "px-4 py-3 text-sm leading-relaxed text-(--color-text-primary) focus:outline-none " +
  "[&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-2 " +
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold " +
  "[&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold " +
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-(--color-border-light) [&_blockquote]:pl-3 [&_blockquote]:italic " +
  "[&_code]:rounded [&_code]:bg-(--color-bg) [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs " +
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse " +
  "[&_td]:border [&_td]:border-(--color-border-light) [&_td]:p-2 " +
  "[&_th]:border [&_th]:border-(--color-border-light) [&_th]:bg-(--color-bg) [&_th]:p-2 [&_th]:font-semibold";

/** Rich-text (WYSIWYG) editor for teacher-authored lesson content, backed by Tiptap.
 * Outputs sanitizer-compatible HTML (see sanitizeCourseHtml) — bold/italic/headings/
 * lists/quotes/inline code/tables. No image support yet. */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 160,
  className = "",
  hideToolbarOnMobile = false,
}: Props) {
  const t = useTranslations("RichTextEditor");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: `min-height: ${minHeight}px`,
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
  });

  if (!editor) return null;

  const inTable = editor.isActive("table");

  return (
    <div
      className={className}
      style={{
        border: "1px solid var(--color-border-light)",
        borderRadius: 12,
        background: "var(--color-input-bg)",
        overflow: "hidden",
      }}
    >
      <div
        className={`${hideToolbarOnMobile ? "hidden lg:flex" : "flex"} flex-wrap items-center gap-0.5 border-b border-(--color-border-light) px-2 py-1.5`}
      >
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title={t("bold")}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title={t("italic")}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title={t("heading2")}
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title={t("heading3")}
        >
          <Heading3 size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title={t("bulletList")}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title={t("numberedList")}
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title={t("quote")}
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title={t("inlineCode")}
        >
          <Code size={15} />
        </ToolbarButton>

        <div
          style={{
            width: 1,
            alignSelf: "stretch",
            background: "var(--color-border-light)",
            margin: "2px 6px",
          }}
        />

        {!inTable ? (
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            title={t("insertTable")}
          >
            <TableIcon size={15} />
          </ToolbarButton>
        ) : (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title={t("addRowBelow")}
            >
              <Rows3 size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title={t("addColumnRight")}
            >
              <Columns3 size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title={t("deleteRow")}
            >
              <Rows3 size={15} style={{ opacity: 0.5 }} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title={t("deleteColumn")}
            >
              <Columns3 size={15} style={{ opacity: 0.5 }} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              title={t("deleteTable")}
            >
              <Trash2 size={15} />
            </ToolbarButton>
          </>
        )}
      </div>
      <EditorContent editor={editor} className={contentClassName} />
    </div>
  );
}
