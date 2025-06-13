<script setup lang="ts">
import { useSocketStore } from '@/store/modules/socket';
import OnlineUser from '@/views/home/modules/online-user.vue';
import ChatRoom from './modules/chat-room.vue';
import LogRecord from './modules/log-record.vue';

const socketStore = useSocketStore();
</script>

<template>
  <NLayout class="h-full" content-class="w-full flex flex-col">
    <NLayout has-sider class="flex-1" content-class="w-full h-full">
      <NLayoutSider :native-scrollbar="false" bordered content-class="w[calc(100%-40px)] pa-20px h-full">
        <OnlineUser />
      </NLayoutSider>
      <NLayout content-class="flex flex-col">
        <NLayoutHeader class="h-5rem flex items-center justify-center text-10 font-900" bordered>
          LocalSend
        </NLayoutHeader>

        <NLayoutContent class="flex-1 pa-0 text-xs">
          <ChatRoom
            room-id="PUBLIC_ROOM"
            room-name="Public Room"
            :is-private-chat="false"
            :current-user="socketStore.socket"
          />
        </NLayoutContent>
      </NLayout>
    </NLayout>
    <NLayoutFooter bordered class="h-xs pa-20px lt-lg:h-8rem">
      <LogRecord />
    </NLayoutFooter>
  </NLayout>
</template>

<style lang="scss" scoped></style>
