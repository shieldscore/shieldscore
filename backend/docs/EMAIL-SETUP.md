# Inbound Email Setup for hello@shieldscore.io

## Current State

- **Outbound:** Resend sends transactional alerts from `alerts@shieldscore.io` (configured in `backend/lib/resend.ts`)
- **Inbound:** Not configured. No way to receive or reply to emails at `hello@shieldscore.io`
- **Goal:** Receive inbound email at `hello@shieldscore.io`, forwarded to `shieldscoreapp@gmail.com`, and reply from Gmail as `hello@shieldscore.io`

---

## Option A: Resend Inbound Email

Resend does **not** support inbound email or forwarding. It is outbound-only (transactional/marketing sends). Skip this option.

---

## Option B: DNS Email Forwarding (Recommended)

Use a free forwarding service to route `hello@shieldscore.io` to Gmail. Two good options:

### Option B1: ImprovMX (free tier, easiest)

**Step 1:** Create an account at https://improvmx.com

**Step 2:** Add your domain `shieldscore.io`

**Step 3:** Create a forwarding rule:
- Alias: `hello`
- Forward to: `shieldscoreapp@gmail.com`

**Step 4:** Add the DNS records ImprovMX provides. Go to your domain registrar (or Vercel/Cloudflare if DNS is managed there) and add:

```
MX  @  mx1.improvmx.com  (priority 10)
MX  @  mx2.improvmx.com  (priority 20)
```

**Step 5:** Add the SPF record (required for deliverability). If you already have an SPF record for Resend, merge them:

```
TXT  @  "v=spf1 include:spf.improvmx.com include:send.resend.com ~all"
```

If you do NOT have an existing SPF record yet:

```
TXT  @  "v=spf1 include:spf.improvmx.com ~all"
```

**Important:** You can only have ONE SPF (TXT) record per domain. If Resend already added one, combine the `include:` directives into a single record as shown above.

**Step 6:** Wait for DNS propagation (usually 5-30 minutes, can take up to 48 hours).

**Step 7:** Test by sending an email to `hello@shieldscore.io` from a personal account. It should arrive at `shieldscoreapp@gmail.com`.

### Option B2: ForwardEmail.net (free, open source alternative)

**Step 1:** Create an account at https://forwardemail.net

**Step 2:** Add domain `shieldscore.io` and verify ownership via DNS TXT record.

**Step 3:** Create a forwarding rule: `hello` -> `shieldscoreapp@gmail.com`

**Step 4:** Add the DNS records they provide:

```
MX  @  mx1.forwardemail.net  (priority 10)
MX  @  mx2.forwardemail.net  (priority 20)
TXT @  "forward-email=hello:shieldscoreapp@gmail.com"
```

**Step 5:** Merge SPF record:

```
TXT  @  "v=spf1 include:forwardemail.net include:send.resend.com ~all"
```

**Step 6:** Test the same way as B1.

### Which to pick?

ImprovMX is simpler to set up and has a cleaner UI. ForwardEmail is open source and has no forwarding limits on the free tier. Either works fine.

---

## Option C: Gmail "Send As" Setup

After forwarding is working (Option B), set up Gmail so you can reply FROM `hello@shieldscore.io`.

### Using ImprovMX SMTP (recommended with Option B1)

ImprovMX provides a free SMTP relay for sending through their service.

**Step 1:** In ImprovMX, go to your domain settings and generate SMTP credentials. Note the username and password.

**Step 2:** Open Gmail (logged into `shieldscoreapp@gmail.com`).

**Step 3:** Go to **Settings** (gear icon) > **See all settings** > **Accounts and Import** tab.

**Step 4:** Under "Send mail as", click **Add another email address**.

**Step 5:** Enter:
- Name: `ShieldScore` (or whatever display name you want)
- Email: `hello@shieldscore.io`
- Uncheck "Treat as an alias" (leave unchecked)

**Step 6:** Click **Next Step**. Enter the SMTP details:
- SMTP Server: `smtp.improvmx.com`
- Port: `587`
- Username: your ImprovMX SMTP username
- Password: your ImprovMX SMTP password
- Select **TLS**

**Step 7:** Click **Add Account**. Gmail will send a verification email to `hello@shieldscore.io`.

**Step 8:** Since forwarding is already set up, the verification email will arrive at `shieldscoreapp@gmail.com`. Click the confirmation link or enter the code.

**Step 9:** Back in Gmail Settings > Accounts and Import, optionally set `hello@shieldscore.io` as the **default** send address.

### Using Resend SMTP (alternative)

If you prefer to send replies through Resend instead of ImprovMX:

**Step 1:** Get your Resend SMTP credentials from https://resend.com/settings/smtp

Resend SMTP details:
- Server: `smtp.resend.com`
- Port: `587` (or `465` for SSL)
- Username: `resend`
- Password: your Resend API key

**Step 2:** Follow Steps 2-9 above, but use Resend SMTP details in Step 6.

**Note:** Resend requires the sending domain to be verified. `shieldscore.io` should already be verified since you use it for outbound alerts. Make sure the `from` address `hello@shieldscore.io` is allowed in your Resend domain settings.

---

## DNS Records Summary

After setup, your DNS should have these records for `shieldscore.io`:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| MX | @ | `mx1.improvmx.com` (priority 10) | Inbound email routing |
| MX | @ | `mx2.improvmx.com` (priority 20) | Inbound email routing (fallback) |
| TXT | @ | `v=spf1 include:spf.improvmx.com include:send.resend.com ~all` | Email authentication |
| TXT | @ | Resend DKIM record (already set up) | Outbound email signing |
| CNAME | resend._domainkey | Resend DKIM value (already set up) | Outbound email signing |

**Do not remove** any existing Resend DNS records. They handle outbound delivery for `alerts@shieldscore.io`.

---

## Verification Checklist

- [ ] MX records added and propagated (`dig MX shieldscore.io` to check)
- [ ] SPF record includes both ImprovMX and Resend
- [ ] Test email to `hello@shieldscore.io` arrives at `shieldscoreapp@gmail.com`
- [ ] Gmail "Send As" configured for `hello@shieldscore.io`
- [ ] Test reply from Gmail shows `hello@shieldscore.io` as the sender
- [ ] Existing Resend outbound (alerts@shieldscore.io) still works
