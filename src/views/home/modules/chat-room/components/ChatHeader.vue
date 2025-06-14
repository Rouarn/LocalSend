<script setup lang="ts">
import { NSpace } from 'naive-ui';

defineProps<{
  roomName: string;
  isPrivateChat: boolean;
  onlineUsers: Api.Websocket.OnlineUser[];
  currentUser: Api.Websocket.OnlineUser;
}>();
</script>

<template>
  <div class="from-indigo-600 to-purple-600 bg-gradient-to-r p-3 text-white shadow-md">
    <NSpace align="center" justify="space-between" class="px-2">
      <NSpace align="center">
        <h2 class="m-0 flex items-center text-lg text-white font-semibold">
          <span class="mr-2">{{ roomName }}</span>
          <span v-if="isPrivateChat" class="rounded-full bg-white/20 px-2 py-0.5 text-xs">私聊</span>
        </h2>
      </NSpace>

      <NSpace align="center" :size="12">
        <span v-if="!isPrivateChat" class="text-sm text-white/90">{{ onlineUsers.length }}人在线</span>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-white/90">{{ currentUser.socketName }}</span>
          <icon-oui:online class="text-5 c-green/300 shadow-sm" />
        </div>
      </NSpace>
    </NSpace>
  </div>
</template>
