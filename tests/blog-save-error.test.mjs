import assert from "node:assert/strict"
import test from "node:test"
import { saveErrorMessage } from "../lib/blog/save-error.mjs"
import { parseTagsInput, uniqueTags } from "../lib/blog/tags.mjs"

test("save errors identify an expired admin session", () => {
  assert.equal(
    saveErrorMessage(new Error("UNAUTHORIZED")),
    "Your admin session expired. Refresh the page and sign in again.",
  )
})

test("save errors explain duplicate slugs", () => {
  assert.equal(
    saveErrorMessage(new Error("A post with this slug already exists")),
    "That SLUG is already in use. Choose a different slug and try again.",
  )
})

test("unknown save errors retain a safe diagnostic without exposing secrets or stacks", () => {
  const message = saveErrorMessage(
    new Error("Server Error\nArgumentValidationError at https://convex.example/mutation password=hunter2\n    at handler (server.js:20)"),
  )

  assert.equal(
    message,
    "Save failed: ArgumentValidationError at [service] password=[redacted]",
  )
})

test("empty save errors point to server logs", () => {
  assert.match(saveErrorMessage(null), /Check the Convex deployment and Vercel function logs/)
})

test("tag input is trimmed, normalized, and deduplicated before saving", () => {
  assert.deepEqual(parseTagsInput("hello, HELLO, world, , world "), ["hello", "world"])
})

test("legacy duplicate tags are deduplicated before rendering", () => {
  assert.deepEqual(uniqueTags([" hello ", "HELLO", "world"]), ["hello", "world"])
})
