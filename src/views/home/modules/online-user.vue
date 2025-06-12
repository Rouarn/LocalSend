<script setup lang="ts">
import { reactive } from 'vue';
import { NAvatar, NButton, NList, NListItem, NSpace, NTag, NText } from 'naive-ui';
import { useSocket } from '@/hooks/business/useSocket';
import Avatar from '@/assets/imgs/soybean.jpg';

const { listen, emit, connected, reset } = useSocket();

interface OnlineUser {
  socketId: number;
  userName: string;
  ip: string;
  show: boolean;
}

const onlineUsers = reactive<OnlineUser[]>([]);

listen('online_users', (data: OnlineUser[]) => {
  onlineUsers.splice(0, onlineUsers.length);
  data.forEach(user => {
    onlineUsers.push({
      ...user,
      show: false
    });
  });
});

const handlePrivateChat = (user: OnlineUser) => {
  user.show = false;
  window.$message?.success(`准备与 ${user.userName} 私聊`);
  emit('private_chat', {
    targetId: user.socketId,
    message: '你好，我们可以聊聊吗？'
  });
};
</script>

<template>
  <div class="container">
    <div class="header">
      <NTag :type="connected ? 'success' : 'error'" round>
        {{ connected ? '已连接' : '未连接' }}
      </NTag>
      <NButton v-if="!connected" type="primary" size="small" @click="reset">尝试重新连接</NButton>

      <NText depth="3">在线人数: {{ onlineUsers.length }}</NText>
    </div>

    <NList bordered class="list">
      <NListItem v-for="user in onlineUsers" :key="user.socketId">
        <NSpace align="center" justify="space-between" :wrap-item="false">
          <NSpace align="center" :wrap-item="false">
            <NAvatar size="medium" :src="Avatar" round />
            <NSpace vertical :size="4">
              <NSpace align="center" :size="8">
                <NText strong>{{ user.userName }}</NText>
                <NTag size="small" type="info" round>bubble</NTag>
              </NSpace>
              <NText depth="3" size="small">{{ user.ip }}</NText>
            </NSpace>
          </NSpace>
          <NPopconfirm v-model:show="user.show">
            <template #trigger>
              <NButton type="primary" size="small" ghost block>私聊</NButton>
            </template>
            <template #default>
              <NText>是否与 {{ user.userName }} 私聊？</NText>
            </template>
            <template #action>
              <NButton size="small" ghost @click="user.show = false">取消</NButton>
              <NButton type="primary" size="small" @click="handlePrivateChat(user)">确定</NButton>
            </template>
          </NPopconfirm>
        </NSpace>
      </NListItem>
    </NList>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list {
  border-radius: 8px;
}

.list :deep(.n-list-item) {
  padding: 12px 16px;
}
</style>
