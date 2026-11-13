"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Search, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type Subscriber = { id: string; email: string; source?: string; status: "active" | "unsubscribed"; createdAt: number }
type Broadcast = { _id: string; subject: string; status: "sending" | "completed" | "failed"; createdAt: number; sentAt?: number; recipientCount: number; sentCount: number; failedCount: number }
type Overview = { activeCount: number; sources: { source: string; count: number }[]; subscribers: Subscriber[]; broadcasts: Broadcast[] }

const initialOverview: Overview = { activeCount: 0, sources: [], subscribers: [], broadcasts: [] }

export function NewsletterDashboard() {
  const [overview, setOverview] = useState<Overview>(initialOverview)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [workUpdate, setWorkUpdate] = useState("")
  const [affirmation, setAffirmation] = useState("")
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState<"test" | "broadcast" | null>(null)
  const [deliveryMessage, setDeliveryMessage] = useState("")

  async function load(query = search) {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/newsletter?search=${encodeURIComponent(query)}`, { cache: "no-store" })
      const payload: unknown = await response.json()
      if (!response.ok || !payload || typeof payload !== "object") throw new Error("Could not load newsletter data.")
      setOverview(payload as Overview)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load newsletter data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load("") }, 0)
    return () => window.clearTimeout(timer)
    // The initial request intentionally runs once. Subsequent loads are user initiated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function removeSubscriber() {
    if (!removeId) return
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: removeId }),
      })
      if (!response.ok) throw new Error("Could not remove subscriber.")
      setRemoveId(null)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove subscriber.")
    }
  }

  async function exportCsv() {
    try {
      const response = await fetch("/api/admin/newsletter?format=csv", { cache: "no-store" })
      if (!response.ok) throw new Error("Could not export subscribers.")
      const href = URL.createObjectURL(await response.blob())
      const link = document.createElement("a")
      link.href = href
      link.download = "newsletter-subscribers.csv"
      link.click()
      URL.revokeObjectURL(href)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not export subscribers.")
    }
  }

  async function sendNewsletter(kind: "test" | "broadcast") {
    setSending(kind)
    setError("")
    setDeliveryMessage("")
    try {
      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, email: testEmail, subject, workUpdate, affirmation }),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Newsletter sending failed."
        throw new Error(message)
      }
      setDeliveryMessage(kind === "test" ? "Test email sent." : "Broadcast finished. Check the history below for delivery totals.")
      if (kind === "broadcast") await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Newsletter sending failed.")
    } finally {
      setSending(null)
    }
  }

  const removeEmail = useMemo(() => overview.subscribers.find((subscriber) => subscriber.id === removeId)?.email, [overview.subscribers, removeId])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardHeader><CardDescription>Active subscribers</CardDescription><CardTitle className="text-3xl">{overview.activeCount}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Sources</CardDescription><div className="flex flex-wrap gap-2">{overview.sources.length ? overview.sources.map(({ source, count }) => <Badge key={source} variant="secondary">{source}: {count}</Badge>) : <span className="text-sm text-muted-foreground">No subscribers yet.</span>}</div></CardHeader></Card>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Subscribers</CardTitle><CardDescription>Removing an address marks it unsubscribed and preserves the opt-out.</CardDescription></div>
          <Button variant="outline" onClick={() => void exportCsv()}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(event) => { event.preventDefault(); void load() }} className="flex gap-2">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search email or source" aria-label="Search subscribers" />
            <Button type="submit" variant="outline"><Search className="h-4 w-4" /><span className="sr-only">Search</span></Button>
          </form>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[620px] text-sm"><thead className="border-b bg-muted/40"><tr><th className="p-3 text-left font-medium">Email</th><th className="p-3 text-left font-medium">Source</th><th className="p-3 text-left font-medium">Status</th><th className="p-3 text-left font-medium">Joined</th><th className="p-3 text-right font-medium">Action</th></tr></thead><tbody>
              {loading ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading subscribers…</td></tr> : overview.subscribers.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No subscribers match this search.</td></tr> : overview.subscribers.map((subscriber) => <tr key={subscriber.id} className="border-b last:border-0"><td className="p-3">{subscriber.email}</td><td className="p-3 text-muted-foreground">{subscriber.source || "Direct"}</td><td className="p-3"><Badge variant={subscriber.status === "active" ? "default" : "secondary"}>{subscriber.status}</Badge></td><td className="p-3 text-muted-foreground">{new Date(subscriber.createdAt).toLocaleDateString()}</td><td className="p-3 text-right">{subscriber.status === "active" && <Button size="sm" variant="ghost" onClick={() => setRemoveId(subscriber.id)}><Trash2 className="mr-1 h-4 w-4" />Remove</Button>}</td></tr>)}</tbody></table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Compose</CardTitle><CardDescription>Write this month&apos;s letter, then send yourself a test before the full list.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="newsletter-subject">Subject</label><Input id="newsletter-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="A note from the worktable" /></div>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="newsletter-work">What I&apos;m working on</label><Textarea id="newsletter-work" value={workUpdate} onChange={(event) => setWorkUpdate(event.target.value)} rows={6} placeholder="A short update on the work in progress." /></div>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="newsletter-affirmation">Affirmation postcard</label><Textarea id="newsletter-affirmation" value={affirmation} onChange={(event) => setAffirmation(event.target.value)} rows={4} placeholder="A small thing to carry with you this month." /></div>
            <div className="flex flex-col gap-2 sm:flex-row"><Input type="email" inputMode="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="Your email for a test send" aria-label="Test email address" /><Button type="button" variant="outline" onClick={() => void sendNewsletter("test")} disabled={sending !== null || !testEmail.trim() || !subject.trim() || !workUpdate.trim() || !affirmation.trim()}>{sending === "test" ? "Sending test..." : "Send test"}</Button></div>
            <div className="flex flex-wrap gap-2"><Button type="button" onClick={() => setSendDialogOpen(true)} disabled={sending !== null || !subject.trim() || !workUpdate.trim() || !affirmation.trim()}><Send className="mr-2 h-4 w-4" />Send to all active</Button></div>
            {deliveryMessage && <p className="text-sm text-green-700" role="status">{deliveryMessage}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Live preview</CardTitle><CardDescription>This is the content structure that Phase 4 will send as email.</CardDescription></CardHeader>
          <CardContent><article className="mx-auto max-w-md space-y-5 border bg-white p-6 text-black"><p className="text-sm">Hi,</p><section><h3 className="font-semibold">{subject || "A note from the worktable"}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{workUpdate || "Your update will appear here."}</p></section><section className="border border-black bg-[#f3eddf] p-4"><p className="text-xs font-semibold uppercase tracking-wide">Affirmation postcard</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{affirmation || "Your affirmation will appear here."}</p></section><p className="text-xs text-neutral-600">You&apos;re receiving this because you joined the monthly letter.</p></article></CardContent>
        </Card>
      </div>

      <Card><CardHeader><CardTitle>Broadcast history</CardTitle><CardDescription>Sent newsletters and any delivery failures appear here.</CardDescription></CardHeader><CardContent>{overview.broadcasts.length === 0 ? <p className="text-sm text-muted-foreground">No broadcasts sent yet.</p> : <div className="space-y-3">{overview.broadcasts.map((broadcast) => <div key={broadcast._id} className="flex flex-col gap-1 border-b pb-3 last:border-0"><div className="flex items-center justify-between gap-4"><p className="font-medium">{broadcast.subject}</p><Badge variant={broadcast.status === "completed" ? "default" : "secondary"}>{broadcast.status}</Badge></div><p className="text-sm text-muted-foreground">{broadcast.recipientCount} recipients · {broadcast.sentCount} sent{broadcast.failedCount ? ` · ${broadcast.failedCount} failed` : ""} · {new Date(broadcast.sentAt ?? broadcast.createdAt).toLocaleDateString()}</p></div>)}</div>}</CardContent></Card>

      <AlertDialog open={Boolean(removeId)} onOpenChange={(open) => { if (!open) setRemoveId(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove subscriber?</AlertDialogTitle><AlertDialogDescription>{removeEmail ? `${removeEmail} will be unsubscribed and will not receive future broadcasts.` : "This subscriber will be unsubscribed."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void removeSubscriber()}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Send to {overview.activeCount} active subscribers?</AlertDialogTitle><AlertDialogDescription>This sends the letter immediately. Check the preview and test email before confirming.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); setSendDialogOpen(false); void sendNewsletter("broadcast") }} disabled={sending !== null}>Send to {overview.activeCount}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  )
}
