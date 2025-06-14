<script setup lang="ts">
import { NImage } from 'naive-ui';

defineProps<{
  file: Api.Websocket.File;
}>();
</script>

<template>
  <div
    class="inline-block overflow-hidden border border-gray-200 rounded-lg bg-gray-50 shadow-sm transition-all hover:shadow-md"
    :class="{
      'max-w-[300px]': file.type?.startsWith('image'),
      'max-h-[250px]': !file.type?.startsWith('image')
    }"
  >
    <!-- 图片预览 -->
    <template v-if="file.type?.startsWith('image') && file.url">
      <NImage
        :src="file.url"
        :alt="file.name || '图片'"
        class="block cursor-pointer"
        :img-props="{
          class: 'max-h-[200px] w-auto object-cover'
        }"
        :preview-disabled="false"
      />
      <div class="p-2 text-xs text-gray-600">
        <div class="truncate font-medium">{{ file.name || '未命名图片' }}</div>
        <div v-if="file.size" class="flex items-center justify-between text-gray-500">
          <span>{{ (file.size / 1024).toFixed(1) }} KB</span>
          <span>{{ file.type?.split('/')[1]?.toUpperCase() || 'IMAGE' }}</span>
        </div>
      </div>
    </template>

    <!-- 非图片文件预览 -->
    <template v-else>
      <div class="flex items-center p-3">
        <div class="h-12 w-12 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500">
          <icon-ic:baseline-insert-drive-file size="24" />
        </div>
        <div class="ml-3 min-w-0 flex-1">
          <div class="truncate text-sm text-gray-800 font-medium">
            {{ file.name || '未命名文件' }}
          </div>
          <div v-if="file.size || file.type" class="flex items-center justify-between text-xs text-gray-500">
            <span v-if="file.size">{{ (file.size / 1024).toFixed(1) }} KB</span>
            <span v-if="file.type">
              {{ file.type.split('/').pop()?.toUpperCase() || 'FILE' }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
