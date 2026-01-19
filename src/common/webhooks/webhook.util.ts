import { createHmac } from 'crypto';

export function computeSignature(secret: string, payload: Buffer | string) {
  const h = createHmac('sha256', secret);
  if (Buffer.isBuffer(payload)) h.update(payload);
  else h.update(String(payload));
  return h.digest('hex');
}

export function verifySignature(
  secret: string,
  payload: Buffer | string,
  signature?: string,
) {
  if (!signature) return false;
  const expected = computeSignature(secret, payload);
  // constant-time comparison
  const bufA = Buffer.from(expected);
  const bufB = Buffer.from(signature);
  if (bufA.length !== bufB.length) return false;
  let result = 0;
  for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ bufB[i];
  return result === 0;
}
