"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react"
import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TiptapLink from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import TiptapUnderline from "@tiptap/extension-underline"
import Highlight from "@tiptap/extension-highlight"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import DOMPurify from "isomorphic-dompurify"
import { marked } from "marked"
import {
  Bold,
  Code,
  Eye,
  Heading1,
  Heading2,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Moon,
  Quote,
  Redo2,
  Save,
  Sun,
  Table2,
  Underline,
  Undo2,
} from "lucide-react"
import { isLikelyImageUrl, uploadFileToCloudinary } from "@/lib/cloudinary-upload"
import { SocialLink } from "@/lib/blog/social-link-extension"
import { SocialLinkNodeView } from "@/components/blog/SocialLinkNodeView"
import { SocialIcon } from "@/components/SocialIcon"
import { BlogPostContent } from "@/components/blog/BlogPostContent"

const AUTOSAVE_KEY = "blog-editor-autosave"
const PREVIEW_DEBOUNCE_MS = 300

type NovelEditorProps = {
  content?: string
  onChange: (val: string) => void
}

function isMarkdownLike(text: string) {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length < 3) return false
  
  // Comprehensive markdown detection patterns:
  // - Headings: # ## ### etc
  // - Lists: - * + or numbered 1. 2. etc
  // - Bold: **text** or __text__
  // - Italic: *text* or _text_
  // - Code: `inline` or ```blocks```
  // - Links: [text](url)
  // - Images: ![alt](url)
  // - Blockquotes: > text
  // - Tables: | col |
  // - Strikethrough: ~~text~~
  // - Horizontal rules: ---, ***, ___
  return /(^|\n)(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|~~~|---|\*\*\*|___|\|.+\||!\[[^\]]*\]\(|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*(?!\*)|_[^_]+_(?!_)|`[^`]+`)/.test(trimmed)
}

function getInitialContent(content?: string) {
  if (!content) return undefined
  try {
    return JSON.parse(content)
  } catch {
    return content
  }
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center border border-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-black text-white" : "bg-[var(--surface)] hover:bg-black hover:text-white"
      }`}
    >
      {children}
    </button>
  )
}

function htmlFromMarkdown(text: string) {
  return marked.parse(text, {
    async: false,
    breaks: true,
    gfm: true,
  }) as string
}

/**
 * Strip HTML tags while preserving markdown structure.
 * Handles Claude-generated HTML output + manually written markdown
 * 
 * Key improvements:
 * 1. Converts block tags to newlines to preserve markdown structure
 * 2. Handles all common HTML entities
 * 3. Preserves inline markdown markers (**, __, ~~, etc.)
 * 4. Cleans up excess whitespace while maintaining readability
 * 5. Handles both HTML-wrapped AI content and raw markdown
 */
function stripHtmlTags(html: string): string {
  let result = html
    // Replace opening block tags with newline (for proper separation)
    .replace(/<(p|div|blockquote|h[1-6]|li|tr|td|th)\b[^>]*>/gi, "\n")
    // Replace closing block tags with double newline (for section breaks)
    .replace(/<\/(p|div|blockquote|h[1-6]|ul|ol|li|table|tr|td|th)\s*>/gi, "\n\n")
    // Convert <br> and self-closing variants to newline
    .replace(/<br\s*\/?>/gi, "\n")
    // Convert list tags
    .replace(/<(ul|ol)\b[^>]*>/gi, "\n")
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities (must be done after tag removal)
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "...")
    // Clean up excessive whitespace and newlines
    .replace(/\n\n\n+/g, "\n\n")
    // Remove trailing/leading whitespace on each line
    .split("\n")
    .map(line => line.trim())
    .join("\n")
    // Final trim
    .trim()

  return result
}

