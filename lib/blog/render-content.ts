import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"
import TiptapLink from "@tiptap/extension-link"
import TiptapUnderline from "@tiptap/extension-underline"
import TiptapImage from "@tiptap/extension-image"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Highlight from "@tiptap/extension-highlight"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import sanitizeHtml from "sanitize-html"

import { SocialLink } from "@/lib/blog/social-link-extension"

const extensions = [
  StarterKit.configure({ horizontalRule: {} }),
  TiptapLink.configure({ openOnClick: false }),
  TiptapUnderline,
  TiptapImage,
  SocialLink,
  TaskList,
  TaskItem,
  Highlight.configure({ multicolor: true }),
  Table,
  TableRow,
  TableHeader,
  TableCell,
]

export function renderPostContent(contentJson: string): string {
  try {
    const json = JSON.parse(contentJson)
    const html = generateHTML(json, extensions)
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img",
        "h1",
        "h2",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ["href", "name", "target", "rel", "class", "data-social-link", "data-type", "data-label"],
        img: ["src", "alt", "title", "width", "height", "loading"],
        span: ["class", "data-social-icon", "aria-hidden"],
        th: ["colspan", "rowspan"],
        td: ["colspan", "rowspan"],
      },
      allowedSchemes: ["http", "https", "mailto"],
    })
  } catch {
    return "<p>Unable to render content.</p>"
  }
}
