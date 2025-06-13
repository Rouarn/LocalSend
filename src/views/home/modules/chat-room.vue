<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { NAvatar, NButton, NInput, NScrollbar, NSpace } from 'naive-ui';
import type { InputInst } from 'naive-ui';
import dayjs from 'dayjs';
import { useSocket } from '@/hooks/business/useSocket';
import mittBus from '@/utils/mittBus';

const { listen, emit } = useSocket();

const props = defineProps<{
  roomId: string;
  roomName: string;
  isPrivateChat: boolean;
  currentUser: Api.Websocket.OnlineUser;
}>();

const messages = ref<Api.Websocket.Message[]>([]);
const newMessage = ref('');
const onlineUsers = ref<Api.Websocket.OnlineUser[]>([]);
const showEmojiPopover = ref(false);
const messageInputRef = ref<InputInst | HTMLTextAreaElement | null>(null);
const messagesContainerRef = ref<HTMLElement | null>(null);

// 计算属性
const isCurrentUser = (userId: string) => userId === props.currentUser.socketId;

// 发送消息
const sendMessage = () => {
  if (!newMessage.value.trim()) return;

  const message: Api.Websocket.Message = {
    id: Date.now().toString(),
    text: newMessage.value,
    senderId: props.currentUser.socketId,
    timestamp: new Date(),
    status: 'sending'
  };

  emit('message', message).then(() => {
    // 模拟发送成功
    setTimeout(() => {
      const index = messages.value.findIndex(m => m.id === message.id);
      if (index !== -1) {
        messages.value[index].status = 'sent';
      }
    }, 1000);
  });

  messages.value.push(message);
  newMessage.value = '';
  showEmojiPopover.value = false;
  messageInputRef.value?.focus();
};

// 添加表情
const addEmoji = (emoji: string) => {
  newMessage.value += emoji;
  messageInputRef.value?.focus();
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainerRef.value) {
      const container = document.querySelector('.Container .n-scrollbar-content');
      if (container) {
        messagesContainerRef.value.scrollTo({ left: 0, top: container.scrollHeight, behavior: 'smooth' });
        return;
      }
      messagesContainerRef.value.scrollTo({ left: 0, top: 99999999999, behavior: 'smooth' });
    }
  });
};

// 获取发送者名称
const getSenderName = (senderId: string) => {
  if (senderId === props.currentUser.socketId) return '我';
  if (senderId === 'system') return '系统';
  const user = onlineUsers.value.find(u => u.socketId === senderId);
  return user ? user.socketName : '未知用户';
};

// 是否显示发送者信息
const shouldShowSender = (message: Api.Websocket.Message, index: number) => {
  if (message.senderId === props.currentUser.socketId) return false;
  if (index === 0) return true;
  return messages.value[index - 1].senderId !== message.senderId;
};

const getUserAvatar = (userId: string) => {
  if (userId === props.currentUser.socketId) return props.currentUser.avatar;
  const user = onlineUsers.value.find(u => u.socketId === userId);
  return user ? user.avatar : 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg';
};

// 判断是否显示时间（同一用户连续消息只显示最后一条的时间）
const shouldShowTime = (message: Api.Websocket.Message, index: number) => {
  // 如果是最后一条消息，总是显示时间
  if (index === messages.value.length - 1) return true;

  // 如果下一条消息的发送者不同，则显示时间
  if (messages.value[index + 1].senderId !== message.senderId) return true;

  return false;
};

const selectFiles = () => {};

// 监听消息变化
watch(messages, scrollToBottom, { deep: true });

// 表情符号分类列表
const emojiCategories = [
  {
    name: '表情',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '😂',
      '🤣',
      '😊',
      '😇',
      '🙂',
      '🙃',
      '😉',
      '😌',
      '😍',
      '🥰',
      '😘',
      '😗',
      '😙',
      '😚',
      '😋',
      '😛',
      '😝',
      '😜',
      '🤪'
    ]
  },
  {
    name: '手势',
    emojis: [
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '✌️',
      '🤟',
      '🤘',
      '👌',
      '🤏',
      '👈',
      '👉',
      '👆',
      '👇',
      '☝️',
      '✋',
      '🤚',
      '🖐'
    ]
  },
  {
    name: '物品',
    emojis: [
      '❤️',
      '💔',
      '💖',
      '💘',
      '💝',
      '💟',
      '☮️',
      '✝️',
      '☪️',
      '🕉',
      '☸️',
      '✡️',
      '🔯',
      '🕎',
      '☯️',
      '☦️',
      '🛐',
      '⛎',
      '♈',
      '♉',
      '♊',
      '♋',
      '♌',
      '♍',
      '♎'
    ]
  }
];

const activeEmojiCategory = ref(0);

const setOnlineUsers = (users: Api.Websocket.OnlineUser[]) => {
  onlineUsers.value.splice(0, onlineUsers.value.length);
  users.forEach(user => {
    onlineUsers.value.push(user);
  });
};

const listeneMessage = (data: Api.Websocket.Message) => {
  console.log('listeneMessage: ', data);
  if (data.senderId === props.currentUser.socketId) return;
  messages.value.push(data);
};

// 初始化
onMounted(() => {
  scrollToBottom();
  mittBus.on('listen:onlineUsers', setOnlineUsers);
  listen('listen:message', listeneMessage);
});

onUnmounted(() => {
  mittBus.off('listen:onlineUsers');
});
</script>

