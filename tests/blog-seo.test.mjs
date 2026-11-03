import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

// Resolve the same @ alias used by Next when exercising the real TypeScript helpers.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context)
    }
    return nextResolve(specifier, context)
  },
})
const { documentTitle, displayDescription, isIndexableTag } = await import('../lib/blog/seo.ts')

test('search titles retain the complete headline and explicit SEO title', () => {
  const title = 'Krameri on Music, Identity, and the Freedom to Create'
  assert.equal(documentTitle({ title }), `${title} | KTWK`)
  assert.equal(documentTitle({ title, seoTitle: '  A complete custom headline  ' }), 'A complete custom headline | KTWK')
})

test('descriptions use article-specific text without generic boilerplate', () => {
  const description = 'Bharg talks about his upcoming music, the people he has worked with, how he learned production, his family, the artists he listens to, and what it feels like to keep building a creative life.'
  const actual = displayDescription({ metaDescription: description })
  assert.ok(description.startsWith(actual))
  assert.ok(actual.length <= 160)
  assert.equal(displayDescription({ title: 'Bharg', excerpt: 'A casual conversation about music.', content: '' }), 'A casual conversation about music. Read on Kezual Talks w Kant (KTWK).')
})

test('only multi-post topic archives are indexable, with each post counted once', () => {
  const first = { tags: ['Bharg Kale', 'Music'], keywords: ['music'] }
  const second = { tags: ['music'], keywords: [] }
  assert.equal(isIndexableTag([], 'music'), false)
  assert.equal(isIndexableTag([first], 'music'), false)
  assert.equal(isIndexableTag([first, second], 'music'), true)
  assert.equal(isIndexableTag([first, second], 'bharg-kale'), false)
})
