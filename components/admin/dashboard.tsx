"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useDropzone } from "react-dropzone"
import { z } from "zod"
import { getBrowserSupabase } from "@/lib/supabase/client"
import type { SiteContent, WorkItem } from "@/lib/content"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Image as ImageIcon } from "lucide-react"

type Actions = {
  saveContent: (content: SiteContent) => Promise<{ ok: boolean }>
  upsertWork: (work: { id?: string; title: string; img: string; year?: string; publicId?: string; category: WorkCategory }) => Promise<any>
  deleteWork: (id: string) => Promise<{ ok: boolean }>
}

const categoryOptions = ["Posters", "Thumbnails", "Graphic Clothing"] as const
export type WorkCategory = (typeof categoryOptions)[number]

const workFormSchema = z.object({
  title: z.string().min(2, "Title required"),
  img: z.string().url("Valid image URL required"),
  year: z.string().optional(),
  category: z.enum(categoryOptions, { required_error: "Category required" }),
})

type TabKey = "works" | "about" | "footer"

type Props = {
  initialContent: SiteContent
  actions: Actions
}

export default function AdminDashboard({ initialContent, actions }: Props) {
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("works")
  const [loading, setLoading] = useState(true)
  const [busyMessage, setBusyMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<SiteContent>(initialContent)
  const [isPending, startTransition] = useTransition()
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newWork, setNewWork] = useState<WorkItem | null>(null)
  const [workSearch, setWorkSearch] = useState("")
  const [workFilter, setWorkFilter] = useState<WorkCategory | "All">("All")
  const { toast } = useToast()

  const modalDropzone = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    disabled: uploadingId === newWork?.id,
    onDrop: (accepted) => {
      const file = accepted?.[0]
      if (file && newWork) {
        handleUpload(file, newWork, {
          onLocalUpdate: (w) => setNewWork(w),
          closeNewModal: true,
        })
      }
    },
  })

  const works = useMemo(() => {
    const base = [...(content.works ?? [])].sort((a, b) => a.title.localeCompare(b.title))
    return base
      .filter((w) => (workFilter === "All" ? true : (w.category ?? "") === workFilter))
      .filter((w) => w.title.toLowerCase().includes(workSearch.toLowerCase()))
  }, [content.works, workFilter, workSearch])

  // Hide page-level GradualBlur on admin dashboard
  useEffect(() => {
    document.body.classList.add("hide-admin-blur")
    return () => {
      document.body.classList.remove("hide-admin-blur")
    }
  }, [])

  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/admin/session", { cache: "no-store" })
      if (res.ok) {
        setAuthenticated(true)
        await refreshContent()
        unsubscribeRef.current = subscribeRealtime()
      }
      setLoading(false)
    }
    checkSession()
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshContent = async () => {
    try {
      const res = await fetch("/api/content", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load content")
      const data = (await res.json()) as SiteContent
      setContent(data)
    } catch (err) {
      console.error(err)
      setError("Failed to refresh content")
    }
  }

  const subscribeRealtime = () => {
    const supabase = getBrowserSupabase()
    const channel = supabase
      .channel("admin-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "works" },
        () => refreshContent()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content" },
        () => refreshContent()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleLogin = async () => {
    setBusyMessage("Authenticating...")
    setError(null)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Invalid password")
      }
      setAuthenticated(true)
      toast({ title: "Welcome back", description: "Admin session started" })
      await refreshContent()
      if (unsubscribeRef.current) unsubscribeRef.current()
      unsubscribeRef.current = subscribeRealtime()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Login failed")
      toast({ title: "Login failed", description: "Check the password and try again", variant: "destructive" })
    } finally {
      setBusyMessage(null)
      setLoading(false)
    }
  }

  const handleCreateWork = () => {
    const tempId = crypto.randomUUID()
    setNewWork({
      id: tempId,
      title: "",
      img: "",
      year: new Date().getFullYear().toString(),
      category: "Posters",
    })
    setShowNewModal(true)
  }

  const handleSaveWork = async (work: WorkItem, options?: { closeNewModal?: boolean }) => {
    const parsed = workFormSchema.safeParse({ title: work.title, img: work.img, year: work.year, category: work.category })
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(", "))
      toast({ title: "Validation error", description: parsed.error.issues.map((i) => i.message).join(", "), variant: "destructive" })
      return
    }
    setBusyMessage("Saving work...")
    setError(null)
    try {
      const saved = await actions.upsertWork({
        id: work.id,
        title: work.title,
        img: work.img,
        year: work.year,
        publicId: work.publicId,
        category: work.category as WorkCategory,
      })
      const savedWork: WorkItem = {
        id: saved.id ?? work.id,
        title: saved.title ?? work.title,
        img: saved.img ?? work.img,
        year: saved.year ?? work.year,
        publicId: saved.public_id ?? work.publicId,
        category: (saved.category ?? work.category) as WorkCategory,
      }
      setContent((prev) => ({
        ...prev,
        works: (prev.works ?? []).some((w) => w.id === work.id)
          ? (prev.works ?? []).map((w) => (w.id === work.id ? savedWork : w))
          : [...(prev.works ?? []), savedWork],
      }))
      if (newWork?.id === work.id) {
        setNewWork(savedWork)
      }
      if (options?.closeNewModal) {
        setShowNewModal(false)
        setNewWork(null)
      }
      toast({ title: "Saved", description: `"${work.title}" updated` })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to save work")
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Failed to save work", variant: "destructive" })
    } finally {
      setBusyMessage(null)
    }
  }

  const handleDeleteWork = async (work: WorkItem) => {
    const previous = content.works ?? []
    setContent((prev) => ({ ...prev, works: (prev.works ?? []).filter((w) => w.id !== work.id) }))
    setBusyMessage("Deleting work...")
    setError(null)
    try {
      await actions.deleteWork(work.id)
      toast({ title: "Deleted", description: `"${work.title}" removed` })
    } catch (err) {
      console.error(err)
      setContent((prev) => ({ ...prev, works: previous }))
      setError("Failed to delete work")
      toast({ title: "Delete failed", description: "Could not delete item", variant: "destructive" })
    } finally {
      setBusyMessage(null)
    }
  }

  const handleUpload = async (
    file: File,
    work: WorkItem,
    options?: { onLocalUpdate?: (work: WorkItem) => void; closeNewModal?: boolean }
  ) => {
    if (!work.category) {
      setError("Select a category before uploading.")
      toast({ title: "Pick a category", description: "Set a category before uploading", variant: "destructive" })
      return
    }
    setBusyMessage("Uploading image...")
    setUploadingId(work.id)
    setUploadProgress(0)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const responseText = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/upload")
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percent)
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText)
          } else {
            reject(new Error(xhr.responseText || "Upload failed"))
          }
        }
        xhr.onerror = () => reject(new Error("Network error during upload"))
        xhr.send(formData)
      })

      const data = JSON.parse(responseText)
      const updated: WorkItem = { ...work, img: data.url, publicId: data.publicId }
      setContent((prev) => ({
        ...prev,
        works: (prev.works ?? []).some((w) => w.id === work.id)
          ? (prev.works ?? []).map((w) => (w.id === work.id ? updated : w))
          : prev.works ?? [],
      }))
      options?.onLocalUpdate?.(updated)
      await handleSaveWork(updated, { closeNewModal: options?.closeNewModal })
      toast({ title: "Upload complete", description: `"${work.title}" image updated` })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Upload failed")
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" })
    } finally {
      setBusyMessage(null)
      setUploadingId(null)
      setUploadProgress(0)
    }
  }

  const handleSaveContent = async () => {
    setBusyMessage("Saving content...")
    setError(null)
    startTransition(() => {
      actions
        .saveContent(content)
        .then(() => {
          toast({ title: "Content saved", description: "Portfolio content updated" })
        })
        .catch((err) => {
          console.error(err)
          setError(err instanceof Error ? err.message : "Failed to save content")
          toast({ title: "Save failed", description: err instanceof Error ? err.message : "Failed to save content", variant: "destructive" })
        })
        .finally(() => {
          setBusyMessage(null)
        })
    })
  }

  if (loading) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen flex items-center justify-center bg-white text-black">
          <p>Loading dashboard…</p>
        </div>
      </>
    )
  }

  if (!authenticated) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen bg-linear-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
          <Card className="max-w-md w-full border border-black/10 shadow-xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-black">Admin Login</CardTitle>
              <p className="text-sm text-black/60">Enter the admin password to manage the portfolio content.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                className="w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                onClick={handleLogin}
                className="w-full"
                disabled={!password}
              >
                {busyMessage || "Login"}
              </Button>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-linear-to-b from-[#060a11] via-[#070b12] to-[#05070c] text-white">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Admin</p>
              <h1 className="text-3xl font-semibold">Portfolio Control</h1>
              <p className="text-sm text-white/60">Manage works, about copy, and footer links in one place.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={refreshContent}>
                Refresh
              </Button>
              <Button
                onClick={handleSaveContent}
                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition disabled:opacity-50"
                disabled={isPending}
              >
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total works" value={content.works?.length ?? 0} />
            <StatCard
              label="Posters"
              value={(content.works ?? []).filter((w) => (w.category ?? "") === "Posters").length}
            />
            <StatCard
              label="Thumbnails"
              value={(content.works ?? []).filter((w) => (w.category ?? "") === "Thumbnails").length}
            />
            <StatCard
              label="Graphic Clothing"
              value={(content.works ?? []).filter((w) => (w.category ?? "") === "Graphic Clothing").length}
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="works">Works</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
            </TabsList>

            <TabsContent value="works" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Selected works</p>
                    <h2 className="text-xl font-semibold text-white">Gallery</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Input
                        value={workSearch}
                        onChange={(e) => setWorkSearch(e.target.value)}
                        placeholder="Search works"
                        className="pl-9 bg-white/10 border-white/15 text-white h-10"
                      />
                      <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex gap-2">
                      {["All", ...categoryOptions].map((cat) => (
                        <Button
                          key={cat}
                          size="sm"
                          variant={workFilter === cat ? "default" : "outline"}
                          className={
                            workFilter === cat
                              ? "bg-white text-black hover:bg-white/90"
                              : "border-white/20 text-white hover:bg-white/10"
                          }
                          onClick={() => setWorkFilter(cat as WorkCategory | "All")}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                    <Button
                      onClick={handleCreateWork}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add work
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {works.length === 0 ? (
                    <div className="border border-dashed border-white/15 rounded-lg p-10 text-center text-white/60">
                      No works yet. Click “Add work” to start.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {works.map((work) => (
                        <WorkCard
                          key={work.id}
                          work={work}
                          onSave={(updated) => handleSaveWork(updated)}
                          onDelete={() => handleDeleteWork(work)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm text-white/70">Headline</label>
                    <Input
                      value={content.about.headline}
                      onChange={(e) => setContent((prev) => ({ ...prev, about: { ...prev.about, headline: e.target.value } }))}
                      className="w-full bg-white/10 border border-white/20"
                    />
                  </div>
                  <div className="grid gap-3">
                    {(content.about?.paragraphs ?? []).map((paragraph, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-xs text-white/60">Paragraph {idx + 1}</label>
                        <Textarea
                          value={paragraph}
                          onChange={(e) =>
                            setContent((prev) => {
                              const next = [...(prev.about?.paragraphs ?? [])]
                              next[idx] = e.target.value
                              return { ...prev, about: { ...prev.about, paragraphs: next } as SiteContent["about"] }
                            })
                          }
                          rows={3}
                          className="bg-white/10 border-white/20"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm text-white/70">Tags (comma separated)</label>
                    <Input
                      value={(content.about?.tags ?? []).join(", ")}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          about: {
                            ...prev.about,
                            tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                          } as SiteContent["about"],
                        }))
                      }
                      className="w-full bg-white/10 border-white/20"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="footer">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Footer & Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm text-white/70">CTA</label>
                    <Textarea
                      value={content.contact.cta}
                      rows={3}
                      onChange={(e) =>
                        setContent((prev) => ({ ...prev, contact: { ...prev.contact, cta: e.target.value } }))
                      }
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm text-white/70">Email</label>
                    <Input
                      value={content.contact.email}
                      onChange={(e) =>
                        setContent((prev) => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))
                      }
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-white/70">Social links</label>
                      <Button
                        onClick={() =>
                          setContent((prev) => ({
                            ...prev,
                            contact: {
                              ...prev.contact,
                              socials: [...(prev.contact?.socials ?? []), { label: "New", href: "" }],
                            } as SiteContent["contact"],
                          }))
                        }
                        size="sm"
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                    {(content.contact?.socials ?? []).map((social, idx) => (
                      <div key={`${social.label}-${idx}`} className="grid grid-cols-2 gap-3">
                        <Input
                          value={social.label}
                          placeholder="Label"
                          onChange={(e) =>
                            setContent((prev) => {
                              const next = [...(prev.contact?.socials ?? [])]
                              next[idx] = { ...next[idx], label: e.target.value }
                              return { ...prev, contact: { ...prev.contact, socials: next } as SiteContent["contact"] }
                            })
                          }
                          className="bg-white/10 border-white/20"
                        />
                        <Input
                          value={social.href}
                          placeholder="Link"
                          onChange={(e) =>
                            setContent((prev) => {
                              const next = [...(prev.contact?.socials ?? [])]
                              next[idx] = { ...next[idx], href: e.target.value }
                              return { ...prev, contact: { ...prev.contact, socials: next } as SiteContent["contact"] }
                            })
                          }
                          className="bg-white/10 border-white/20"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm text-white/70">Footer note</label>
                    <Input
                      value={content.footer?.note ?? ""}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          footer: { note: e.target.value },
                        }))
                      }
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={showNewModal} onOpenChange={(open) => { setShowNewModal(open); if (!open) setNewWork(null) }}>
        <DialogContent className="bg-[#0d1320] border border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Add work</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Title</label>
              <Input
                value={newWork?.title ?? ""}
                onChange={(e) => setNewWork((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                placeholder="Poster title"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Year</label>
              <Input
                value={newWork?.year ?? ""}
                onChange={(e) => setNewWork((prev) => (prev ? { ...prev, year: e.target.value } : prev))}
                placeholder="2025"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Category</label>
              <select
                value={newWork?.category ?? categoryOptions[0]}
                onChange={(e) =>
                  setNewWork((prev) => (prev ? { ...prev, category: e.target.value as WorkCategory } : prev))
                }
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Image URL</label>
              <Input
                value={newWork?.img ?? ""}
                onChange={(e) => setNewWork((prev) => (prev ? { ...prev, img: e.target.value } : prev))}
                placeholder="https://..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-white/70">Upload image</label>
              <div
                className={`border border-dashed rounded-lg px-4 py-6 bg-white/5 cursor-pointer transition ${
                  uploadingId === newWork?.id ? "opacity-70" : "hover:border-white/30"
                }`}
                {...modalDropzone.getRootProps()}
              >
                <input {...modalDropzone.getInputProps()} />
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                    {newWork?.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={newWork.img} alt={newWork.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-white/60">Drop image</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Drop or click to upload</p>
                    <p className="text-xs text-white/60">Uploads save automatically once complete.</p>
                  </div>
                </div>
                {uploadingId === newWork?.id ? (
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={uploadProgress} className="h-2 flex-1 bg-white/10" />
                    <Badge variant="outline" className="border-white/30 text-white/80">
                      {uploadProgress}%
                    </Badge>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowNewModal(false); setNewWork(null) }}>
              Cancel
            </Button>
            <Button
              onClick={() => newWork && handleSaveWork(newWork, { closeNewModal: true })}
              disabled={!newWork?.title || !newWork?.img}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type WorkCardProps = {
  work: WorkItem
  onSave: (work: WorkItem) => void
  onDelete: () => void
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1">{value}</p>
    </div>
  )
}

function WorkCard({ work, onSave, onDelete }: WorkCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(work.title)

  useEffect(() => {
    setTitle(work.title)
  }, [work.title])

  return (
    <article className="border border-white/10 rounded-2xl overflow-hidden bg-[#0b111b] shadow-lg flex flex-col">
      <div className="relative h-40 w-full bg-white/5">
        {work.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={work.img} alt={work.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-white/60">
            <ImageIcon className="w-6 h-6" />
            <span>No image yet</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Badge variant="outline" className="bg-black/40 border-white/20 text-white/90">
            {work.category ?? "Category"}
          </Badge>
          {work.year ? (
            <Badge variant="outline" className="bg-black/40 border-white/20 text-white/80">
              {work.year}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {editing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/10 border-white/20 text-white h-10"
            placeholder="Title"
          />
        ) : (
          <p className="text-lg font-semibold">{title || "Untitled"}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap text-xs text-white/60">
          <Badge variant="outline" className="border-white/20 text-white/80">
            {work.category ?? "Category"}
          </Badge>
          {work.year ? (
            <Badge variant="outline" className="border-white/20 text-white/80">
              {work.year}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-auto pt-2">
          <Button
            onClick={() => {
              if (editing) {
                onSave({ ...work, title })
              }
              setEditing((prev) => !prev)
            }}
            className="text-sm px-3 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition"
          >
            {editing ? "Save" : "Edit"}
          </Button>
          <Button
            onClick={onDelete}
            variant="destructive"
            className="text-sm px-3 py-2 rounded-lg"
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  )
}

