"use client"

import { useMemo } from "react"
import type { JSONContent } from "novel"
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  StarterKit,
  Placeholder,
  HorizontalRule,
  TiptapLink,
  TaskList,
  TaskItem,
  UpdatedImage,
  HighlightExtension,
  createSuggestionItems,
  renderItems,
  Command,
  handleCommandNavigation,
} from "novel"
import { Heading1, Heading2, Heading3, List, ListOrdered, Text, Minus } from "lucide-react"

const suggestionItems = createSuggestionItems([
  {
    title: "Text",
    description: "Plain paragraph",
    searchTerms: ["p", "paragraph"],
    icon: <Text size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run()
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    searchTerms: ["title", "big", "large"],
    icon: <Heading1 size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    searchTerms: ["subtitle", "medium"],
    icon: <Heading2 size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    searchTerms: ["subtitle", "small"],
    icon: <Heading3 size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    searchTerms: ["unordered", "point"],
    icon: <List size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    searchTerms: ["ordered"],
    icon: <ListOrdered size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    searchTerms: ["horizontal", "rule", "hr"],
    icon: <Minus size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
])

const extensions = [
  StarterKit.configure({ horizontalRule: false }),
  Placeholder.configure({ placeholder: "Start writing, or press '/' for commands..." }),
  HorizontalRule,
  TiptapLink.configure({ openOnClick: false }),
  TaskList,
  TaskItem,
  UpdatedImage,
  HighlightExtension,
  Command.configure({
    suggestion: {
      items: () => suggestionItems,
      render: renderItems,
    },
  }),
]

export function NovelEditor({
  content,
  onChange,
}: {
  content?: string
  onChange: (val: string) => void
}) {
  const initialContent = useMemo<JSONContent | undefined>(() => {
    if (!content) return undefined
    try {
      return JSON.parse(content) as JSONContent
    } catch {
      return undefined
    }
  }, [content])

  return (
    <EditorRoot>
      <EditorContent
        initialContent={initialContent}
        extensions={extensions}
        className="blog-novel-editor border border-black bg-[var(--surface)] p-6 font-[family-name:var(--font-dm-sans)] min-h-[400px]"
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
        }}
        onUpdate={({ editor }) => onChange(JSON.stringify(editor.getJSON()))}
      >
        <EditorCommand className="z-50 border border-black bg-[var(--surface)]">
          <EditorCommandEmpty className="blog-font-mono px-3 py-2 text-xs">
            No results
          </EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item) => (
              <EditorCommandItem
                key={item.title}
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-black hover:text-white"
              >
                {item.icon}
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{item.description}</p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>
      </EditorContent>
    </EditorRoot>
  )
}
