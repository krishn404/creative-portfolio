# Newsletter launch runbook

This newsletter keeps its subscriber list in Convex. Resend is used only to deliver the messages.

## 1. Resend domain setup

1. Add the sending domain in Resend. Use the domain that will appear in `NEWSLETTER_FROM`, for example `letter@krixnx.xyz`.
2. Add every DNS record Resend provides for domain verification. This normally includes SPF and DKIM records. Do not replace existing SPF records: merge Resend's include with the one existing SPF TXT record if the domain already sends mail through another provider.
3. Add a DMARC TXT record at `_dmarc.<your-domain>`. Start with a monitoring policy, then tighten it after delivery checks. Example:

   ```txt
   v=DMARC1; p=none; rua=mailto:dmarc@your-domain
   ```

4. Wait for Resend to show the domain as verified. Send a test email to Gmail and to a second provider such as Outlook or Proton Mail. Confirm it arrives in the inbox, displays the intended sender, and contains the unsubscribe footer.

## 2. Environment variables

Set the existing admin credentials in Vercel for the production deployment:

```txt
ADMIN_PASSWORD=<strong unique password>
ADMIN_SESSION_TOKEN=<strong random token>
```

Set these values in the **production Convex deployment**. Do not prefix any of them with `NEXT_PUBLIC_` and do not add them to `.env` files committed to the repository.

```txt
ADMIN_SESSION_TOKEN=<the exact same value as Vercel>
RESEND_API_KEY=re_...
SITE_URL=https://art.krixnx.xyz
NEWSLETTER_FROM=Krishna <letter@your-domain>
```

`ADMIN_SESSION_TOKEN` allows the site server to make an authenticated admin request to Convex. Resend configuration is read only inside Convex actions.

For development, set the same names in the development Convex deployment, using a Resend test sender if preferred.

## 3. Deploy

1. Deploy Convex schema and functions to production:

   ```powershell
   pnpm exec convex deploy
   ```

2. Confirm the production Convex deployment has all four variables above.
3. Deploy the Next.js site to Vercel. Confirm Vercel has `NEXT_PUBLIC_CONVEX_URL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_TOKEN` configured for Production.
4. Open `/letter` in a private browser window and `/admin` in an authenticated browser window.

## 4. Final manual test script

1. Open `/letter?src=story` and subscribe a test address.
2. Subscribe the same address again. The visitor should receive the same success response and Convex should have one record only.
3. Submit an invalid address. Confirm no record is added and the form shows an error.
4. Open `/unsubscribe?id=<subscriber-id>`. Confirm the record is still active before pressing the button; press **Confirm unsubscribe** and confirm it becomes `unsubscribed`.
5. Submit the same address again through `/letter`. Confirm it becomes active again.
6. Log in at `/admin`, open **Newsletter**, and confirm the source count, search, CSV export, and manual removal work.
7. Compose a letter and use **Send test** to Gmail, then a second provider. Check sender, inbox placement, responsive layout, plain-text view, unsubscribe footer, and the `List-Unsubscribe` header.
8. Create a small active test list. Use **Send to all active**, read the recipient count in the confirmation dialog, and send. Confirm broadcast history shows the sent and failed counts and each recipient receives one email only.

## Operational notes

- Manual remove is a soft unsubscribe. It intentionally retains the address so it cannot be mailed again accidentally.
- A failed broadcast retains per-recipient delivery state. Do not create a second broadcast to retry until reviewing its history; the system persists batch keys to prevent accidental duplicates within a broadcast.
- There are no analytics pixels or tracking links in this implementation.
