import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import test from "node:test"

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context)
    }
    return nextResolve(specifier, context)
  },
})

const { buildCreatorProfileJsonLd, buildPortfolioJsonLd } = await import("../lib/seo/schema.ts")
const {
  CREATOR_GITHUB,
  CREATOR_INSTAGRAM,
  CREATOR_LINKEDIN,
  CREATOR_PINTEREST,
  CREATOR_PROFILE_PATH,
  SITE_URL,
} = await import("../lib/seo/constants.ts")

test("creator identity schema connects the portfolio to established profiles", () => {
  const schema = buildCreatorProfileJsonLd()
  const person = schema.find((node) => node["@type"] === "Person")

  assert.ok(person)
  assert.deepEqual(person.sameAs, [
    CREATOR_INSTAGRAM,
    CREATOR_PINTEREST,
    CREATOR_LINKEDIN,
    CREATOR_GITHUB,
    SITE_URL,
  ])
})

test("creator profile has a dedicated canonical entity page", () => {
  const profileUrl = `${SITE_URL}${CREATOR_PROFILE_PATH}`
  const profile = buildCreatorProfileJsonLd().find((node) => node["@type"] === "ProfilePage")
  const portfolioPerson = buildPortfolioJsonLd().find((node) => node["@type"] === "Person")

  assert.equal(profile?.url, profileUrl)
  assert.equal(portfolioPerson?.url, profileUrl)
  assert.equal(portfolioPerson?.mainEntityOfPage, `${profileUrl}#profile`)
})
