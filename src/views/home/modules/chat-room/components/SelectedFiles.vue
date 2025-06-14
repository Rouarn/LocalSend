<script setup lang="ts">
import { NButton } from 'naive-ui';

defineProps<{
  files: any[];
}>();

const emit = defineEmits<{
  (e: 'removeFile', file: any): void;
  (e: 'uploadFiles', files: any): void;
}>();

const createObjectURL = (file: any) => URL.createObjectURL(file);
</script>

<template>
  <div class="border-b border-gray-200/50 px-3 py-2">
    <div class="mb-2 flex items-center justify-between" @click="emit('uploadFiles', files)">
      <span class="text-sm text-gray-600">已选择 {{ files.length }} 个文件</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <div v-for="(file, index) in files" :key="index" class="relative">
        <div class="flex items-center rounded-lg bg-gray-100 p-2">
          <template v-if="file.type.startsWith('image/')">
            <img :src="createObjectURL(file)" class="h-12 w-12 rounded object-cover" alt="预览" />
          </template>
          <template v-else>
            <div class="h-12 w-12 flex items-center justify-center rounded bg-gray-200">
              <icon-ic:baseline-insert-drive-file class="text-gray-500" size="24" />
            </div>
          </template>
          <div class="ml-2 max-w-[120px]">
            <div class="truncate text-xs font-medium">
              {{ file.name }}
            </div>
            <div class="text-xs text-gray-500">{{ (file.size / 1024).toFixed(1) }} KB</div>
          </div>
        </div>
        <NButton
          text
          class="absolute rounded-full bg-white p-1 shadow -right-2 -top-2"
          @click="emit('removeFile', index)"
        >
          <icon-ic:baseline-close class="text-gray-500" size="16" />
        </NButton>
      </div>
    </div>
  </div>
</template>
