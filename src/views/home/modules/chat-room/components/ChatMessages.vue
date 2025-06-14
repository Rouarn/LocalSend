<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { NScrollbar } from 'naive-ui';
import MessageItem from './MessageItem.vue';

const props = defineProps<{
  messages: Api.Websocket.Message[];
  currentUser: Api.Websocket.OnlineUser;
  onlineUsers: Api.Websocket.OnlineUser[];
}>();

const messagesContainerRef = ref<HTMLDivElement>();
// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainerRef.value) {
      const container = document.querySelector('.Container .n-scrollbar-content');

      if (container) {
        messagesContainerRef.value.scrollTo({
          left: 0,
          top: container.scrollHeight,
          behavior: 'smooth'
        });
        return;
      }
      messagesContainerRef.value.scrollTo({
        left: 0,
        top: 99999999999,
        behavior: 'smooth'
      });
    }
  });
};

// 监听消息变化自动滚动到底部
watch(() => props.messages, scrollToBottom, { deep: true });

// 初始化时滚动到底部
onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <NScrollbar ref="messagesContainerRef" class="Container flex-1 bg-gray-50 p-4">
    <div class="mx-auto max-w-[90%]">
      <TransitionGroup name="message">
        <MessageItem
          v-for="(message, index) in messages"
          :key="message.id"
          :message="message"
          :index="index"
          :messages="messages"
          :current-user="currentUser"
          :online-users="onlineUsers"
        />
      </TransitionGroup>
    </div>
  </NScrollbar>
</template>

<style scoped>
/* 优化滚动条样式 */
:deep(.n-scrollbar-rail) {
  opacity: 0.3;
  &.n-scrollbar-rail--vertical {
    right: 2px;
  }
}

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
