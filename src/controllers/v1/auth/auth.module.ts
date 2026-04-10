import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { modelKey } from 'src/constants/model.contants';
import { UserSchema } from 'src/models/user.model';
import { CrazyGamesTokenVerifierService } from './crazygames-token-verifier.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: modelKey.users, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, CrazyGamesTokenVerifierService],
})
export class AuthModule {}
