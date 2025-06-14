<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'addEmoji', emoji: string): void;
}>();

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
      'التز',
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
</script>

<template>
  <div class="h-48 overflow-y-auto border-t border-gray-200/50 bg-white/95 p-2 shadow-inner">
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
        @click="emit('addEmoji', emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>
