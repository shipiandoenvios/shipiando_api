import { Injectable } from '@nestjs/common';

export type NotificationChannel = 'email' | 'sms' | 'push';

export interface NotificationPayload {
  to: string;
  subject?: string;
  message: string;
  channel: NotificationChannel;
  meta?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  async sendNotification(payload: NotificationPayload): Promise<void> {
    switch (payload.channel) {
      case 'email':
        await this.sendEmail(payload);
        break;
      case 'sms':
        await this.sendSms(payload);
        break;
      case 'push':
        await this.sendPush(payload);
        break;
      default:
        throw new Error('Unsupported notification channel');
    }
  }

  private async sendEmail(payload: NotificationPayload) {
    await Promise.resolve();
    console.log(
      `[EMAIL] To: ${payload.to} | Subject: ${payload.subject} | Message: ${payload.message}`,
    );
  }

  private async sendSms(payload: NotificationPayload) {
    await Promise.resolve();
    console.log(`[SMS] To: ${payload.to} | Message: ${payload.message}`);
  }

  private async sendPush(payload: NotificationPayload) {
    await Promise.resolve();
    console.log(`[PUSH] To: ${payload.to} | Message: ${payload.message}`);
  }
}
