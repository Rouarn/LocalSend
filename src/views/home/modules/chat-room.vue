<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { NAvatar, NButton, NInput, NScrollbar, NSpace } from 'naive-ui';
import type { InputInst } from 'naive-ui';
import mittBus from '@/utils/mittBus';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
}

const props = defineProps<{
  roomId: string;
  roomName: string;
  isPrivateChat: boolean;
  currentUser: Api.Websocket.OnlineUser;
}>();

const messages = ref<Message[]>([]);
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

  const message: Message = {
    id: Date.now().toString(),
    text: newMessage.value,
    senderId: props.currentUser.socketId,
    timestamp: new Date(),
    status: 'sending'
  };

  messages.value.push(message);
  newMessage.value = '';
  showEmojiPopover.value = false;

  // 模拟发送成功
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === message.id);
    if (index !== -1) {
      messages.value[index].status = 'sent';
    }
  }, 1000);
};

// 添加表情
const addEmoji = (emoji: string) => {
  newMessage.value += emoji;
  messageInputRef.value?.focus();
};

// 滚动到底部
const scrollToBottom = () => {
  console.log(111);
  console.dir(messagesContainerRef.value);
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

// 格式化时间
const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 是否显示发送者信息
const shouldShowSender = (message: Message, index: number) => {
  if (message.senderId === props.currentUser.socketId) return false;
  if (index === 0) return true;
  return messages.value[index - 1].senderId !== message.senderId;
};

const getUserAvatar = (userId: string) => {
  if (userId === props.currentUser.socketId) return props.currentUser.avatar;
  const user = onlineUsers.value.find(u => u.socketId === userId);
  return user ? user.avatar : 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg';
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

mittBus.on('listen:onlineUsers', (users: Api.Websocket.OnlineUser[]) => {
  onlineUsers.value.splice(0, onlineUsers.value.length);
  users.forEach(user => {
    onlineUsers.value.push(user);
  });
  console.log(onlineUsers.value, 'onlineUsers');
});

// 初始化
onMounted(() => {
  scrollToBottom();
});

onUnmounted(() => {
  mittBus.off('listen:onlineUsers');
});
</script>

<template>
  <div class="h-full flex flex-col bg-[#f5f5f5]">
    <!-- 头部 - 优化样式 -->
    <div class="bg-[#2e2e2e] p-3 text-white shadow-sm">
      <NSpace align="center" justify="space-between" class="px-2">
        <NSpace align="center">
          <h2 class="m-0 text-lg text-white font-semibold">{{ roomName }}</h2>
          <span v-if="isPrivateChat" class="rounded-full bg-[#3a3a3a] px-2 py-0.5 text-xs text-gray-300">私聊</span>
        </NSpace>

        <NSpace align="center" :size="12">
          <span v-if="!isPrivateChat" class="text-xs text-gray-300">{{ onlineUsers.length }}人在线</span>
          <div class="flex items-center">
            <span class="mr-2 text-sm">{{ currentUser.socketName }}</span>
            <NAvatar round :src="currentUser.avatar" size="small" class="border border-white/20" />
          </div>
        </NSpace>
      </NSpace>
    </div>

    <!-- 消息区域 - 优化背景和布局 -->
    <NScrollbar
      ref="messagesContainerRef"
      class="Container flex-1 bg-[#e5e5e5] p-4"
      @click.stop="showEmojiPopover = false"
    >
      <div class="mx-auto max-w-[90%]">
        <div v-for="(message, index) in messages" :key="message.id" class="mb-4">
          <div class="flex" :class="[isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start']">
            <!-- 接收方头像 -->
            <NAvatar
              v-if="!isCurrentUser(message.senderId) && shouldShowSender(message, index)"
              round
              :src="getUserAvatar(message.senderId)"
              size="small"
              class="mr-2 mt-1 self-start"
            />

            <div
              class="max-w-[80%] flex flex-col"
              :class="[isCurrentUser(message.senderId) ? 'items-end' : 'items-start']"
            >
              <!-- 发送者名称 -->
              <div
                v-if="shouldShowSender(message, index)"
                class="mb-1 text-xs font-medium"
                :class="[isCurrentUser(message.senderId) ? 'text-gray-600' : 'text-gray-600']"
              >
                {{ getSenderName(message.senderId) }}
              </div>

              <!-- 消息气泡 -->
              <div
                class="rounded-lg px-4 py-2 shadow-sm"
                :class="[
                  isCurrentUser(message.senderId)
                    ? 'bg-[#95ec69] text-black rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                ]"
              >
                <div class="break-words text-sm">{{ message.text }}</div>
              </div>

              <!-- 消息时间和状态 -->
              <div
                class="mt-1 flex items-center text-xs"
                :class="[isCurrentUser(message.senderId) ? 'flex-row-reverse' : '']"
              >
                <span class="mx-1 text-gray-500">
                  {{ formatTime(message.timestamp) }}
                </span>
                <span
                  v-if="isCurrentUser(message.senderId)"
                  class="text-xs"
                  :class="[
                    message.status === 'sending'
                      ? 'text-gray-400'
                      : message.status === 'failed'
                        ? 'text-red-400'
                        : 'text-blue-400'
                  ]"
                >
                  {{ message.status === 'sending' ? '...' : message.status === 'failed' ? '发送失败' : '✓' }}
                </span>
              </div>
            </div>

            <!-- 发送方头像 -->
            <NAvatar
              v-if="isCurrentUser(message.senderId) && shouldShowSender(message, index)"
              round
              :src="currentUser.avatar"
              size="small"
              class="order-1 ml-2 mt-1 self-start"
            />
          </div>
        </div>
      </div>
    </NScrollbar>

    <!-- 输入区域 - 优化样式 -->
    <div class="border-t border-gray-200 bg-white pb-2 shadow-sm">
      <!-- 表情面板 -->
      <div v-if="showEmojiPopover" class="h-48 overflow-y-auto border-t border-gray-200 bg-white p-2 shadow-inner">
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
      <div class="flex items-center px-3 py-1">
        <NButton
          text
          class="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          @click="showEmojiPopover = !showEmojiPopover"
        >
          <icon-ic:baseline-emoji-emotions size="24" />
        </NButton>

        <NButton text class="ml-1 rounded-full p-2 text-gray-500 hover:bg-gray-100" @click="selectFiles">
          <icon-ic:baseline-attach-file size="24" />
        </NButton>

        <div class="mx-2 flex-1">
          <NInput
            ref="messageInputRef"
            v-model:value="newMessage"
            type="textarea"
            placeholder="输入消息..."
            :autosize="{
              minRows: 1,
              maxRows: 4
            }"
            class="rounded-full bg-gray-100 px-4 transition-all focus:bg-white hover:bg-gray-50"
            @keydown.enter.exact.prevent="sendMessage"
          />
        </div>

        <NButton
          type="primary"
          circle
          :disabled="!newMessage.trim()"
          class="ml-1 h-10 w-10 bg-[#07c160] hover:bg-[#06ad56]"
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
      box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1) !important;
    }
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

:deep(.n-input textarea) {
  &:focus {
    box-shadow: none !important;
  }
}
</style>
