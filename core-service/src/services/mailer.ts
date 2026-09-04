import { Resend } from "resend";

export interface InviteEmailParams {
  orgName: string;
  role: string;
  acceptUrl: string;
}

export interface Mailer {
  sendInviteEmail(to: string, params: InviteEmailParams): Promise<void>;
}

function renderInviteEmail({ orgName, role, acceptUrl }: InviteEmailParams) {
  const subject = `You've been invited to join ${orgName}`;
  const html = `
    <p>You've been invited to join <strong>${orgName}</strong> on Malm as a <strong>${role.toLowerCase()}</strong>.</p>
    <p><a href="${acceptUrl}">Accept invite</a></p>
    <p>This invite expires in 7 days.</p>
  `.trim();
  return { subject, html };
}

export class ResendMailer implements Mailer {
  constructor(
    private readonly client: Resend,
    private readonly from: string,
  ) {}

  async sendInviteEmail(to: string, params: InviteEmailParams): Promise<void> {
    const { subject, html } = renderInviteEmail(params);
    const { error } = await this.client.emails.send({ from: this.from, to, subject, html });
    if (error) throw new Error(`Resend failed to send invite email: ${error.message}`);
  }
}

// Dev-safe fallback when no RESEND_API_KEY is configured — logs instead of
// silently no-op'ing, so a misconfigured environment is obvious rather than
// looking like invites were sent.
export class ConsoleMailer implements Mailer {
  async sendInviteEmail(to: string, params: InviteEmailParams): Promise<void> {
    const { subject, html } = renderInviteEmail(params);
    console.log(`[mailer] RESEND_API_KEY not set — logging instead of sending.\nTo: ${to}\nSubject: ${subject}\n${html}`);
  }
}

export function createMailer(config: { resend: { apiKey: string; from: string } | null }): Mailer {
  if (!config.resend) return new ConsoleMailer();
  return new ResendMailer(new Resend(config.resend.apiKey), config.resend.from);
}
