import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { messageKey } from 'src/constants/message.constants';
import { JwtService } from 'src/utils/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const req = context.switchToHttp().getRequest();
      const { authorization }: any = req.headers;
      if (!authorization || !authorization.includes('Bearer'))
        throw new UnauthorizedException(messageKey.tokenError);
      const authToken = authorization.replace(/bearer/gim, '').trim();
      const decoded: any = await this.jwtService.jwtTokenVerifier(authToken);
      if (!decoded?.payload?.userData)
        throw new UnauthorizedException(messageKey.tokenError);
      req.body.jwtTokendata = decoded?.payload?.userData;
      return true;
    } catch (err) {
      throw new ForbiddenException(err);
    }
  }
}
