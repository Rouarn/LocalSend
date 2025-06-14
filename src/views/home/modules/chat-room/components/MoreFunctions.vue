<script setup lang="ts">
const emit = defineEmits<{
  (e: 'startVideoCall'): void;
  (e: 'startVoiceCall'): void;
  (e: 'showSettings'): void;
}>();

// 如果需要绑定点击事件，可显式调用 emit，例如：
// @click="emit('startVideoCall')"
</script>

<template>
  <div
    class="absolute bottom-[80px] left-4 z-10 w-64 overflow-hidden border border-gray-200 rounded-lg bg-white shadow-lg"
  >
    <div class="divide-y divide-gray-100">
      <!-- 功能分组1：通讯 -->
      <div class="p-2">
        <h3 class="px-2 py-1 text-xs text-gray-500 font-medium">通讯功能</h3>
        <div class="space-y-1">
          <button
            class="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
            @click="emit('startVideoCall')"
          >
            <icon-material-symbols:auto-videocam-sharp class="h-5 w-5 text-blue-500" />
            <span>视频通话</span>
            <span class="ml-auto text-xs text-gray-400">Beta</span>
          </button>
          <button
            class="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
            @click="emit('startVoiceCall')"
          >
            <icon-material-symbols:call-outline-rounded class="h-5 w-5 text-green-500" />
            <span>语音通话</span>
          </button>
        </div>
      </div>

      <!-- 功能分组2：未来扩展区域 -->
      <div class="p-2">
        <h3 class="px-2 py-1 text-xs text-gray-500 font-medium">其他功能</h3>
        <div class="space-y-1">
          <!-- 预留扩展位置 -->
        </div>
      </div>

      <!-- 功能分组3：设置 -->
      <div class="p-2">
        <button
          class="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          @click="emit('showSettings')"
        >
          <icon-material-symbols:settings-outline class="h-5 w-5 text-gray-500" />
          <span>聊天设置</span>
        </button>
      </div>
    </div>
  </div>
</template>
