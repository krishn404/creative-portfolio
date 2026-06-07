import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"
import TiptapLink from "@tiptap/extension-link"
import TiptapUnderline from "@tiptap/extension-underline"
import TiptapImage from "@tiptap/extension-image"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Highlight from "@tiptap/extension-highlight"

const extensions = [
  StarterKit.configure({ horizontalRule: true }),
  TiptapLink.configure({ openOnClick: false }),
  TiptapUnderline,
  TiptapImage,
  TaskList,
  TaskItem,
  Highlight.configure({ multicolor: true }),
]

export function renderPostContent(contentJson: string): string {
  try {
    const json = JSON.parse(contentJson)
    return generateHTML(json, extensions)
  } catch {
    return "<p>Unable to render content.</p>"
  }
}
