<script setup lang="ts">
import { NButton, NInput } from 'naive-ui';
import EmojiPicker from './EmojiPicker.vue';
import MoreFunctions from './MoreFunctions.vue';
import SelectedFiles from './SelectedFiles.vue';

defineProps<{
  newMessage: string;
  selectedFiles: any[];
  showEmojiPopover: boolean;
  showMoreFunction: boolean;
}>();

interface Emits {
  (e: 'update:newMessage', value: string): void;
  (e: 'sendMessage'): void;
  (e: 'selectFiles'): void;
  (e: 'removeFile', file: any): void;
  (e: 'uploadFiles'): void;
  (e: 'reset'): void;
  (e: 'toggleMoreFunction'): void;
  (e: 'toggleEmojiPopover'): void;
  (e: 'startVideoCall'): void;
  (e: 'startVoiceCall'): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
  <div class="border-t border-gray-200/50 bg-white/90 pb-2 shadow-inner backdrop-blur-sm">
    <TransitionGroup name="more-function">
      <EmojiPicker
        v-if="showEmojiPopover"
        @add-emoji="emoji => emit('update:newMessage', newMessage + emoji)"
        @close="emit('reset')"
      />
    </TransitionGroup>

    <TransitionGroup name="more-function">
      <MoreFunctions
        v-if="showMoreFunction"
        @start-video-call="emit('startVideoCall')"
        @start-voice-call="emit('startVoiceCall')"
        @show-settings="emit('reset')"
      />
    </TransitionGroup>

    <!-- 输入工具栏 -->
    <div class="flex items-center px-3 py-2">
      <NButton text class="mr-2" @click="emit('toggleMoreFunction')">
        <icon-weui:more2-outlined size="24" />
      </NButton>

      <NButton text class="rounded-full p-2 text-gray-500 hover:bg-gray-100/50" @click="emit('toggleEmojiPopover')">
        <icon-ic:outline-emoji-emotions size="24" />
      </NButton>

      <NButton text class="ml-1 rounded-full p-2 text-gray-500 hover:bg-gray-100/50" @click="emit('selectFiles')">
        <icon-ic:baseline-attach-file size="24" />
      </NButton>

      <div class="mx-2 flex-1">
        <NInput
          :value="newMessage"
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
          @update:value="val => emit('update:newMessage', val)"
          @keydown.enter.exact.prevent="emit('sendMessage')"
        />
      </div>

      <NButton
        type="primary"
        circle
        :disabled="!newMessage.trim() && selectedFiles.length === 0"
        class="ml-1 h-10 w-10 from-indigo-500 to-purple-500 bg-gradient-to-r shadow-md hover:from-indigo-600 hover:to-purple-600"
        @click="emit('sendMessage')"
      >
        <icon-ic:baseline-send class="text-white" />
      </NButton>
    </div>

    <SelectedFiles
      v-if="selectedFiles.length > 0"
      :files="selectedFiles"
      @remove-file="emit('removeFile', $event)"
      @upload-files="emit('uploadFiles')"
    />
  </div>
</template>

<style scoped>
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

.more-function-enter-active,
.more-function-leave-active {
  transition: all 0.2s ease;
}
.more-function-enter-from,
.more-function-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
