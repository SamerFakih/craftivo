/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendContractEmailOptions {
  contractId: number;
  subject?: string;
  recipients: { email: string; name?: string; role: string; token: string }[];
  message?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: nodemailer.Transporter;
  private from = 'no-reply@example.com';
  private appBaseUrl: string;
  private isTestAccount = false;

  constructor(private readonly config: ConfigService) {
    this.appBaseUrl =
      this.config.get<string>('APP_BASE_URL') || 'http://localhost:3000';
    void this.setupTransport();
  }

  private async setupTransport(): Promise<void> {
    const host = this.config.get<string>('MAIL_HOST');
    const port = parseInt(this.config.get<string>('MAIL_PORT') || '0', 10);
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');
    const fromEnv = this.config.get<string>('MAIL_FROM');

    try {
      if (host && port && user && pass) {
        this.from = fromEnv || (user ? `${user}@${host}` : this.from);
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        await this.transporter.verify();
        this.logger.log('Email transporter verified (real credentials).');
        this.logger.log('[EmailService] Mode = REAL_SMTP');
        return;
      }

      // Fallback Ethereal test account
      const testAccount = await nodemailer.createTestAccount();
      this.isTestAccount = true;
      this.from = fromEnv || `"Craftivo Test" <${testAccount.user}>`;
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      await this.transporter.verify();
      this.logger.warn(
        'Using Ethereal test account (configure MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASS for production).',
      );
      this.logger.log('[EmailService] Mode = ETHEREAL_TEST');
    } catch (err) {
      this.logger.error(
        'Failed to initialize email transporter; operating in log-only mode',
        err as Error,
      );
      this.transporter = undefined;
      this.logger.warn('[EmailService] Mode = LOG_ONLY');
    }
  }

  private buildContractEmailHtml(opts: SendContractEmailOptions) {
    const rows = opts.recipients
      .map((r) => {
        const link = `${this.appBaseUrl}/contracts/public/${r.token}`;
        return `<tr><td style="padding:8px 12px; border:1px solid #e5e7eb; font-family:Arial,sans-serif; font-size:13px;">${r.role}</td><td style="padding:8px 12px; border:1px solid #e5e7eb; font-family:Arial,sans-serif; font-size:13px;"><a href="${link}">${link}</a></td></tr>`;
      })
      .join('');
    const messageBlock = opts.message
      ? `<p style="font-family:Arial,sans-serif; font-size:14px; line-height:1.4;">${this.escapeHtml(
          opts.message,
        )}</p>`
      : '';
    return `<!DOCTYPE html><html><body style="margin:0; padding:24px; background:#f9fafb;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:28px;">
        <h2 style="margin:0 0 16px; font-family:Arial,sans-serif; font-weight:600; font-size:20px; color:#111827;">Contract Signature Request</h2>
        <p style="font-family:Arial,sans-serif; font-size:14px; line-height:1.5; margin:0 0 14px;">You have been invited to sign contract #${opts.contractId}. Use the secure links below for each role.</p>
        ${messageBlock}
        <table style="border-collapse:collapse; width:100%; margin-top:12px;"> <thead><tr><th style="text-align:left; padding:8px 12px; border:1px solid #e5e7eb; font-family:Arial,sans-serif; background:#f3f4f6; font-size:12px;">Role</th><th style="text-align:left; padding:8px 12px; border:1px solid #e5e7eb; font-family:Arial,sans-serif; background:#f3f4f6; font-size:12px;">Secure Link</th></tr></thead><tbody>${rows}</tbody></table>
        <p style="font-family:Arial,sans-serif; font-size:12px; color:#6b7280; margin-top:24px;">If you did not expect this email you can ignore it.</p>
      </div>
    </body></html>`;
  }

  private escapeHtml(str: string) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async sendContractEmail(opts: SendContractEmailOptions): Promise<void> {
    const subject =
      opts.subject || `Contract Signature Request #${opts.contractId}`;
    const html = this.buildContractEmailHtml(opts);
    const text =
      opts.message ||
      `You have been invited to sign contract #${opts.contractId}. Visit the provided secure links.`;

    const transporter = this.transporter;
    if (!transporter) {
      // Fallback logging mode – does not throw to keep flows working.
      this.logger.log(
        `[LOG-ONLY EMAIL] subject="${subject}" contract=${opts.contractId} recipients=${opts.recipients
          .map((r) => r.email)
          .join(',')}`,
      );
      this.logger.warn('[EmailService] send skipped (mode LOG_ONLY).');
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: this.from,
        to: Array.from(new Set(opts.recipients.map((r) => r.email))).join(','),
        subject,
        html,
        text,
      });
      let extra = '';
      if (this.isTestAccount) {
        const preview = nodemailer.getTestMessageUrl(info);
        extra = preview ? ` preview=${preview}` : '';
      }
      this.logger.log(
        `Contract email sent: contract=${opts.contractId} recipients=${opts.recipients.length}${extra}`,
      );
    } catch (err) {
      this.logger.error('sendContractEmail failed', err as Error);
    }
  }
}
