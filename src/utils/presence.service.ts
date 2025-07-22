import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  private onlineUsers = new Map<string, Set<string>>();

  addConnection(userId: string, socketId: string) {
    const sockets = this.onlineUsers.get(userId) || new Set();
    sockets.add(socketId);
    this.onlineUsers.set(userId, sockets);
    // console.log(this.onlineUsers);
  }

  removeConnection(userId: string, socketId: string) {
    const sockets = this.onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.onlineUsers.delete(userId);
    }
    // console.log(this.onlineUsers);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsers(): string[] {
    return [...this.onlineUsers.keys()];
  }

  getUserSocketIds(userId: string): string[] {
    return [...(this.onlineUsers.get(userId) ?? [])];
  }
}
