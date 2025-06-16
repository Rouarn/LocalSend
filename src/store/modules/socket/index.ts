import { ref } from 'vue';
import { defineStore } from 'pinia';
import { SetupStoreId } from '@/enum';

export const useSocketStore = defineStore(SetupStoreId.Ws, () => {
  const currentUser = ref<Api.Websocket.OnlineUser>({
    socketId: '',
    socketName: '',
    introduction: ''
  });

  const isPrivateChat = ref(false);
  const privateChatUser = ref<Api.Websocket.OnlineUser>({
    socketId: '',
    socketName: '',
    introduction: ''
  });

  const chatRoom = ref<Api.Websocket.ChatRoom>({
    roomId: '',
    roomName: ''
  });

  const setCurrentUser = (data: Api.Websocket.OnlineUser) => {
    currentUser.value = data;
  };

  const setPrivateChatUser = (data: Api.Websocket.OnlineUser) => {
    privateChatUser.value = data;
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
