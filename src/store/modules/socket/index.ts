import { reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import type { Socket } from 'socket.io-client';
import { SetupStoreId } from '@/enum';

export const useSocketStore = defineStore(SetupStoreId.Ws, () => {
  const currentUser: Api.Websocket.OnlineUser = reactive({
    socketId: '',
    socketName: '',
    ip: ''
  });

  const isPrivateChat = ref(false);
  const privateChatUser: Api.Websocket.OnlineUser = reactive({
    socketId: '',
    socketName: '',
    ip: ''
  });

  const chatRoom = ref<Api.Websocket.ChatRoom>({
    roomId: '',
    roomName: ''
  });

  const setCurrentUser = (data: Socket & Api.Websocket.OnlineUser) => {
    currentUser.socketId = data.id || '';
    currentUser.socketName = data.socketName || '';
    currentUser.ip = data.ip || '';
  };

  const setPrivateChatUser = (data: Socket & Api.Websocket.OnlineUser) => {
    privateChatUser.socketId = data.id || '';
    privateChatUser.socketName = data.socketName || '';
    privateChatUser.ip = data.ip || '';
  };

  const setIsPrivateChat = (data: boolean) => {
    isPrivateChat.value = data;
  };

  const setChatRoom = (data: Api.Websocket.ChatRoom) => {
    chatRoom.value = data;
  };

  return {
    currentUser, // 当前用户信息
    setCurrentUser, // 设置当前用户信息
    isPrivateChat, // 是否是私聊
    setIsPrivateChat,
    privateChatUser, // 私聊用户信息
    setPrivateChatUser, // 设置私聊用户信息
    chatRoom,
    setChatRoom
  };
});
