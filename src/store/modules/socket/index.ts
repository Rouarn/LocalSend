import { reactive } from 'vue';
import { defineStore } from 'pinia';
import type { Socket } from 'socket.io-client';
import { SetupStoreId } from '@/enum';

export const useSocketStore = defineStore(SetupStoreId.Ws, () => {
  const socket: Api.Websocket.OnlineUser = reactive({
    socketId: '',
    socketName: '',
    ip: ''
  });

  const setSocket = (data: Socket & Api.Websocket.OnlineUser) => {
    socket.socketId = data.id || '';
    socket.socketName = data.socketName || '';
    socket.ip = data.ip || '';
  };

  return {
    socket,
    setSocket
  };
});
