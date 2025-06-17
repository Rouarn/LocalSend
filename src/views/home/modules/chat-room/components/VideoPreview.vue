<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NButton, NIcon, NProgress, NTooltip } from 'naive-ui';
import {
  FullscreenExitFilled,
  FullscreenFilled,
  PauseFilled,
  PlayArrowFilled,
  VolumeMuteFilled,
  VolumeUpFilled
} from '@vicons/material';
import mittBus from '@/utils/mittBus';

defineProps<{
  file: Api.Websocket.File;
  baseURL: string;
}>();

const videoPlayer = ref<HTMLVideoElement | null>(null);
const videoContainer = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const isSeeking = ref(false);
const volume = ref(0.7);
const isMuted = ref(false);
const isFullscreen = ref(false);
const progressRef = ref<HTMLElement | null>(null);
const showControls = ref(true);
let controlsTimeout: number;

// 计算控制条尺寸相关属性
const buttonSize: 'tiny' | 'small' | 'medium' | 'large' = isFullscreen.value ? 'medium' : 'small';
const controlSize = computed(() => ({
  buttonSize,
  buttonClass: isFullscreen.value ? '!h-12 !w-12' : '!h-10 !w-10',
  iconSize: isFullscreen.value ? 24 : 20,
  timeClass: isFullscreen.value ? 'w-12 text-sm' : 'w-10 text-xs',
  progressHeight: isFullscreen.value ? 8 : 6,
  padding: isFullscreen.value ? 'p-4' : 'p-3'
}));

// 初始化视频设置
const initVideo = () => {
  if (videoPlayer.value) {
    videoPlayer.value.volume = volume.value;
    videoPlayer.value.preload = 'metadata';
  }
};

const togglePlay = () => {
  if (!videoPlayer.value) return;

  if (isPlaying.value) {
    videoPlayer.value.pause();
  } else {
    videoPlayer.value.play().catch(e => {
      console.error('播放失败:', e);
    });
  }
};

const toggleMute = () => {
  if (videoPlayer.value) {
    isMuted.value = !isMuted.value;
    videoPlayer.value.muted = isMuted.value;
  }
};

const toggleFullscreen = () => {
  if (!videoContainer.value) return;

  if (!isFullscreen.value) {
    if (videoContainer.value.requestFullscreen) {
      videoContainer.value.requestFullscreen();
    }
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
};

const updateProgress = () => {
  if (!videoPlayer.value || isSeeking.value) return;
  currentTime.value = videoPlayer.value.currentTime;
};

const updateDuration = () => {
  mittBus.emit('emit:scrollToBottom');
  if (videoPlayer.value) {
    duration.value = videoPlayer.value.duration || 0;
  }
};

const resetControlsTimeout = () => {
  if (!isFullscreen.value) return;

  showControls.value = true;
  clearTimeout(controlsTimeout);
  controlsTimeout = window.setTimeout(() => {
    showControls.value = false;
  }, 3000);
};

const handleSeekStart = () => {
  isSeeking.value = true;
  resetControlsTimeout();
};

const handleSeek = (e: MouseEvent) => {
  if (!isSeeking.value || !progressRef.value || !videoPlayer.value) return;

  const progressBar = progressRef.value;
  const rect = progressBar.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);

  currentTime.value = percentage * duration.value;
};

const handleSeekEnd = (e: MouseEvent) => {
  e.stopPropagation();
  if (!progressRef.value || !videoPlayer.value) return;

  const progressBar = progressRef.value;
  const rect = progressBar.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);

  currentTime.value = percentage * duration.value;
  videoPlayer.value.currentTime = currentTime.value;
  isSeeking.value = false;
  resetControlsTimeout();
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const handleFullscreenChange = () => {
  isFullscreen.value = Boolean(document.fullscreenElement);
};

const handleVideoClick = () => {
  if (isFullscreen.value) {
    resetControlsTimeout();
  } else {
    togglePlay();
  }
};

