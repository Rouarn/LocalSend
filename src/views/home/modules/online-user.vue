<script setup lang="ts">
import { computed } from 'vue';
import { NAvatar, NButton, NList, NListItem, NSpace, NTag, NText } from 'naive-ui';
import { useSocketStore } from '@/store/modules/socket';
import { useSocket } from '@/utils/useSocket';
import Avatar from '@/assets/imgs/soybean.jpg';

defineProps<{
  onlineUsers: Api.Websocket.OnlineUserWithState[];
}>();

const emit = defineEmits<{
  (e: 'handlePrivateChat', payload: { success: boolean; user: Api.Websocket.OnlineUserWithState }): void;
}>();

const { emit: wsEmit, connected, reset } = useSocket();
const socketStore = useSocketStore();

const currentUser = computed(() => socketStore.currentUser);

// 发起私聊
const handlePrivateChat = (user: Api.Websocket.OnlineUserWithState) => {
  user.show = false;
  window.$message?.success(`准备与 ${user.socketName} 私聊`);
  wsEmit('private_chat', {
    targetId: user.socketId,
    targetName: user.socketName,
    fromId: currentUser.value.socketId,
    fromName: currentUser.value.socketName,
    roomId: socketStore.currentUser.socketId,
    roomCurId: socketStore.chatRoom.roomId,
    roomName: `${`${socketStore.currentUser.socketName}和${user.socketName}`}的聊天室`,
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

      <NText depth="3">在线人数: {{ onlineUsers.length }}</NText>
    </div>
    <NButton v-if="!connected" type="primary" size="small" @click="reset">尝试重新连接</NButton>

    <NList class="list" clickable hoverable bordered show-divider>
      <NListItem v-for="user in onlineUsers" :key="user.socketId" class="relative">
        <NSpace align="center" justify="space-between" :wrap-item="false" inline class="w-full">
          <NSpace align="center" :wrap-item="false" inline>
            <NAvatar size="medium" :src="Avatar" round />
            <NSpace vertical :size="4">
              <NSpace align="center" :size="8">
                <NText strong>{{ user.socketName }}</NText>
                <NTag size="small" type="info" round>bubble</NTag>
              </NSpace>
              <NText depth="3" size="small">《{{ user.introduction }}》</NText>
            </NSpace>
          </NSpace>

          <NPopconfirm v-if="!user.current" v-model:show="user.show" class="w-full">
            <template #trigger>
              <NButton type="primary" size="small" ghost block>私聊</NButton>
            </template>
            <NText>是否与 {{ user.socketName }} 私聊？</NText>
            <template #action>
              <NButton size="small" ghost @click="user.show = false">取消</NButton>
              <NButton type="primary" size="small" @click="handlePrivateChat(user)">确定</NButton>
            </template>
          </NPopconfirm>

          <!-- 接收到私聊邀请 -->
          <div v-if="user.privateShow" class="invitation-container">
            <div class="invitation-content">
              <NText class="invitation-text">{{ user.socketName }} 邀请你私聊</NText>
              <NSpace justify="end" class="invitation-actions">
                <NButton
                  type="error"
                  size="small"
                  ghost
                  class="invitation-btn"
                  @click="emit('handlePrivateChat', { success: false, user })"
                >
                  拒绝
                </NButton>
                <NButton
                  type="primary"
                  size="small"
                  class="invitation-btn"
                  @click="emit('handlePrivateChat', { success: true, user })"
                >
                  同意
                </NButton>
              </NSpace>
            </div>
          </div>
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

.invitation-container {
  position: absolute;
  right: 16px;
  background: var(--n-color-modal);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border: 1px solid var(--n-color-border);
}

.invitation-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.invitation-text {
  font-size: 14px;
  color: var(--n-text-color);
}

.invitation-actions {
  margin-top: 4px;
}

.invitation-btn {
  padding: 0 12px;
  height: 28px;
}
</style>
