<script setup lang="ts">
import { ref } from 'vue';
import { NImage, NProgress } from 'naive-ui';
import axios from 'axios';
import mittBus from '@/utils/mittBus';

defineProps<{
  file: Api.Websocket.File;
}>();

const emit = defineEmits<{
  (e: 'click', file: Api.Websocket.File): void;
  (e: 'downloadProgress', progress: number): void;
}>();

const downloadProgress = ref(0);
const isDownloading = ref(false);

const handleClick = async (file: Api.Websocket.File) => {
  if (isDownloading.value) return;

  isDownloading.value = true;
  downloadProgress.value = 0;

  try {
    window.$message?.info('开始下载...');

    const response = await axios({
      url: file.url,
      method: 'GET',
      responseType: 'blob',
      onDownloadProgress: progressEvent => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          downloadProgress.value = percent;
          emit('downloadProgress', percent);
        }
      }
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.$message?.success('下载完成');
  } catch (error) {
    window.$message?.error('下载失败');
    console.error('下载失败:', error);
  } finally {
    isDownloading.value = false;
    downloadProgress.value = 0;
  }

  emit('click', file);
};
</script>

<template>
  <div
    class="relative inline-block cursor-pointer overflow-hidden border border-gray-200 rounded-lg bg-gray-50 shadow-sm transition-all hover:shadow-md"
    :class="{
      'max-w-[300px]': file.type?.startsWith('image'),
      'max-h-[250px]': !file.type?.startsWith('image')
    }"
    @click="handleClick(file)"
  >
    <!-- 下载/上传进度条 -->
    <div
      v-if="isDownloading || (file.uploadProgress > 0 && file.uploadProgress !== 100)"
      class="absolute bottom-0 left-0 right-0"
    >
      <NProgress
        type="line"
        :percentage="downloadProgress || file.uploadProgress"
        :height="4"
        :show-indicator="false"
        :status="downloadProgress < 100 || file.uploadProgress < 100 ? 'info' : 'success'"
      />
    </div>

    <!-- 图片预览 -->
    <template v-if="file.type?.startsWith('image') && file.url">
      <NImage
        :src="file.url"
        :alt="file.name || '图片'"
        class="block cursor-pointer"
        :img-props="{
          class: 'max-h-[200px] w-auto object-cover',
          onLoad: () => mittBus.emit('emit:scrollToBottom')
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
