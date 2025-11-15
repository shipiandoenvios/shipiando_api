import { Injectable } from '@nestjs/common';

export type NotificationChannel = 'email' | 'sms' | 'push';

export interface NotificationPayload {
  to: string;
  subject?: string;
  message: string;
  channel: NotificationChannel;
  meta?: Record<string, any>;
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
    // TODO: Integrate with real email provider (e.g., nodemailer)
    console.log(`[EMAIL] To: ${payload.to} | Subject: ${payload.subject} | Message: ${payload.message}`);
  }

  private async sendSms(payload: NotificationPayload) {
    // TODO: Integrate with real SMS provider (e.g., Twilio)
    console.log(`[SMS] To: ${payload.to} | Message: ${payload.message}`);
  }

  private async sendPush(payload: NotificationPayload) {
    // TODO: Integrate with real push provider (e.g., FCM/WebPush)
    console.log(`[PUSH] To: ${payload.to} | Message: ${payload.message}`);
  }
}
