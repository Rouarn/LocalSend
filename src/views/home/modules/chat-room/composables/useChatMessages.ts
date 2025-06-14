import { ref } from 'vue';

export function useChatMessages(props: any, _emit: any) {
  const messages = ref<Api.Websocket.Message[]>([]);
  const onlineUsers = ref<Api.Websocket.OnlineUser[]>([]);

  const listeneMessage = (data: Api.Websocket.Message) => {
    if (data.senderId === props.currentUser.socketId) return;
    messages.value.push(data);
  };

  const setOnlineUsers = (users: Api.Websocket.OnlineUser[]) => {
    onlineUsers.value.splice(0, onlineUsers.value.length);
    users.forEach(user => {
      onlineUsers.value.push(user);
    });
  };

  return {
    messages,
    onlineUsers,
    listeneMessage,
    setOnlineUsers
  };
}
