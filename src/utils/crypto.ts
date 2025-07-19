import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('CRYPTO_SECRET');
  }

  private padKey(key: string): Buffer {
    const keyBuffer = Buffer.from(key, 'utf-8');
    if (keyBuffer.length >= 32) {
      return keyBuffer.slice(0, 32);
    } else {
      const paddedKey = Buffer.alloc(32);
      keyBuffer.copy(paddedKey);
      return paddedKey;
    }
  }

  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      this.padKey(this.secretKey),
      iv,
    );
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, encryptedText] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      this.padKey(this.secretKey),
      iv,
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
