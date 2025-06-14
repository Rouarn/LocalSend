<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useSocket } from '@/hooks/business/useSocket';
import mittBus from '@/utils/mittBus';
import ChatHeader from './components/ChatHeader.vue';
import ChatMessages from './components/ChatMessages.vue';
import ChatInput from './components/ChatInput.vue';
import { useChatMessages } from './composables/useChatMessages';
import { useFileHandling } from './composables/useFileHandling';
import { useChatFunctions } from './composables/useChatFunctions';

const props = defineProps<{
  roomId: string;
  roomName: string;
  isPrivateChat: boolean;
  currentUser: Api.Websocket.OnlineUser;
}>();

const { listen, emit } = useSocket();
const newMessage = ref('');

// 组合式函数
const { messages, onlineUsers, listeneMessage, setOnlineUsers } = useChatMessages(props, emit);
const { selectedFiles, fileInputRef, selectFiles, handleFileChange, removeFile, uploadFiles } = useFileHandling(
  props,
  messages,
  emit
);
const { showEmojiPopover, showMoreFunction, reset } = useChatFunctions();

// 发送消息
const sendMessage = () => {
  if (!newMessage.value.trim() && selectedFiles.value.length === 0) return;

  const message: Api.Websocket.Message = {
    id: Date.now().toString(),
    text: newMessage.value,
    roomId: props.roomId,
    senderId: props.currentUser.socketId,
    timestamp: new Date(),
    status: 'sending'
  };
  if (newMessage.value.trim()) {
    emit('message', message).then(() => {
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
  }

  if (selectedFiles.value.length > 0) {
    uploadFiles();
  }
};

// 初始化
onMounted(() => {
  mittBus.on('listen:onlineUsers', setOnlineUsers);
  listen('listen:message', listeneMessage);
});

onUnmounted(() => {
  mittBus.off('listen:onlineUsers');
});
</script>

<template>
  <div class="h-full flex flex-col from-gray-50 to-gray-100 bg-gradient-to-br">
    <ChatHeader
      :room-name="roomName"
      :is-private-chat="isPrivateChat"
      :online-users="onlineUsers"
      :current-user="currentUser"
    />

    <ChatMessages :messages="messages" :current-user="currentUser" :online-users="onlineUsers" />

    <ChatInput
      v-model:new-message="newMessage"
      :selected-files="selectedFiles"
      :show-emoji-popover="showEmojiPopover"
      :show-more-function="showMoreFunction"
      @toggle-more-function="showMoreFunction = !showMoreFunction"
      @toggle-emoji-popover="showEmojiPopover = !showEmojiPopover"
      @send-message="sendMessage"
      @select-files="selectFiles"
      @remove-file="removeFile"
      @upload-files="uploadFiles"
      @reset="reset"
    />

    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      multiple
      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.mp4,.mp3"
      @change="handleFileChange"
    />
  </div>
</template>
