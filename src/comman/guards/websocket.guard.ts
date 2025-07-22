import { Socket } from 'socket.io';
import { JwtService } from '@utils';
import { messageKey } from '@constants';
import { UnauthorizedException } from '@nestjs/common';

export type SocketMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => void;

export const AuthWsMiddleware = (jwtService: JwtService): SocketMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) throw new UnauthorizedException(messageKey.tokenError);
      const decoded: any = await jwtService.jwtTokenVerifier(token);

      if (!decoded?.payload?.userData)
        throw new UnauthorizedException(messageKey.tokenError);

      // Attach user to socket data
      socket.data.user = decoded.payload.userData;
      return next();
    } catch (err) {
      next(new UnauthorizedException(messageKey.tokenError ?? err.message));
    }
  };
};
