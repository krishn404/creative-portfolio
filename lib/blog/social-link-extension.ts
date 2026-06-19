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

const ICONS: Record<SocialLinkType, string | undefined> = {
  spotify: "/icons/spotify.svg",
  instagram: "/icons/instagram.svg",
  link: undefined,
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

  renderHTML({ HTMLAttributes }) {
    const type = (HTMLAttributes.type ?? "link") as SocialLinkType
    const icon = ICONS[type]
    const children: Array<[string, Record<string, string>, ...unknown[]]> = []

    if (icon) {
      children.push([
        "img",
        mergeAttributes({
          src: icon,
          alt: "",
          "aria-hidden": "true",
          class: "social-link-icon",
        }),
      ])
    }

    children.push([
      "span",
      mergeAttributes({ class: "social-link-label" }),
      HTMLAttributes.label ?? "Link",
    ])

    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-social-link": "true",
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
