<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useSocketStore } from '@/store/modules/socket';
import { useAppStore } from '@/store/modules/app';
import mittBus, { emitLogInfo } from '@/utils/mittBus';
import { useSocket } from '@/utils/useSocket';
import OnlineUser from './modules/online-user.vue';
import ChatRoom from './modules/chat-room/chat-room.vue';
import LogRecord from './modules/log-record.vue';

interface privateChat {
  message: string;
  targetId: string;
  targetName: string;
  fromId: string;
  fromName: string;
  roomId: string;
  roomName: string;
}

const socketStore = useSocketStore();
const appStore = useAppStore();
const { listen, emit } = useSocket();

const currentUser = computed(() => socketStore.currentUser);
const privateChatUser = computed(() => socketStore.privateChatUser);
const isPrivateChat = computed(() => socketStore.isPrivateChat);
const chatRoom = computed(() => socketStore.chatRoom);
const isMobile = computed(() => appStore.isMobile);

const active = ref(false);

const onlineUsers = reactive<Api.Websocket.OnlineUserWithState[]>([]);

listen('listen:onlineUsers', (data: Api.Websocket.OnlineUserWithState[]) => {
  onlineUsers.splice(0, onlineUsers.length);
  data.forEach(user => {
    if (user.socketId === socketStore.currentUser.socketId) {
      user.current = true;
      user.privateShow = false;
      onlineUsers.unshift(user);
      socketStore.setCurrentUser(user);
      return;
    }
    onlineUsers.push({ ...user, show: false, privateShow: false });
  });

  mittBus.emit('listen:onlineUsers', onlineUsers);
  emitLogInfo({
    id: 'online_users',
    type: 'info',
    message: `当前在线人数: ${onlineUsers.length}`
  });
});

// 接收到私聊邀请
const privateChatInvitation = (target: privateChat) => {
  for (const user of onlineUsers) {
    if (user.socketId === target.fromId) {
      user.privateShow = true;
      break;
    }
  }
};
// 对方接受私聊邀请 (邀请方设置)
const partyAccepts = (target: privateChat) => {
  window.$message?.success(` ${target.fromName} 已同意私聊邀请`);
  socketStore.setIsPrivateChat(true);
  socketStore.setPrivateChatUser({
    socketId: target.fromId,
    socketName: target.fromName,
    introduction: target.message
  });
  socketStore.setChatRoom({
    roomId: target.fromId,
    roomName: target.roomName
  });
};
// 接受私聊邀请
const handleAgreePrivateChat = (user: Api.Websocket.OnlineUserWithState) => {
  user.privateShow = false;
  const target = {
    message: user.introduction, // 私聊打招呼
    targetId: user.socketId, // 邀请人
    targetName: user.socketName, // 邀请人
    fromId: currentUser.value.socketId, // 自己(接收者)
    fromName: currentUser.value.socketName, // 自己(接收者)
    roomId: user.socketId, // 聊天室id (将要加入的聊天室id)
    roomCurId: socketStore.chatRoom.roomId, // 当前房间
    roomName: `${`${socketStore.currentUser.socketName}和${user.socketName}`}的聊天室` // 聊天室名称
  };
  emit('agree_private_chat', target).then(() => {
    window.$message?.success(`已同意 ${user.socketName} 的私聊邀请`);
    partyAccepts({
      ...target,
      fromId: target.targetId,
      fromName: target.targetName
    });
  });
};

// 拒绝私聊邀请
const handlerefusePrivateChat = (target: Api.Websocket.OnlineUserWithState) => {
  for (const user of onlineUsers) {
    if (user.socketId === target.socketId) {
      user.privateShow = false;
      break;
    }
  }
};

const handlePrivateChat = (res: { success: boolean; user: Api.Websocket.OnlineUserWithState }) => {
  if (res.success) {
    handleAgreePrivateChat(res.user);
  } else {
    handlerefusePrivateChat(res.user);
  }
};

onMounted(() => {
  listen('listen:private_chat', privateChatInvitation);
  listen('listen:agree_private_chat', partyAccepts);
});
</script>

<template>
  <NLayout class="h-full" content-class="w-full flex flex-col">
    <NLayout has-sider class="flex-1" content-class="w-full h-full">
      <NLayoutSider v-if="!isMobile" :native-scrollbar="false" bordered content-class="pa-20px h-full" width="300">
        <OnlineUser :online-users="onlineUsers" @handle-private-chat="handlePrivateChat" />
      </NLayoutSider>
      <NLayout content-class="flex flex-col">
        <NLayoutHeader class="h-5rem flex items-center justify-center text-10 font-900" bordered>
          <NIcon v-if="isMobile" size="1.3rem" class="ml-2" @click="active = true"><icon-fa-solid:indent /></NIcon>
          <NText class="mx-a text-center">LocalSend</NText>
        </NLayoutHeader>

        <NLayoutContent class="flex-1 pa-0 text-xs">
          <ChatRoom
            :room-id="chatRoom.roomId"
            :room-name="chatRoom.roomName"
            :is-private-chat="isPrivateChat"
            :current-user="currentUser"
            :private-chat-users="privateChatUser"
          />
        </NLayoutContent>
      </NLayout>
    </NLayout>
    <NLayoutFooter bordered class="h-xs pa-20px" :class="{ 'lt-lg:h-12rem': isMobile }">
      <LogRecord />
    </NLayoutFooter>

    <NDrawer v-model:show="active" width="80%" placement="left" auto-focus>
      <NDrawerContent>
        <OnlineUser class="h-full" :online-users="onlineUsers" @handle-private-chat="handlePrivateChat" />
      </NDrawerContent>
    </NDrawer>
  </NLayout>
</template>

<style lang="scss" scoped></style>
