import { NotificationChannel } from '../notification.service';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(['email', 'sms', 'push'])
  channel: NotificationChannel;

  @IsOptional()
  meta?: Record<string, unknown>;
}
