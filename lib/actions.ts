export type Actions = {
    saveContent: (content: any) => Promise<{ ok: boolean }>
    upsertWork: (work: any) => Promise<any>
    updateWorkStatus: (id: string, status: "draft" | "published" | "archived") => Promise<{ ok: boolean }>
    deleteWork: (id: string) => Promise<{ ok: boolean }>
  }
  