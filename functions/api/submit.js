// Cloudflare Pages Function — handles the Contact and Book a Demo forms.
//
// Sends mail via Cloudflare's native Email Routing (the `send_email` Worker
// binding), so there's no third-party form service or API key involved.
// One-off setup required in the Cloudflare dashboard for the fluentai.uk
// Pages project:
//   1. Zone > Email > Email Routing: enable it for fluentai.uk, and add
//      hello@fluentai.co.uk as a verified destination address.
//   2. Pages project > Settings > Functions > Email bindings: add a
//      binding named SEND_EMAIL, "Send email" destination address
//      hello@fluentai.co.uk.
//
// FROM_ADDRESS must be on a domain with Email Routing enabled in the same
// Cloudflare account (fluentai.uk).
import { EmailMessage } from "cloudflare:email";

const FROM_ADDRESS = "noreply@fluentai.uk";
const TO_ADDRESS = "hello@fluentai.co.uk";

export async function onRequestPost(context) {
  const { request, env } = context;
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");

  let fields;
  try {
    fields = await readFields(request);
  } catch {
    return fail(wantsJson, request, "We couldn't read your submission. Please try again.", 400);
  }

  // Honeypot: a field real visitors never see or fill in. Bots that fill
  // every field trip it, and we quietly pretend to succeed.
  if (fields.website) {
    return succeed(wantsJson, request);
  }

  const formType = fields.form_type === "demo" ? "demo" : "contact";
  const name = oneLine(fields.name);
  const email = oneLine(fields.email);
  const organisation = oneLine(fields.organisation);
  const role = oneLine(fields.role);
  const message = multiLine(fields.message);

  if (!name || !isPlausibleEmail(email) || (formType === "contact" && !message) || (formType === "demo" && !organisation)) {
    return fail(wantsJson, request, "Please fill in all required fields with a valid email address.", 400);
  }

  const subject = formType === "demo"
    ? `New demo request from ${name}`
    : `New contact form message from ${name}`;

  const lines = [`Name: ${name}`, `Email: ${email}`];
  if (organisation) lines.push(`Organisation: ${organisation}`);
  if (role) lines.push(`Role: ${role}`);
  if (message) lines.push("", "Message:", message);
  lines.push("", "— Sent from the fluentai.uk website form.");

  const raw = buildRawEmail({
    from: `FluentAI Website <${FROM_ADDRESS}>`,
    to: TO_ADDRESS,
    replyTo: email,
    subject,
    body: lines.join("\n"),
  });

  try {
    const message = new EmailMessage(FROM_ADDRESS, TO_ADDRESS, raw);
    await env.SEND_EMAIL.send(message);
  } catch (err) {
    return fail(wantsJson, request, "We couldn't send your message right now. Please email hello@fluentai.co.uk directly.", 502);
  }

  return succeed(wantsJson, request);
}

async function readFields(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

function oneLine(value) {
  return typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").slice(0, 300) : "";
}

function multiLine(value) {
  return typeof value === "string" ? value.trim().replace(/\r\n/g, "\n").slice(0, 4000) : "";
}

function isPlausibleEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildRawEmail({ from, to, replyTo, subject, body }) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${oneLine(replyTo)}`,
    `Subject: ${oneLine(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
}

function succeed(wantsJson, request) {
  if (!wantsJson) {
    return Response.redirect(new URL("/thank-you.html", request.url), 303);
  }
  return json({ ok: true });
}

function fail(wantsJson, request, error, status) {
  if (!wantsJson) {
    const url = new URL("/thank-you.html", request.url);
    url.searchParams.set("error", "1");
    return Response.redirect(url, 303);
  }
  return json({ ok: false, error }, status);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=UTF-8" },
  });
}