export function NovelEditor({ content, onChange }: NovelEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const previewTimeoutRef = useRef<NodeJS.Timeout>()

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        horizontalRule: {},
        codeBlock: {
          HTMLAttributes: {
            class: "blog-editor-codeblock",
          },
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing, paste AI markdown, or drop an image...",
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      TiptapImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "blog-editor-image",
        },
      }),
      TiptapUnderline,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      SocialLink.extend({
        addNodeView() {
          return ReactNodeViewRenderer(SocialLinkNodeView)
        },
      }),
    ],
    [],
  )

  const updatePreviewHtml = useCallback((editorJson: any) => {
    try {
      const html = generateHTML(editorJson, extensions)
      const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'a', 'b', 'blockquote', 'br', 'code', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'i', 'img', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'table', 'tbody', 'td', 'th',
          'thead', 'tr', 'ul', 'u', 's', 'sup', 'sub'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'data-social-icon', 'data-social-link', 'data-type', 'data-label', 'target', 'rel', 'colspan', 'rowspan'],
        KEEP_CONTENT: true,
      })
      setPreviewHtml(sanitized)
    } catch (err) {
      console.error('Preview render error:', err)
      setPreviewHtml('<p>Error rendering preview</p>')
    }
  }, [extensions])

  const editor = useEditor({
    extensions,
    content: getInitialContent(content),
    editorProps: {
      attributes: {
        class: "blog-editor-prose ProseMirror",
      },
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData("text/html")
        const text = event.clipboardData?.getData("text/plain")

        // Handle image URLs
        if (text && isLikelyImageUrl(text)) {
          event.preventDefault()
          editor?.chain().focus().setImage({ src: text.trim() }).run()
          return true
        }

        // Try text first (for manually written markdown), then fall back to stripped HTML
        // This ensures both AI-generated (HTML-wrapped) and manual markdown work
        const textToCheck = (text && text.trim()) || (html ? stripHtmlTags(html) : "")

        // Enhanced markdown detection that catches all markdown patterns
        if (textToCheck && isMarkdownLike(textToCheck)) {
          event.preventDefault()

          // Prefer plain text if available (manually written), otherwise use stripped HTML (AI-generated)
          const markdownContent = (text && text.trim()) ? text : stripHtmlTags(html || "")
          
          // Convert markdown to HTML
          const markdownHtml = htmlFromMarkdown(markdownContent)
          
          // Clear existing content and insert markdown as properly formatted HTML
          // This ensures markdown is immediately rendered with full formatting
          editor?.chain().focus().clearContent().insertContent(markdownHtml).run()
          return true
        }

        return false
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false
        const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
          file.type.startsWith("image/"),
        )
        if (!files.length) return false

        event.preventDefault()
        void uploadImages(files, editor ?? undefined)
        return true
      },
    },
    onUpdate: ({ editor }) => {
      const next = JSON.stringify(editor.getJSON())
      onChange(next)
      window.localStorage.setItem(AUTOSAVE_KEY, next)
      setSavedAt(new Date())

      // Debounce preview update for performance
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
      previewTimeoutRef.current = setTimeout(() => {
        updatePreviewHtml(editor.getJSON())
      }, PREVIEW_DEBOUNCE_MS)
    },
  })

  const uploadImages = useCallback(async (files: File[], targetEditor = editor) => {
    if (!targetEditor) return
    setIsUploading(true)
    try {
      for (const file of files) {
        const { secureUrl } = await uploadFileToCloudinary(file)
        targetEditor.chain().focus().setImage({ src: secureUrl }).run()
      }
    } finally {
      setIsUploading(false)
    }
  }, [editor])

  useEffect(() => {
    if (!editor || content) return
    const draft = window.localStorage.getItem(AUTOSAVE_KEY)
    if (!draft) return
    try {
      editor.commands.setContent(JSON.parse(draft), false)
      setSavedAt(new Date())
    } catch {
      window.localStorage.removeItem(AUTOSAVE_KEY)
    }
  }, [content, editor])

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [])

  const pickImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFilePicked = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      event.target.value = ""
      await uploadImages(files)
    },
    [uploadImages],
  )

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Paste a link", previousUrl ?? "https://")
    if (url === null) return
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }, [editor])

  const insertSocialLink = useCallback(
    (type: "spotify" | "instagram") => {
      if (!editor) return
      const label = window.prompt(
        type === "spotify" ? "Link label (e.g. Listen On Spotify)" : "Link label (e.g. View Post)",
        type === "spotify" ? "Listen On Spotify" : "View Post",
      )
      if (!label?.trim()) return
      const href = window.prompt(
        type === "spotify" ? "Spotify URL" : "Instagram URL",
        type === "spotify" ? "https://open.spotify.com/" : "https://instagram.com/",
      )
      if (!href?.trim()) return
      editor.chain().focus().setSocialLink({ type, label: label.trim(), href: href.trim() }).run()
    },
    [editor],
  )

  if (!editor) {
    return (
      <div className="blog-editor-shell border border-black bg-[var(--surface)] p-6">
        <p className="blog-font-mono text-xs text-[var(--text-secondary)]">Loading editor...</p>
      </div>
    )
  }

  return (
    <div className={`blog-editor-shell border border-black ${darkMode ? "is-dark" : ""}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilePicked}
      />

      <div className="blog-editor-toolbar sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-black bg-[var(--surface)] p-2">
        <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 border-l border-black" />
        <ToolbarButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Spotify link" onClick={() => insertSocialLink("spotify")}>
          <SocialIcon type="spotify" className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Instagram link" onClick={() => insertSocialLink("instagram")}>
          <SocialIcon type="instagram" className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Upload image" disabled={isUploading} onClick={pickImage}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-6 border-l border-black" />
        <ToolbarButton label="Preview" active={preview} onClick={() => setPreview((value) => !value)}>
          <Eye className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Dark mode" active={darkMode} onClick={() => setDarkMode((value) => !value)}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </ToolbarButton>
        <div className="ml-auto flex min-h-9 items-center gap-2 px-2 text-[10px] text-[var(--text-secondary)]">
          <Save className="h-3.5 w-3.5" />
          <span className="blog-font-mono">
            {isUploading ? "UPLOADING..." : savedAt ? `AUTOSAVED ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "AUTOSAVE READY"}
          </span>
        </div>
      </div>

      <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,1fr)]">
        {preview ? (
          <BlogPostContent
            html={previewHtml}
            className="blog-editor-preview blog-prose prose max-w-none p-4 sm:p-8"
          />
        ) : (
          <EditorContent editor={editor} className="min-h-[520px] p-4 sm:p-8" />
        )}
      </div>
    </div>
  )
}
