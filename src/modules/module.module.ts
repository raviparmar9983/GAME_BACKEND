import { Global, Module } from '@nestjs/common';
import { CryptoService, JwtService } from '@utils';
import { AuthModule, GameModule, BotModule } from '@v1';
import { EmailService } from 'src/utils/nodemailer';
import { PresenceService } from 'src/utils/presence.service';

@Global()
@Module({
  imports: [AuthModule, GameModule, BotModule],
  providers: [JwtService, CryptoService, EmailService, PresenceService],
  exports: [JwtService, CryptoService, EmailService, PresenceService],
})
export class Modules {}
