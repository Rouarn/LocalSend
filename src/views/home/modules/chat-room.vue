<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
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
console.log(props, 'props');

const messages = ref<Message[]>([]);
const newMessage = ref('');
const onlineUsers = ref<Api.Websocket.OnlineUser[]>([]);
const showEmojiPopover = ref(false);
const messageInputRef = ref<InputInst | HTMLTextAreaElement | null>(null);

const messagesContainerRef = ref<HTMLElement | null>(null);

// 计算属性
const isCurrentUser = (userId: string) => userId === props.currentUser.socketId;

// 初始化模拟数据
// const initMockData = () => {
//   messages.value = [
//     {
//       id: '1',
//       text: '你好！欢迎加入聊天室！',
//       senderId: 'system',
//       timestamp: new Date(Date.now() - 3600000)
//     },
//     {
//       id: '2',
//       text: '大家好！很高兴见到你们！',
//       senderId: props.currentUser.socketId,
//       timestamp: new Date(Date.now() - 1800000)
//     },
//     {
//       id: '3',
//       text: '你们今天有什么计划吗？',
//       senderId: 'user2',
//       timestamp: new Date(Date.now() - 900000)
//     }
//   ];

//   onlineUsers.value = [
//     props.currentUser,
//     {
//       socketId: 'user2',
//       name: '张三',
//       avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
//       online: true
//     },
//     {
//       socketId: 'user3',
//       name: '李四',
//       avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
//       online: true
//     }
//   ];
// };

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
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
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

const selectFiles = () => {
  console.log('selectFiles');
};

// 初始化
onMounted(() => {
  scrollToBottom();
});

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

mittBus.on('online_users', (users: Api.Websocket.OnlineUser[]) => {
  console.log('users: ', users);
  onlineUsers.value.splice(0, onlineUsers.value.length);
  users.forEach(user => {
    onlineUsers.value.push(user);
  });
});
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- 头部 - 调整为微信风格 -->
    <div class="bg-[#2e2e2e] p-3 text-white">
      <NSpace align="center" justify="space-between">
        <NSpace align="center">
          <h2 class="m-0 text-lg font-semibold">{{ roomName }}</h2>
          <span v-if="isPrivateChat" class="rounded bg-[#3a3a3a] px-1.5 py-0.5 text-xs text-gray-300">私聊</span>
        </NSpace>

        <NSpace align="center">
          <span v-if="!isPrivateChat" class="text-xs text-gray-300">{{ onlineUsers.length }}人在线</span>
          <NAvatar
            round
            :src="currentUser.avatar"
            fallback-src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
            size="small"
          />
        </NSpace>
      </NSpace>
    </div>

    <!-- 消息区域 - 背景调整为微信风格 -->
    <NScrollbar ref="messagesContainerRef" class="flex-1 bg-[#ededed] p-4" @click.stop="showEmojiPopover = false">
      <div v-for="(message, index) in messages" :key="message.id" class="mb-3">
        <div class="flex" :class="[isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start']">
          <NAvatar
            v-if="!isCurrentUser(message.senderId) && shouldShowSender(message, index)"
            round
            :src="getUserAvatar(message.senderId)"
            fallback-src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
            size="small"
            class="mr-2 mt-1 self-start"
          />

          <NSpace vertical :size="0">
            <div class="flex flex-col">
              <div v-if="shouldShowSender(message, index)" class="mb-1 text-xs text-gray-600 font-medium">
                {{ getSenderName(message.senderId) }}
              </div>

              <div
                class="rounded-lg px-3 py-2 shadow"
                :class="[
                  isCurrentUser(message.senderId)
                    ? 'bg-[#95ec69] text-black rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
                ]"
              >
                <div class="break-words">{{ message.text }}</div>
              </div>
            </div>
            <div
              class="mt-1 flex items-center text-xs"
              :class="[isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start']"
            >
              <span class="text-gray-500" :class="[isCurrentUser(message.senderId) ? 'order-last ml-1' : 'mr-1']">
                {{ formatTime(message.timestamp) }}
              </span>
              <span
                v-if="isCurrentUser(message.senderId)"
                :class="[
                  message.status === 'sending'
                    ? 'text-gray-400'
                    : message.status === 'failed'
                      ? 'text-red-400'
                      : 'text-blue-400'
                ]"
              >
                {{ message.status === 'sending' ? '...' : message.status === 'failed' ? '!' : '✓' }}
              </span>
            </div>
          </NSpace>
        </div>
      </div>
    </NScrollbar>

    <!-- 微信风格输入区域 -->
    <div class="border-t border-gray-200 bg-[#f5f5f5]">
      <!-- 表情面板 -->
      <div v-if="showEmojiPopover" class="h-48 overflow-y-auto border-t border-gray-200 bg-white p-2">
        <div class="sticky top-0 flex border-b border-gray-100 bg-white">
          <button
            v-for="(category, index) in emojiCategories"
            :key="category.name"
            class="px-4 py-2 text-sm"
            :class="[activeEmojiCategory === index ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500']"
            @click="activeEmojiCategory = index"
          >
            {{ category.name }}
          </button>
        </div>
        <div class="grid grid-cols-8 gap-1 p-2">
          <button
            v-for="emoji in emojiCategories[activeEmojiCategory].emojis"
            :key="emoji"
            class="rounded p-1 text-center text-xl hover:bg-gray-100"
            @click="addEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <!-- 输入工具栏 -->
      <div class="flex items-center p-2">
        <NButton
          text
          class="rounded-full p-2 text-gray-500 hover:bg-gray-200"
          @click="showEmojiPopover = !showEmojiPopover"
        >
          <icon-ic:baseline-add-circle size="24" />
        </NButton>

        <NButton text class="ml-1 rounded-full p-2 text-gray-500 hover:bg-gray-200" @click="selectFiles">
          <NIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </NIcon>
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
            class="rounded-full bg-white px-4"
            @keydown.enter.exact.prevent="sendMessage"
          />
        </div>

        <NButton
          type="primary"
          circle
          :disabled="!newMessage.trim()"
          class="bg-[#07c160] hover:bg-[#06ad56]"
          @click="sendMessage"
        >
          <NIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </NIcon>
        </NButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 微调滚动条样式 */
:deep(.n-scrollbar-rail) {
  opacity: 0.3;
}

/* 输入框圆角调整 */
:deep(.n-input) {
  textarea {
    border-radius: 18px !important;
    resize: none;
    line-height: 1.5;
    box-shadow: none !important;
  }
}
</style>
