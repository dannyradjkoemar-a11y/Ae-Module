/**
 * TOTP and Security Utilities
 * Generates and validates standard HMAC-SHA1 RFC 6238 time-based tokens
 * using native Web Crypto APIs.
 */

// Base32 decoding
export function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

// Generate random Base32 secret
export function generateBase32Secret(length = 16): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    secret += alphabet[randomValues[i] % alphabet.length];
  }
  return secret;
}

// Generate TOTP code for a given timestamp
export async function generateTOTP(secretBase32: string, timeStepWindow = 30, offsetSteps = 0): Promise<string> {
  const keyBytes = base32ToBytes(secretBase32);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / timeStepWindow) + offsetSteps;

  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setBigUint64(0, BigInt(timeStep));

  const hmac = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
  const hmacBytes = new Uint8Array(hmac);

  const offset = hmacBytes[hmacBytes.length - 1] & 0xf;
  const codeInt =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const otp = codeInt % 1000000;
  return otp.toString().padStart(6, '0');
}

// Verify TOTP code with -1, 0, +1 window tolerance
export async function verifyTOTP(token: string, secretBase32: string): Promise<boolean> {
  const cleanToken = token.trim();
  if (cleanToken.length !== 6) return false;

  for (let offset = -1; offset <= 1; offset++) {
    const expected = await generateTOTP(secretBase32, 30, offset);
    if (expected === cleanToken) {
      return true;
    }
  }
  return false;
}
