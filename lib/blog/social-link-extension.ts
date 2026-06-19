import { Node, mergeAttributes, InputRule } from "@tiptap/core"

export type SocialLinkType = "spotify" | "instagram" | "link"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    socialLink: {
      setSocialLink: (attrs: { type: SocialLinkType; label: string; href: string }) => ReturnType
      unsetSocialLink: () => ReturnType
    }
  }
}

export const SocialLink = Node.create({
  name: "socialLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      type: {
        default: "link",
        parseHTML: (element) => element.getAttribute("data-type") ?? "link",
        renderHTML: (attributes) => ({ "data-type": attributes.type }),
      },
      label: {
        default: "Link",
        parseHTML: (element) => element.getAttribute("data-label") ?? "Link",
        renderHTML: (attributes) => ({ "data-label": attributes.label }),
      },
      href: {
        default: "",
        parseHTML: (element) => element.getAttribute("href") ?? "",
      },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-social-link="true"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = (node.attrs.type ?? "link") as SocialLinkType
    const label = (node.attrs.label as string) || "Link"
    const children: Array<[string, Record<string, string>, ...unknown[]]> = []

    if (type === "spotify" || type === "instagram") {
      children.push([
        "span",
        mergeAttributes({
          class: "social-link-icon",
          "data-social-icon": type,
          "aria-hidden": "true",
        }),
      ])
    }

    children.push([
      "span",
      mergeAttributes({ class: "social-link-label" }),
      label,
    ])

    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        href: node.attrs.href,
        "data-social-link": "true",
        "data-type": type,
        "data-label": label,
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        class: `social-link social-link--${type}`,
      }),
      ...children,
    ]
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\[\[(spotify|instagram|link)\|([^|\]]+?)\|([^\]]+?)\]\]$/,
        handler: ({ range, match, chain }) => {
          const type = match[1].toLowerCase() as SocialLinkType
          const label = match[2].trim()
          const href = match[3].trim()
          if (!href) return null

          chain()
            .deleteRange(range)
            .setSocialLink({ type, label, href })
            .run()
        },
      }),
    ]
  },

  addCommands() {
    return {
      setSocialLink:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run(),
      unsetSocialLink:
        () =>
        ({ chain }) =>
          chain().deleteSelection().run(),
    }
  },
})
