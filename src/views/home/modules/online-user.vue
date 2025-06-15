<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { NAvatar, NButton, NList, NListItem, NSpace, NTag, NText } from 'naive-ui';
import { useSocketStore } from '@/store/modules/socket';
import { useSocket } from '@/utils/useSocket';
import mittBus, { emitLogInfo } from '@/utils/mittBus';
import Avatar from '@/assets/imgs/soybean.jpg';

const { listen, emit, connected, reset } = useSocket();
const useWebSocket = useSocketStore();

const currentUser = computed(() => useWebSocket.currentUser);

const onlineUsers = reactive<Api.Websocket.OnlineUserWithState[]>([]);

listen('listen:onlineUsers', (data: Api.Websocket.OnlineUserWithState[]) => {
  onlineUsers.splice(0, onlineUsers.length);
  data.forEach(user => {
    if (user.socketId === useWebSocket.currentUser.socketId) {
      user.current = true;
      user.privateShow = false;
      onlineUsers.unshift(user);
      return;
    }
    onlineUsers.push({ ...user, show: false, privateShow: false });
    console.log('onlineUsers: ', onlineUsers);
  });

  mittBus.emit('listen:onlineUsers', onlineUsers);
  emitLogInfo({
    id: 'online_users',
    type: 'info',
    message: `当前在线人数: ${onlineUsers.length}`
  });
});

// 发起私聊
const handlePrivateChat = (user: Api.Websocket.OnlineUserWithState) => {
  user.show = false;
  window.$message?.success(`准备与 ${user.socketName} 私聊`);
  emit('private_chat', {
    targetId: user.socketId,
    targetName: user.socketName,
    fromId: currentUser.value.socketId,
    fromName: currentUser.value.socketName,
    message: '你好，我们可以聊聊吗？'
  });
};

// 接收到私聊邀请
const privateChatInvitation = (target: {
  message: string;
  targetId: string;
  targetName: string;
  fromId: string;
  fromName: string;
}) => {
  for (const user of onlineUsers) {
    if (user.socketId === target.fromId) {
      user.privateShow = true;
      break;
    }
  }
};

// 接受私聊邀请
const handleAgreePrivateChat = (user: Api.Websocket.OnlineUserWithState) => {
  user.privateShow = false;
  emit('agree_private_chat', {
    targetId: user.socketId,
    targetName: user.socketName,
    message: `${useWebSocket.currentUser.socketName}已同意私聊`
  }).then(() => {
    window.$message?.success(`已同意 ${user.socketName} 的私聊邀请`);
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

onMounted(() => {
  listen('listen:private_chat', privateChatInvitation);
});
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
        <NSpace align="center" justify="space-between" :wrap-item="false" inline>
          <NSpace align="center" :wrap-item="false" inline>
            <NAvatar size="medium" :src="Avatar" round />
            <NSpace vertical :size="4">
              <NSpace align="center" :size="8">
                <NText strong>{{ user.socketName }}</NText>
                <NTag size="small" type="info" round>bubble</NTag>
              </NSpace>
              <NText depth="3" size="small">{{ user.ip }}</NText>
            </NSpace>
          </NSpace>

          <NPopconfirm v-if="!user.current && !user.privateShow" v-model:show="user.show">
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
                <NButton type="error" size="small" ghost class="invitation-btn" @click="handlerefusePrivateChat(user)">
                  拒绝
                </NButton>
                <NButton type="primary" size="small" class="invitation-btn" @click="handleAgreePrivateChat(user)">
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
