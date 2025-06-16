<script setup lang="ts">
import { NAvatar } from 'naive-ui';
import dayjs from 'dayjs';
import defaultAvatarUrl from '@/assets/imgs/soybean.jpg?url';
import FilePreview from './FilePreview.vue';

const props = defineProps<{
  message: Api.Websocket.Message;
  index: number;
  messages: Api.Websocket.Message[];
  currentUser: Api.Websocket.OnlineUser;
  onlineUsers: Api.Websocket.OnlineUser[];
}>();

const isCurrentUser = (userId: string) => userId === props.currentUser.socketId;

const getSenderName = (senderId: string) => {
  if (senderId === props.currentUser.socketId) return '我';
  if (senderId === 'System-Notification') return '系统通知';
  const user = props.onlineUsers.find(u => u.socketId === senderId);
  return user ? user.socketName : '未知用户';
};

const getUserAvatar = (userId: string) => {
  if (userId === props.currentUser.socketId) return props.currentUser.avatar;
  const user = props.onlineUsers.find(u => u.socketId === userId);
  return user ? user.avatar : defaultAvatarUrl;
};

const shouldShowSender = () => {
  if (props.message.senderId === props.currentUser.socketId) return false;
  if (props.index === 0) return true;
  return props.messages[props.index - 1].senderId !== props.message.senderId;
};

const shouldShowTime = () => {
  if (props.index === props.messages.length - 1) return true;
  if (props.messages[props.index + 1].senderId !== props.message.senderId) return true;
  return false;
};
</script>

<template>
  <div
    class="mb-1"
    :class="{
      'mt-3': shouldShowSender()
    }"
  >
    <div class="flex" :class="[isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start']">
      <!-- 接收方头像 -->
      <div
        v-if="!isCurrentUser(message.senderId)"
        class="mr-2 flex-shrink-0"
        :class="{
          invisible: !shouldShowSender()
        }"
      >
        <NAvatar round :src="getUserAvatar(message.senderId)" size="small" class="mt-1 border-2 border-white shadow" />
      </div>

      <!-- 消息主体 -->
      <div class="max-w-[80%] flex flex-col">
        <!-- 发送者名称 -->
        <div v-if="shouldShowSender()" class="mb-1 pl-1 text-xs text-gray-500 font-medium">
          {{ getSenderName(message.senderId) }}
        </div>

        <!-- 消息气泡组 -->
        <div
          class="flex flex-col"
          :class="[isCurrentUser(message.senderId) ? 'items-end' : 'items-start', { '-mt-1': !shouldShowSender() }]"
        >
          <!-- 消息气泡部分 -->
          <div
            class="rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            :class="[
              isCurrentUser(message.senderId)
                ? 'bg-blue-500 text-white message-bubble-sender'
                : 'bg-white text-gray-800 message-bubble-receiver',
              {
                'mt-1': !shouldShowSender()
              }
            ]"
          >
            <div class="break-words text-sm">{{ message.text }}</div>

            <FilePreview v-if="message?.file" :file="message.file" class="mt-2" />
          </div>

          <!-- 消息时间和状态 -->
          <div
            v-if="shouldShowTime()"
            class="mt-1 flex items-center text-xs text-gray-400"
            :class="[isCurrentUser(message.senderId) ? 'flex-row-reverse' : '']"
          >
            <span>{{ dayjs(message.timestamp).format('HH:mm') }}</span>
            <span
              v-if="isCurrentUser(message.senderId)"
              class="ml-1"
              :class="[
                message.status === 'sending'
                  ? 'text-gray-400'
                  : message.status === 'failed'
                    ? 'text-red-400'
                    : 'text-blue-400'
              ]"
            >
              {{ message.status === 'sending' ? '...' : message.status === 'failed' ? '✕' : '✓' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 发送方头像 -->
      <div
        v-if="isCurrentUser(message.senderId)"
        class="ml-2 flex-shrink-0"
        :class="{
          invisible: !shouldShowSender()
        }"
      >
        <NAvatar round :src="currentUser.avatar" size="small" class="mt-1 border-2 border-white shadow" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 消息气泡基础样式 */
.message-bubble-sender,
.message-bubble-receiver {
  position: relative;
  transition: all 0.2s ease;
  max-width: 100%;

  &::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    bottom: 0;
  }
}

/* 发送方气泡样式 */
.message-bubble-sender {
  border-radius: 12px 12px 0 12px;
  margin-left: 20px;

  &::after {
    right: -12px;
    background: radial-gradient(circle at 100% 0, transparent 70%, theme('colors.blue.500') 70%);
  }

  &:not(:first-child) {
    border-top-right-radius: 4px;
  }
}

/* 接收方气泡样式 */
.message-bubble-receiver {
  border-radius: 12px 12px 12px 0;
  margin-right: 20px;

  &::after {
    left: -12px;
    background: radial-gradient(circle at 0 0, transparent 70%, white 70%);
  }

  &:not(:first-child) {
    border-top-left-radius: 4px;
  }
}
</style>