<template>
  <div class="h-full flex flex-col from-gray-50 to-gray-100 bg-gradient-to-br">
    <!-- 头部 - 优化样式 -->
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
            <NAvatar round :src="currentUser.avatar" size="small" class="border-2 border-white/30 shadow-sm" />
          </div>
        </NSpace>
      </NSpace>
    </div>

    <!-- 消息区域 - 优化背景和布局 -->
    <NScrollbar
      ref="messagesContainerRef"
      class="Container flex-1 bg-gray-50 p-4"
      @click.stop="showEmojiPopover = false"
    >
      <div class="mx-auto max-w-[90%]">
        <TransitionGroup name="message">
          <div
            v-for="(message, index) in messages"
            :key="message.id"
            class="mb-1"
            :class="{
              'mt-3': shouldShowSender(message, index)
            }"
          >
            <div class="flex" :class="[isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start']">
              <!-- 接收方头像 -->
              <div
                v-if="!isCurrentUser(message.senderId)"
                class="mr-2 flex-shrink-0"
                :class="{
                  invisible: !shouldShowSender(message, index)
                }"
              >
                <NAvatar
                  round
                  :src="getUserAvatar(message.senderId)"
                  size="small"
                  class="mt-1 border-2 border-white shadow"
                />
              </div>

              <!-- 消息主体 -->
              <div class="max-w-[80%] flex flex-col">
                <!-- 发送者名称 -->
                <div v-if="shouldShowSender(message, index)" class="mb-1 pl-1 text-xs text-gray-500 font-medium">
                  {{ getSenderName(message.senderId) }}
                </div>

                <!-- 消息气泡组 -->
                <div
                  class="flex flex-col"
                  :class="[
                    isCurrentUser(message.senderId) ? 'items-end' : 'items-start',
                    { '-mt-1': !shouldShowSender(message, index) }
                  ]"
                >
                  <!-- 消息气泡部分 -->
                  <div
                    class="rounded-[12px] px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                    :class="[
                      isCurrentUser(message.senderId)
                        ? 'bg-blue-500 text-white message-bubble-sender'
                        : 'bg-white text-gray-800 message-bubble-receiver',
                      {
                        'mt-1': !shouldShowSender(message, index)
                      }
                    ]"
                  >
                    <div class="break-words text-sm">{{ message.text }}</div>
                  </div>

                  <!-- 消息时间和状态 -->
                  <div
                    v-if="shouldShowTime(message, index)"
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
                  invisible: !shouldShowSender(message, index)
                }"
              >
                <NAvatar round :src="currentUser.avatar" size="small" class="mt-1 border-2 border-white shadow" />
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </NScrollbar>

    <!-- 输入区域 - 优化样式 -->
    <div class="border-t border-gray-200/50 bg-white/90 pb-2 shadow-inner backdrop-blur-sm">
      <!-- 表情面板 -->
      <div
        v-if="showEmojiPopover"
        class="h-48 overflow-y-auto border-t border-gray-200/50 bg-white/95 p-2 shadow-inner"
      >
        <div class="sticky top-0 flex border-b border-gray-100 bg-white">
          <button
            v-for="(category, index) in emojiCategories"
            :key="category.name"
            class="px-4 py-2 text-sm transition-colors"
            :class="[
              activeEmojiCategory === index
                ? 'text-blue-500 border-b-2 border-blue-500 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            ]"
            @click="activeEmojiCategory = index"
          >
            {{ category.name }}
          </button>
        </div>
        <div class="grid grid-cols-8 gap-1 p-2">
          <button
            v-for="emoji in emojiCategories[activeEmojiCategory].emojis"
            :key="emoji"
            class="rounded p-1 text-center text-xl transition-colors hover:scale-110 hover:bg-gray-100"
            @click="addEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <!-- 输入工具栏 -->
      <div class="flex items-center px-3 py-2">
        <NButton
          text
          class="rounded-full p-2 text-gray-500 hover:bg-gray-100/50"
          @click="showEmojiPopover = !showEmojiPopover"
        >
          <icon-ic:baseline-emoji-emotions size="24" />
        </NButton>

        <NButton text class="ml-1 rounded-full p-2 text-gray-500 hover:bg-gray-100/50" @click="selectFiles">
          <icon-ic:baseline-attach-file size="24" />
        </NButton>

        <div class="mx-2 flex-1">
          <NInput
            ref="messageInputRef"
            v-model:value="newMessage"
            autofocus
            clearable
            show-count
            round
            type="textarea"
            placeholder="输入消息..."
            :autosize="{
              minRows: 1,
              maxRows: 4
            }"
            class="rounded-full bg-gray-100/70 px-4 shadow-inner transition-all focus:bg-white hover:bg-gray-50"
            @keydown.enter.exact.prevent="sendMessage"
          />
        </div>

        <NButton
          type="primary"
          circle
          :disabled="!newMessage.trim()"
          class="ml-1 h-10 w-10 from-indigo-500 to-purple-500 bg-gradient-to-r shadow-md hover:from-indigo-600 hover:to-purple-600"
          @click="sendMessage"
        >
          <icon-ic:baseline-send class="text-white" />
        </NButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 优化滚动条样式 */
:deep(.n-scrollbar-rail) {
  opacity: 0.3;
  &.n-scrollbar-rail--vertical {
    right: 2px;
  }
}

/* 输入框优化 */
:deep(.n-input) {
  textarea {
    border-radius: 18px !important;
    resize: none;
    line-height: 1.5;
    box-shadow: none !important;
    transition: all 0.2s ease;

    &:focus {
      background: white !important;
      box-shadow: none !important;
    }
  }
}

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

/* 消息气泡动画 */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}
.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
