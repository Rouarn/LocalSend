<script setup lang="ts">
import { computed } from 'vue';
import { useSocketStore } from '@/store/modules/socket';
import OnlineUser from './modules/online-user.vue';
import ChatRoom from './modules/chat-room/chat-room.vue';
import LogRecord from './modules/log-record.vue';

const socketStore = useSocketStore();

const currentUser = computed(() => socketStore.currentUser);
const privateChatUser = computed(() => socketStore.privateChatUser);
const isPrivateChat = computed(() => socketStore.isPrivateChat);
const chatRoom = computed(() => socketStore.chatRoom);
</script>

<template>
  <NLayout class="h-full" content-class="w-full flex flex-col">
    <NLayout has-sider class="flex-1" content-class="w-full h-full">
      <NLayoutSider :native-scrollbar="false" bordered content-class="pa-20px h-full" width="300">
        <OnlineUser />
      </NLayoutSider>
      <NLayout content-class="flex flex-col">
        <NLayoutHeader class="h-5rem flex items-center justify-center text-10 font-900" bordered>
          LocalSend
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
    <NLayoutFooter bordered class="h-xs pa-20px">
      <LogRecord />
    </NLayoutFooter>
  </NLayout>
</template>

<style lang="scss" scoped></style>
