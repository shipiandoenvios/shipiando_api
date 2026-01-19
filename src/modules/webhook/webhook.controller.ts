import {
  Controller,
  Post,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { verifySignature } from '../../common/webhooks/webhook.util';
import type { Request, Response } from 'express';

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  @Post(':carrier')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inbound webhook endpoint for carriers (signed)' })
  receive(
    @Param('carrier') carrier: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const raw = req.body as Buffer | string;
    const signatureHeader = req.headers['x-shi-signature'] as
      | string
      | undefined;

    const envKey = `WEBHOOK_SECRET_${carrier.toUpperCase()}`;
    const secret =
      process.env[envKey] || process.env.WEBHOOK_SECRETS || undefined;

    if (!secret || !verifySignature(secret, raw, signatureHeader)) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid signature' });
    }

    // parse JSON payload
    let payload: unknown;
    try {
      const bodyStr = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
      payload = JSON.parse(bodyStr);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid JSON' });
    }

    // For now: log to stdout / structured log and return 200. Integrations can hook into message bus later.
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        carrier,
        event: payload,
      }),
    );
    return res.json({ success: true });
  }
}
