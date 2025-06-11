import type { ManagerOptions, Socket, SocketOptions } from 'socket.io-client';
import { io } from 'socket.io-client';

let socketInstance: Socket | null = null;

interface WebSocketOptions extends Partial<ManagerOptions & SocketOptions> {
  query?: Record<string, string>;
}

/**
 * 获取或创建 Socket.IO 实例
 *
 * @param url 服务器地址
 * @param options 连接选项
 * @returns Socket.IO 实例
 */
export function getSocketInstance(url: string = 'http://localhost:3000', options: WebSocketOptions = {}): Socket {
  if (!socketInstance) {
    const defaultOptions: WebSocketOptions = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      query: { token: '111' },
      ...options
    };

    socketInstance = io(url, defaultOptions);
  }
  return socketInstance;
}

/** 重置 Socket 实例（用于重新连接或更改配置） */
export function resetSocketInstance(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
