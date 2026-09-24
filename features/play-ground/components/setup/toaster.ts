import { toast } from "sonner"

type ToastOptions = { title?: string; description?: string; type?: "success" | "error" | "warning" | "info"; duration?: number }

export const toaster = {
  create({ title, description, type = "info", duration }: ToastOptions) {
    const message = title ?? "Playground"
    const options = { description, duration }
    if (type === "success") toast.success(message, options)
    else if (type === "error") toast.error(message, options)
    else if (type === "warning") toast.warning(message, options)
    else toast.info(message, options)
  },
}
