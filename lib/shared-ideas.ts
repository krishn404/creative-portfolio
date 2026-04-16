import { promises as fs } from "fs"
import path from "path"

export type SharedIdea = {
  id: string
  transcript: string
  textFallback: string
  extractedTags: {
    projectType: string
    urgency: string
    budgetSignal: string
  }
  timestamp: string
  sourceContext: string
  contactDetail?: string
  callSlotDate?: string
  callSlotTime?: string
  audioCaptured: boolean
  audioDataUrl?: string
  createdAt: string
}

const ideasFilePath = path.join(process.cwd(), "data", "shared-ideas.json")

async function ensureFile() {
  const dir = path.dirname(ideasFilePath)
  await fs.mkdir(dir, { recursive: true })
  try {
    await fs.access(ideasFilePath)
  } catch {
    await fs.writeFile(ideasFilePath, "[]", "utf-8")
  }
}

export async function listSharedIdeas(): Promise<SharedIdea[]> {
  await ensureFile()
  const raw = await fs.readFile(ideasFilePath, "utf-8")
  const parsed = JSON.parse(raw) as SharedIdea[]
  return parsed
}

export async function appendSharedIdea(idea: SharedIdea): Promise<void> {
  const current = await listSharedIdeas()
  current.push(idea)
  await fs.writeFile(ideasFilePath, JSON.stringify(current, null, 2), "utf-8")
}
