import type { Ref } from 'vue';
import { ref } from 'vue';
import type { ManagerOptions, Socket, SocketOptions } from 'socket.io-client';
import { io } from 'socket.io-client';
import { useSocketStore } from '@/store/modules/socket';
import { getServiceBaseURL } from '@/utils/service';
import { emitLogInfo } from '@/utils/mittBus';

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
  emit: (event: string, data?: unknown) => Promise<any>;

  /** 是否已连接（响应式） */
  connected: Ref<boolean>;

  /** 重置 Socket 连接 */
  reset: () => void;

  /** 监听WebRTC offer事件 */
  listenRTCOffer: (
    callback: (data: { roomId: string; senderId: string; description: RTCSessionDescriptionInit }) => void
  ) => () => void;

  /** 监听WebRTC answer事件 */
  listenRTCAnswer: (
    callback: (data: { roomId: string; senderId: string; description: RTCSessionDescriptionInit }) => void
  ) => () => void;

  /** 监听WebRTC ICE候选事件 */
  listenRTCIceCandidate: (
    callback: (data: { roomId: string; senderId: string; candidate: RTCIceCandidate }) => void
  ) => () => void;
}

let socketInstance: Socket | null = null;

interface WebSocketOptions extends Partial<ManagerOptions & SocketOptions> {
  query?: Record<string, string>;
}

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { otherBaseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

const useWebSocket = useSocketStore();
/**
 * 获取或创建 Socket.IO 实例
 *
 * @param url 服务器地址
 * @param options 连接选项
 * @returns Socket.IO 实例
 */
function getSocketInstance(url: string = otherBaseURL.ws, options: WebSocketOptions = {}): Socket {
  if (!socketInstance) {
    const defaultOptions: WebSocketOptions = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      query: {},
      ...options
    };

    socketInstance = io(url, defaultOptions);
  }
  return socketInstance;
}

/** 重置 Socket 实例（用于重新连接或更改配置） */
function resetCurrentUserInstance(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
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
  const connected = ref(socket.connected); // 使用 ref 跟踪连接状态

  // 监听连接和断开事件
  socket.on('connect', () => {
    connected.value = true;
    useWebSocket.setCurrentUser({ socketId: socket.id || '', socketName: socket.id || '', introduction: '' });
    emitLogInfo({
      id: 'socket-connect',
      type: 'success',
      message: 'Socket.IO 连接成功'
    });
  });

  socket.on('disconnect', () => {
    connected.value = false;
    emitLogInfo({
      id: 'socket-disconnect',
      type: 'error',
      message: 'Socket.IO 断开连接'
    });
  });

  /** 封装监听方法 */
  function listen<T>(event: string, callback: (data: T) => void): () => void {
    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }

  /** 封装发送方法 */
  function emit(event: string, data?: unknown): Promise<any> {
    return new Promise(resolve => {
      if (!connected.value) {
        return;
      }

      socket.emit(event, data, (cb: any) => {
        emitLogInfo({
          id: 'socket-callback',
          type: 'info',
          message: `服务器已收到:  ${event}`
        });

        resolve(cb);
      });

      emitLogInfo({
        id: 'socket-emit',
        type: 'info',
        message: `Socket.IO 发送数据 ${event}: ${JSON.stringify(data)}`
      });
    });
  }

  /** 封装WebRTC offer监听方法 */
  function listenRTCOffer(callback: (data: any) => void): () => void {
    listen('listen:offer', callback);
    return () => socket.off('listen:offer', callback);
  }

  /** 封装WebRTC answer监听方法 */
  function listenRTCAnswer(callback: (data: any) => void): () => void {
    listen('listen:answer', callback);
    return () => socket.off('listen:answer', callback);
  }

  /** 封装WebRTC ICE候选监听方法 */
  function listenRTCIceCandidate(callback: (data: any) => void): () => void {
    listen('listen:iceCandidate', callback);
    return () => socket.off('listen:iceCandidate', callback);
  }

  /** 重置连接 */
  function reset(): void {
    resetCurrentUserInstance();
    connected.value = false; // 重置时标记为断开连接
  }

  return {
    socket,
    listen,
    emit,
    connected, // 返回响应式的值
    reset,
    listenRTCOffer,
    listenRTCAnswer,
    listenRTCIceCandidate
  };
}
