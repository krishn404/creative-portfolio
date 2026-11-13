function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character)
}

function paragraphs(value: string) {
  return escapeHtml(value.trim()).replace(/\n/g, "<br />")
}

export function buildNewsletterContent(subject: string, workUpdate: string, affirmation: string) {
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f0;color:#111;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f0;"><tr><td style="padding:32px 16px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #111;"><tr><td style="padding:32px 28px;"><p style="margin:0 0 24px;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#555;">A monthly letter from Krishna</p><h1 style="margin:0 0 24px;font-size:28px;line-height:1.15;font-weight:700;color:#111;">${escapeHtml(subject)}</h1><p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#111;">What I&apos;m working on</p><p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#222;">${paragraphs(workUpdate)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3eddf;border:1px solid #111;"><tr><td style="padding:20px;"><p style="margin:0 0 10px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;font-weight:700;color:#111;">Affirmation postcard</p><p style="margin:0;font-size:17px;line-height:1.6;color:#111;">${paragraphs(affirmation)}</p></td></tr></table><p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#666;">You&apos;re receiving this because you joined the monthly letter. <a href="{{unsubscribeUrl}}" style="color:#111;">Unsubscribe</a></p></td></tr></table></td></tr></table></body></html>`
  const text = `${subject}\n\nWhat I'm working on\n${workUpdate.trim()}\n\nAffirmation postcard\n${affirmation.trim()}\n\nYou're receiving this because you joined the monthly letter. Unsubscribe: {{unsubscribeUrl}}`
  return { html, text }
}
