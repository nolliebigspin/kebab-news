/**
 * SMTP mailer for magic-link login emails. The transport is built lazily on
 * first use so the SMTP env vars are only required when an email actually
 * needs to be sent — the worker and the web build never construct it. This
 * mirrors the AI-key "validate on use" pattern in @kebab/env.
 */
import { env } from "@kebab/env";
import { createTransport, type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to send magic-link emails."
    );
  }

  transporter = createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    // 465 = implicit TLS; everything else (587/STARTTLS) negotiates upward.
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/** Send a magic-link login email. Throws if SMTP or EMAIL_FROM is unset. */
export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  const from = env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set — cannot send magic-link emails.");
  }

  await getTransporter().sendMail({
    from,
    to,
    subject: "Dein Anmeldelink für kebab.news",
    text: `Hallo,\n\nmit diesem Link meldest du dich bei kebab.news an:\n\n${url}\n\nDer Link ist nur kurze Zeit gültig und kann einmal verwendet werden. Falls du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren.\n\n— kebab.news`,
    html: `<p>Hallo,</p><p>mit diesem Link meldest du dich bei kebab.news an:</p><p><a href="${url}">Bei kebab.news anmelden</a></p><p>Der Link ist nur kurze Zeit gültig und kann einmal verwendet werden. Falls du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren.</p><p>— kebab.news</p>`,
  });
}