onMounted(() => {
  initVideo();
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  resetControlsTimeout();
});

onUnmounted(() => {
  if (videoPlayer.value) {
    videoPlayer.value.pause();
    videoPlayer.value.src = '';
    videoPlayer.value.removeAttribute('src');
  }
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  clearTimeout(controlsTimeout);
});
</script>

<template>
  <div
    ref="videoContainer"
    class="relative max-w-2xl w-full overflow-hidden rounded-lg bg-gray-1 dark:bg-gray-8"
    @mousemove="isFullscreen ? resetControlsTimeout() : null"
  >
    <!-- 视频元素 -->
    <video
      ref="videoPlayer"
      :src="baseURL + file.url"
      class="h-auto w-full cursor-pointer"
      @click="handleVideoClick"
      @timeupdate="updateProgress"
      @loadedmetadata="updateDuration"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="isPlaying = false"
    />

    <!-- 视频信息区域 (非全屏时显示) -->
    <div
      v-if="!isFullscreen"
      class="absolute left-2 right-2 top-2 flex items-center gap-2 rounded bg-black/50 p-2 text-white"
    >
      <div class="truncate text-sm font-medium">
        {{ file.name || '未命名视频' }}
      </div>
      <div v-if="file.size" class="ml-auto text-xs text-gray-300">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</div>
    </div>

    <!-- 控制条 (合并全屏和非全屏) -->
    <div
      v-if="!isFullscreen || showControls"
      class="absolute bottom-0 left-0 right-0 from-black/80 to-transparent bg-gradient-to-t"
      :class="controlSize.padding"
    >
      <div class="flex items-center gap-3">
        <!-- 播放/暂停按钮 -->
        <NTooltip>
          <template #trigger>
            <NButton circle :size="controlSize.buttonSize" :class="controlSize.buttonClass" @click="togglePlay">
              <NIcon :size="controlSize.iconSize" color="white">
                <PlayArrowFilled v-if="!isPlaying" />
                <PauseFilled v-else />
              </NIcon>
            </NButton>
          </template>
          {{ isPlaying ? '暂停' : '播放' }}
        </NTooltip>

        <!-- 进度条 -->
        <div class="flex flex-1 items-center gap-2">
          <div class="text-center text-white" :class="controlSize.timeClass">
            {{ formatTime(currentTime) }}
          </div>
          <div ref="progressRef" class="flex-1">
            <NProgress
              type="line"
              :percentage="duration > 0 ? (currentTime / duration) * 100 : 0"
              :height="controlSize.progressHeight"
              :show-indicator="false"
              :rail-color="isSeeking ? '#d8b4fe' : undefined"
              class="cursor-pointer"
              @mousedown="handleSeekStart"
              @mousemove="handleSeek"
              @click="handleSeekEnd"
            />
          </div>
          <div class="text-center text-white" :class="controlSize.timeClass">
            {{ formatTime(duration) }}
          </div>
        </div>

        <!-- 静音按钮 -->
        <NTooltip>
          <template #trigger>
            <NButton circle :size="controlSize.buttonSize" :class="controlSize.buttonClass" @click="toggleMute">
              <NIcon :size="controlSize.iconSize" color="white">
                <VolumeUpFilled v-if="!isMuted" />
                <VolumeMuteFilled v-else />
              </NIcon>
            </NButton>
          </template>
          {{ isMuted ? '取消静音' : '静音' }}
        </NTooltip>

        <!-- 全屏/退出全屏按钮 -->
        <NTooltip>
          <template #trigger>
            <NButton circle :size="controlSize.buttonSize" :class="controlSize.buttonClass" @click="toggleFullscreen">
              <NIcon :size="controlSize.iconSize" color="white">
                <FullscreenExitFilled v-if="isFullscreen" />
                <FullscreenFilled v-else />
              </NIcon>
            </NButton>
          </template>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </NTooltip>
      </div>
    </div>
  </div>
</template>
