import { Injectable, Logger } from '@nestjs/common';
import { CrazyGamesTokenPayloadDTO } from '@dtos';
import { jwtVerify } from 'jose';
import { createPublicKey, KeyObject } from 'crypto';
import { CustomeError } from '@utils';
import { messageKey } from '@constants';

@Injectable()
export class CrazyGamesTokenVerifierService {
  private readonly logger = new Logger(CrazyGamesTokenVerifierService.name);
  private readonly publicKeyUrl = 'https://sdk.crazygames.com/publicKey.json';
  private cachedPublicKey: KeyObject | null = null;
  private cachedPublicKeyPem: string | null = null;

  async verifyToken(token: string): Promise<CrazyGamesTokenPayloadDTO> {
    if (!token?.trim()) {
      throw new CustomeError(
        messageKey.pleaseProvideRequiredFields,
      );
    }

    const publicKey = await this.getPublicKey();

    try {
      const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ['RS256'],
      });

      if (
        typeof payload.userId !== 'string' ||
        typeof payload.username !== 'string' ||
        typeof payload.profilePictureUrl !== 'string' ||
        typeof payload.exp !== 'number' ||
        typeof payload.iat !== 'number'
      ) {
        throw new CustomeError(messageKey.tokenError);
      }

      return payload as unknown as CrazyGamesTokenPayloadDTO;
    } catch (error) {
      // CrazyGames recommends refetching the key when decode fails, in case the key changed.
      if (this.cachedPublicKeyPem) {
        this.cachedPublicKey = null;
        this.cachedPublicKeyPem = null;
        const refreshedKey = await this.getPublicKey();

        try {
          const { payload } = await jwtVerify(token, refreshedKey, {
            algorithms: ['RS256'],
          });

          if (
            typeof payload.userId !== 'string' ||
            typeof payload.username !== 'string' ||
            typeof payload.profilePictureUrl !== 'string' ||
            typeof payload.exp !== 'number' ||
            typeof payload.iat !== 'number'
          ) {
            throw new CustomeError(messageKey.tokenError);
          }

          return payload as unknown as CrazyGamesTokenPayloadDTO;
        } catch {
          throw new CustomeError(messageKey.tokenError);
        }
      }

      throw new CustomeError(messageKey.tokenError);
    }
  }

  private async getPublicKey(): Promise<KeyObject> {
    if (this.cachedPublicKey) {
      return this.cachedPublicKey;
    }

    try {
      const response = await fetch(this.publicKeyUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch CrazyGames public key: ${response.status}`);
      }

      const data = (await response.json()) as { publicKey?: string };

      if (!data.publicKey) {
        throw new Error('CrazyGames public key response did not include a publicKey');
      }

      this.cachedPublicKeyPem = data.publicKey;
      this.cachedPublicKey = createPublicKey(data.publicKey);
      return this.cachedPublicKey;
    } catch (error) {
      this.logger.error('Failed to fetch or parse CrazyGames public key', error);
      throw new CustomeError(messageKey.failedToAuthenticate);
    }
  }
}
