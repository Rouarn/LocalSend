import { onUnmounted } from 'vue';
import type { ManagerOptions, Socket, SocketOptions } from 'socket.io-client';
import { getSocketInstance, resetSocketInstance } from './socket';

interface UseSocketReturn {
  /** Socket.IO 实例 */
  socket: Socket;

  /**
   * 监听事件
   *
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  listen: <T>(event: string, callback: (data: T) => void) => () => void;

  /**
   * 发送事件
   *
   * @param event 事件名称
   * @param data 发送的数据
   */
  emit: (event: string, data?: unknown) => void;

  /** 是否已连接 */
  connected: boolean;

  /** 重置 Socket 连接 */
  reset: () => void;
}

/**
 * Vue 组合式函数 for Socket.IO
 *
 * @param url 服务器地址
 * @param options 连接选项
 * @returns UseSocketReturn
 */
export function useSocket(url?: string, options?: Partial<ManagerOptions & SocketOptions>): UseSocketReturn {
  const socket = getSocketInstance(url, options);

  /** 封装监听方法 */
  function listen<T>(event: string, callback: (data: T) => void): () => void {
    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }

  /** 封装发送方法 */
  function emit(event: string, data?: unknown): void {
    socket.emit(event, data);
  }

  /** 重置连接 */
  function reset(): void {
    resetSocketInstance();
  }

  // 组件卸载时自动取消所有监听
  onUnmounted(() => {
    socket.off();
  });

  return {
    socket,
    listen,
    emit,
    connected: socket.connected,
    reset
  };
}
