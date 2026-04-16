"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useDropzone } from "react-dropzone"
import { z } from "zod"
import useSWR, { mutate } from "swr"
import type { SiteContent, WorkItem } from "@/lib/content"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Toaster } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, ImageIcon, Eye, Archive, FileText, Trash2, Edit } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDefaultContent } from "@/lib/content"
import type { Actions } from "@/lib/actions" // Import Actions here
import type { SharedIdea } from "@/lib/shared-ideas"

const categoryOptions = ["Posters", "Thumbnails", "Graphic Clothing"] as const
export type WorkCategory = (typeof categoryOptions)[number]

const statusOptions = ["draft", "published", "archived"] as const
export type WorkStatus = (typeof statusOptions)[number]

const workFormSchema = z.object({
  title: z.string().min(2, "Title required"),
  img: z.string().url("Valid image URL required"),
  year: z.string().optional(),
  category: z.enum(categoryOptions, { required_error: "Category required" }),
  status: z.enum(statusOptions).optional(),
})

type TabKey = "works" | "about" | "footer" | "ideas"

type Props = {
  initialContent: SiteContent
  actions: Actions
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminDashboard({ initialContent, actions }: Props) {
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("works")
  const [loading, setLoading] = useState(true)
  const [busyMessage, setBusyMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newWork, setNewWork] = useState<WorkItem | null>(null)
  const [newWorkFormData, setNewWorkFormData] = useState<{
    title: string
    year: string
    category: WorkCategory
    status: WorkStatus
  } | null>(null)
  const [workSearch, setWorkSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<WorkStatus | "All">("All")
  const [categoryFilter, setCategoryFilter] = useState<WorkCategory | "All">("All")
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; work?: WorkItem }>({ open: false })
  const { toast } = useToast()

  const { data: worksData } = useSWR<{ works: WorkItem[] }>(authenticated ? "/api/works?all=true" : null, fetcher, {
    refreshInterval: 5000,
  })
  const { data: ideasData } = useSWR<{ ideas: SharedIdea[] }>(
    authenticated ? "/api/admin/shared-ideas" : null,
    fetcher,
    { refreshInterval: 8000 },
  )

  const [content, setContent] = useState<SiteContent>(() => {
    const defaults = getDefaultContent()
    return {
      ...defaults,
      ...initialContent,
      about: { ...defaults.about, ...initialContent?.about },
      contact: { ...defaults.contact, ...initialContent?.contact },
      footer: { ...defaults.footer, ...initialContent?.footer },
    }
  })

  useEffect(() => {
    if (worksData && authenticated) {
      setContent((prev) => ({ ...prev, works: worksData.works }))
    }
  }, [worksData, authenticated])

  const modalDropzone = useDropzone({
    accept: { "image/*": [] },
    multiple: true, // Changed from false to allow multiple file selection
    disabled: uploadingId === newWork?.id,
    onDrop: async (accepted) => {
      if (accepted.length > 0 && newWork) {
        // Preserve form data before upload
        setNewWorkFormData({
          title: newWork.title,
          year: newWork.year || "",
          category: newWork.category,
          status: newWork.status || "draft",
        })

        // Upload all files sequentially, ensuring each gets the latest state
        let currentWork = newWork
        for (const file of accepted) {
          // Use the latest work state for each upload to ensure media accumulates correctly
          await handleUpload(file, currentWork, {
            onLocalUpdate: (w) => {
              currentWork = w // Update local reference for next iteration
              setNewWork(w) // Update React state
            },
            closeNewModal: false, // Keep modal open when uploading multiple files
          })
        }
      }
    },
  })

  const works = useMemo(() => {
    const base = [...(content.works ?? [])].sort((a, b) => a.title.localeCompare(b.title))
    return base
      .filter((w) => (statusFilter === "All" ? true : (w.status ?? "draft") === statusFilter))
      .filter((w) => (categoryFilter === "All" ? true : (w.category ?? "") === categoryFilter))
      .filter((w) => w.title.toLowerCase().includes(workSearch.toLowerCase()))
  }, [content.works, statusFilter, categoryFilter, workSearch])

  const sharedIdeas = useMemo(() => {
    return [...(ideasData?.ideas ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [ideasData?.ideas])

  // Hide page-level GradualBlur on admin dashboard
  useEffect(() => {
    document.body.classList.add("hide-admin-blur")
    return () => {
      document.body.classList.remove("hide-admin-blur")
    }
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/admin/session", { cache: "no-store" })
      if (res.ok) {
        setAuthenticated(true)
        await refreshContent()
      }
      setLoading(false)
    }
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshContent = async () => {
    try {
      await mutate("/api/works?all=true")
      await mutate("/api/content")
      const res = await fetch("/api/content", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load content")
      const data = (await res.json()) as SiteContent
      setContent(data)
    } catch (err) {
      console.error(err)
      setError("Failed to refresh content")
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
      status: "draft",
      media: [],
    })
    setNewWorkFormData({
      title: "",
      year: new Date().getFullYear().toString(),
      category: "Posters",
      status: "draft",
    })
    setShowNewModal(true)
  }

  const handleSaveWork = async (work: WorkItem, options?: { closeNewModal?: boolean }) => {
    const parsed = workFormSchema.safeParse({
      title: work.title,
      img: work.img,
      year: work.year,
      category: work.category,
      status: work.status,
    })
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(", "))
      toast({
        title: "Validation error",
        description: parsed.error.issues.map((i) => i.message).join(", "),
        variant: "destructive",
      })
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
      status: work.status,
      media: work.media,
      showInAbout: work.showInAbout,
    })
    const savedWork: WorkItem = {
      id: saved.id ?? work.id,
      title: saved.title ?? work.title,
      img: saved.img ?? work.img,
      year: saved.year ?? work.year,
      publicId: saved.public_id ?? work.publicId,
      category: (saved.category ?? work.category) as WorkCategory,
      status: (saved.status ?? work.status ?? "draft") as WorkStatus,
      media: saved.media ?? work.media,
      showInAbout: saved.showInAbout ?? work.showInAbout,
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
        setNewWorkFormData(null)
      }
      await mutate("/api/works?all=true")
      toast({ title: "Saved", description: `"${work.title}" updated` })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to save work")
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Failed to save work",
        variant: "destructive",
      })
    } finally {
      setBusyMessage(null)
    }
  }

  const handleUpdateStatus = async (work: WorkItem, newStatus: WorkStatus) => {
    const previous = content.works ?? []
    // Optimistic update
    setContent((prev) => ({
      ...prev,
      works: (prev.works ?? []).map((w) => (w.id === work.id ? { ...w, status: newStatus } : w)),
    }))
    setBusyMessage(`Updating status to ${newStatus}...`)
    setError(null)
    try {
      await actions.updateWorkStatus(work.id, newStatus)
      await mutate("/api/works?all=true")
      toast({ title: "Status updated", description: `"${work.title}" is now ${newStatus}` })
    } catch (err) {
      console.error(err)
      setContent((prev) => ({ ...prev, works: previous }))
      setError("Failed to update status")
      toast({ title: "Update failed", description: "Could not update status", variant: "destructive" })
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
      await mutate("/api/works?all=true")
      toast({ title: "Deleted", description: `"${work.title}" removed permanently` })
      setDeleteConfirm({ open: false })
    } catch (err) {
      console.error(err)
      setContent((prev) => ({ ...prev, works: previous }))
      setError("Failed to delete work")
      toast({ title: "Delete failed", description: "Could not delete item", variant: "destructive" })
    } finally {
      setBusyMessage(null)
    }
  }

  useEffect(() => {
    if (newWork && !uploadingId) {
      setNewWorkFormData({
        title: newWork.title,
        year: newWork.year || "",
        category: newWork.category || "Posters",
        status: newWork.status || "draft",
      })
    }
  }, [newWork, uploadingId])

  const handleUpload = async (
    file: File,
    work: WorkItem,
    options?: { onLocalUpdate?: (work: WorkItem) => void; closeNewModal?: boolean },
  ) => {
    if (!work.category) {
      setError("Select a category before uploading.")
      toast({ title: "Pick a category", description: "Set a category before uploading", variant: "destructive" })
      return
    }

    const preservedFormData = newWorkFormData || {
      title: work.title,
      year: work.year || "",
      category: work.category,
      status: work.status || "draft",
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
            // Try to parse error message from response
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(errorData?.error || `Upload failed with status ${xhr.status}`))
            } catch {
              reject(new Error(xhr.responseText || `Upload failed with status ${xhr.status}`))
            }
          }
        }
        xhr.onerror = () => reject(new Error("Network error during upload"))
        xhr.send(formData)
      })

      let data
      try {
        data = JSON.parse(responseText)
        if (!data || !data.url) {
          // Check if there's an error message in the response
          const errorMsg = data?.error || "Invalid response from upload API"
          throw new Error(errorMsg)
        }
      } catch (parseError) {
        console.error("Upload response parse error:", parseError)
        // Try to extract error message from response
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(errorData?.error || "Invalid JSON response from server")
        } catch {
          throw new Error("Invalid JSON response from server")
        }
      }

      const existingMedia = work.media || []
      const newMediaItem = {
        url: data.url,
        publicId: data.publicId,
        type: "image" as const,
        order: existingMedia.length,
      }

      // Append new media item to existing array (incremental, immutable)
      const updatedMedia = [...existingMedia, newMediaItem]
      
      // img is always derived from media[0] (cover image)
      // Only set img if this is the first image, otherwise keep existing img or derive from media[0]
      const coverImageUrl = updatedMedia[0]?.url || data.url

      const updated: WorkItem = {
        ...work,
        ...preservedFormData,
        img: coverImageUrl,
        // Only update publicId if this is the first image (cover)
        publicId: existingMedia.length === 0 ? data.publicId : work.publicId,
        media: updatedMedia,
      }

      // Update content state immutably - updated.media already contains the merged array
      setContent((prev) => ({
        ...prev,
        works: (prev.works ?? []).some((w) => w.id === work.id)
          ? (prev.works ?? []).map((w) => (w.id === work.id ? updated : w))
          : (prev.works ?? []),
      }))
      options?.onLocalUpdate?.(updated)
      await handleSaveWork(updated, { closeNewModal: options?.closeNewModal })
      toast({ title: "Upload complete", description: `"${work.title}" image updated` })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Upload failed")
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Upload failed",
        variant: "destructive",
      })
    } finally {
      setBusyMessage(null)
      setUploadingId(null)
      setUploadProgress(0)
    }
  }

  const handleRemoveMedia = (workId: string, mediaIndex: number) => {
    // Get the latest work state - prefer newWork if it's the same ID (for modal editing)
    const work = newWork?.id === workId ? newWork : content.works?.find((w) => w.id === workId)
    if (!work || !work.media) return

    const updatedMedia = work.media.filter((_, i) => i !== mediaIndex).map((m, i) => ({ ...m, order: i }))
    // img is always derived from media[0] (cover image)
    const updatedWork = {
      ...work,
      media: updatedMedia,
      img: updatedMedia[0]?.url || work.img,
    }

    if (newWork?.id === workId) {
      setNewWork(updatedWork)
    }

    handleSaveWork(updatedWork)
  }

  const handleReorderMedia = (workId: string, fromIndex: number, toIndex: number) => {
    // Get the latest work state - prefer newWork if it's the same ID (for modal editing)
    const work = newWork?.id === workId ? newWork : content.works?.find((w) => w.id === workId)
    if (!work || !work.media) return

    const media = [...work.media]
    const [moved] = media.splice(fromIndex, 1)
    media.splice(toIndex, 0, moved)

    const updatedMedia = media.map((m, i) => ({ ...m, order: i }))
    // img is always derived from media[0] (cover image)
    const updatedWork = {
      ...work,
      media: updatedMedia,
      img: updatedMedia[0]?.url || work.img,
    }

    if (newWork?.id === workId) {
      setNewWork(updatedWork)
    }

    handleSaveWork(updatedWork)
  }

  const handleSaveContent = async () => {
    setBusyMessage("Saving content...")
    setError(null)
    startTransition(() => {
      actions
        .saveContent(content)
        .then(async () => {
          await mutate("/api/content")
          toast({ title: "Content saved", description: "Portfolio content updated" })
        })
        .catch((err) => {
          console.error(err)
          setError(err instanceof Error ? err.message : "Failed to save content")
          toast({
            title: "Save failed",
            description: err instanceof Error ? err.message : "Failed to save content",
            variant: "destructive",
          })
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
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors">
          <p>Loading dashboard...</p>
        </div>
      </>
    )
  }

  if (!authenticated) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center px-4 transition-colors">
          <Card className="max-w-md w-full border shadow-2xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold">Admin Login</CardTitle>
              <CardDescription>Enter the admin password to manage the portfolio content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                className="w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password) {
                    handleLogin()
                  }
                }}
              />
              <Button onClick={handleLogin} className="w-full" disabled={!password}>
                {busyMessage || "Login"}
              </Button>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-background text-foreground transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Admin Dashboard</p>
              <h1 className="text-2xl md:text-3xl font-semibold">Portfolio Control</h1>
              <p className="text-sm text-muted-foreground">Manage works, about copy, and footer links in one place.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ThemeToggle />
              <Button variant="outline" onClick={refreshContent}>
                Refresh
              </Button>
              <Button onClick={handleSaveContent} disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </header>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total works" value={content.works?.length ?? 0} />
            <StatCard
              label="Published"
              value={(content.works ?? []).filter((w) => w.status === "published").length}
              variant="success"
            />
            <StatCard
              label="Drafts"
              value={(content.works ?? []).filter((w) => w.status === "draft" || !w.status).length}
              variant="warning"
            />
            <StatCard
              label="Archived"
              value={(content.works ?? []).filter((w) => w.status === "archived").length}
              variant="muted"
            />
            <StatCard
              label="Posters"
              value={(content.works ?? []).filter((w) => (w.category ?? "") === "Posters").length}
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="space-y-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="works">Works</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="footer">Footer & Contact</TabsTrigger>
              <TabsTrigger value="ideas">Shared Ideas</TabsTrigger>
            </TabsList>

            <TabsContent value="works" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Gallery Management</p>
                    <CardTitle className="text-xl">Works</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as WorkStatus | "All")}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as WorkCategory | "All")}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="relative flex-1 min-w-[200px]">
                      <Input
                        value={workSearch}
                        onChange={(e) => setWorkSearch(e.target.value)}
                        placeholder="Search works"
                        className="pl-9"
                      />
                      <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    <Button onClick={handleCreateWork} className="gap-2">
                      <Plus className="w-4 h-4" /> Add work
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {works.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
                      {workSearch || statusFilter !== "All" || categoryFilter !== "All" ? (
                        <p>No works match your filters. Try adjusting your search.</p>
                      ) : (
                        <p>No works yet. Click "Add work" to start.</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {works.map((work) => (
                        <WorkCard
                          key={work.id}
                          work={work}
                          onSave={(updated) => handleSaveWork(updated)}
                          onUpdateStatus={(newStatus) => handleUpdateStatus(work, newStatus)}
                          onDelete={() => setDeleteConfirm({ open: true, work })}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>About Section</CardTitle>
                  <CardDescription>Edit the about section content displayed on your portfolio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Headline</label>
                    <Input
                      value={content.about.headline}
                      onChange={(e) =>
                        setContent((prev) => ({ ...prev, about: { ...prev.about, headline: e.target.value } }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="grid gap-3">
                    {(content.about?.paragraphs ?? []).map((paragraph, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Paragraph {idx + 1}</label>
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
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Tags (comma separated)</label>
                    <Input
                      value={(content.about?.tags ?? []).join(", ")}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          about: {
                            ...prev.about,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean),
                          } as SiteContent["about"],
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="footer">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Footer & Contact</CardTitle>
                  <CardDescription>Manage contact information and social links</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Call to Action</label>
                    <Textarea
                      value={content.contact.cta}
                      rows={3}
                      onChange={(e) =>
                        setContent((prev) => ({ ...prev, contact: { ...prev.contact, cta: e.target.value } }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={content.contact.email}
                      onChange={(e) =>
                        setContent((prev) => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))
                      }
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Social links</label>
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
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Footer note</label>
                    <Input
                      value={content.footer?.note ?? ""}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          footer: { note: e.target.value },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ideas" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Shared Ideas</CardTitle>
                  <CardDescription>Voice/text submissions from the profile card flow.</CardDescription>
                </CardHeader>
                <CardContent>
                  {sharedIdeas.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
                      No shared ideas yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sharedIdeas.map((idea) => (
                        <div key={idea.id} className="rounded-xl border bg-card p-4 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">{new Date(idea.createdAt).toLocaleString()}</Badge>
                            <Badge variant="secondary">{idea.sourceContext}</Badge>
                            {idea.audioCaptured ? <Badge>Voice</Badge> : <Badge variant="outline">Text only</Badge>}
                          </div>
                          <p className="text-sm leading-relaxed">{idea.transcript || idea.textFallback}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">Type: {idea.extractedTags.projectType}</Badge>
                            <Badge variant="outline">Urgency: {idea.extractedTags.urgency}</Badge>
                            <Badge variant="outline">Budget: {idea.extractedTags.budgetSignal}</Badge>
                          </div>
                          {(idea.callSlotDate || idea.callSlotTime) && (
                            <p className="text-xs text-muted-foreground">
                              Preferred slot: {idea.callSlotDate || "N/A"} {idea.callSlotTime || ""}
                            </p>
                          )}
                          {idea.contactDetail ? (
                            <p className="text-xs text-muted-foreground">Contact: {idea.contactDetail}</p>
                          ) : null}
                          {idea.audioDataUrl ? (
                            <div className="pt-1">
                              <p className="text-xs text-muted-foreground mb-1">Voice note</p>
                              <audio controls preload="none" className="w-full">
                                <source src={idea.audioDataUrl} type="audio/webm" />
                                Your browser does not support audio playback.
                              </audio>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog
        open={showNewModal}
        onOpenChange={(open) => {
          setShowNewModal(open)
          if (!open) {
            setNewWork(null)
            setNewWorkFormData(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add new work</DialogTitle>
            <DialogDescription>Fill in details and upload media</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newWork?.title ?? ""}
                  onChange={(e) => setNewWork((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  placeholder="Work title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Year</label>
                <Input
                  value={newWork?.year ?? ""}
                  onChange={(e) => setNewWork((prev) => (prev ? { ...prev, year: e.target.value } : prev))}
                  placeholder="2025"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={newWork?.category ?? categoryOptions[0]}
                  onValueChange={(value) =>
                    setNewWork((prev) => (prev ? { ...prev, category: value as WorkCategory } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={newWork?.status ?? "draft"}
                  onValueChange={(value) =>
                    setNewWork((prev) => (prev ? { ...prev, status: value as WorkStatus } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 border border-border">
              <input
                type="checkbox"
                id="showInAbout"
                checked={newWork?.showInAbout ?? false}
                onChange={(e) =>
                  setNewWork((prev) => (prev ? { ...prev, showInAbout: e.target.checked } : prev))
                }
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="showInAbout" className="text-sm font-medium cursor-pointer flex-1">
                Show in About Section
              </label>
              <span className="text-xs text-muted-foreground">
                (Select up to 4 works to display as polaroid cards)
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Media Assets</label>

              {/* Existing media thumbnails */}
              {newWork?.media && newWork.media.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {newWork.media.map((asset, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-md overflow-hidden border bg-muted"
                    >
                      <img
                        src={asset.url || "/placeholder.svg"}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                        {index > 0 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => newWork && handleReorderMedia(newWork.id, index, index - 1)}
                          >
                            ←
                          </Button>
                        )}
                        {index < newWork.media!.length - 1 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={() => newWork && handleReorderMedia(newWork.id, index, index + 1)}
                          >
                            →
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 w-7 p-0"
                          onClick={() => newWork && handleRemoveMedia(newWork.id, index)}
                        >
                          ×
                        </Button>
                      </div>
                      {index === 0 && (
                        <Badge className="absolute top-1 left-1 text-xs" variant="secondary">
                          Cover
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload dropzone - compact version */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 bg-muted/20 cursor-pointer transition hover:border-foreground/40 ${
                  uploadingId === newWork?.id ? "opacity-70" : ""
                }`}
                {...modalDropzone.getRootProps()}
              >
                <input {...modalDropzone.getInputProps()} />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-muted border flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Drop or click to upload</p>
                    <p className="text-xs text-muted-foreground">Images save automatically</p>
                  </div>
                </div>
                {uploadingId === newWork?.id && (
                  <div className="mt-3 flex items-center gap-2">
                    <Progress value={uploadProgress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewModal(false)
                setNewWork(null)
                setNewWorkFormData(null)
              }}
            >
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

      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open, work: undefined })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{deleteConfirm.work?.title}" and remove the
              image from Cloudinary. Consider archiving instead if you want to keep the file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm.work && handleDeleteWork(deleteConfirm.work)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type WorkCardProps = {
  work: WorkItem
  onSave: (work: WorkItem) => void
  onUpdateStatus: (status: WorkStatus) => void
  onDelete: () => void
}

function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string
  value: number
  variant?: "default" | "success" | "warning" | "muted"
}) {
  const variantClasses = {
    default: "border-border",
    success: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    muted: "border-muted",
  }

  return (
    <div className={`rounded-xl border bg-card p-4 shadow-sm ${variantClasses[variant]}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  )
}

function WorkCard({ work, onSave, onUpdateStatus, onDelete }: WorkCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(work.title)
  const [year, setYear] = useState(work.year || "")
  const [category, setCategory] = useState<WorkCategory>(work.category || "Posters")

  useEffect(() => {
    setTitle(work.title)
    setYear(work.year || "")
    setCategory(work.category || "Posters")
  }, [work.title, work.year, work.category])

  const statusIcons = {
    published: Eye,
    draft: FileText,
    archived: Archive,
  }

  const StatusIcon = statusIcons[work.status || "draft"]

  return (
    <article className="border rounded-xl overflow-hidden bg-card shadow-md hover:shadow-lg transition-shadow flex flex-col">
      <div className="relative h-40 w-full bg-muted">
        {work.img ? (
          <img src={work.img || "/placeholder.svg"} alt={work.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        <div className="absolute top-2 right-2">
          <Badge
            variant={work.status === "published" ? "default" : work.status === "archived" ? "secondary" : "outline"}
            className="gap-1"
          >
            <StatusIcon className="w-3 h-3" />
            {work.status || "draft"}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {work.category ?? "Category"}
          </Badge>
          {work.year ? (
            <Badge variant="outline" className="text-xs bg-black/30 border-white/20 text-white">
              {work.year}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {editing ? (
          <div className="space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-9" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" className="h-9" />
              <Select value={category} onValueChange={(v) => setCategory(v as WorkCategory)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <h3 className="font-semibold line-clamp-2">{title || "Untitled"}</h3>
            <p className="text-xs text-muted-foreground">
              {work.category ?? "Uncategorized"} {work.year ? `• ${work.year}` : ""}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={editing ? "default" : "outline"}
              onClick={() => {
                if (editing) {
                  onSave({ ...work, title, year, category })
                }
                setEditing((prev) => !prev)
              }}
              className="flex-1"
            >
              {editing ? "Save" : <Edit className="w-4 h-4" />}
            </Button>
            <Select value={work.status || "draft"} onValueChange={(v) => onUpdateStatus(v as WorkStatus)}>
              <SelectTrigger className="flex-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="destructive" onClick={onDelete} className="w-full gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </div>
    </article>
  )
}
