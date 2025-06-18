<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { NButton, NIcon, NProgress, NTooltip } from 'naive-ui';
import { ArrowCircleDownRound, PauseFilled, PlayArrowFilled, VolumeMuteFilled, VolumeUpFilled } from '@vicons/material';

defineProps<{
  file: Api.Websocket.File;
  baseURL: string;
}>();

defineEmits<{
  (e: 'download'): void;
}>();

const audioPlayer = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const isSeeking = ref(false);
const volume = ref(0.7);
const isMuted = ref(false);
const isMouseHover = ref(false);
const progressRef = ref<HTMLElement | null>(null);

// 初始化音频设置
const initAudio = () => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = volume.value;
    audioPlayer.value.preload = 'metadata';
  }
};

const togglePlay = () => {
  if (!audioPlayer.value) return;

  if (isPlaying.value) {
    audioPlayer.value.pause();
  } else {
    audioPlayer.value.play().catch(e => {
      window.$message?.error(`无法播放音频${e.message}`);
    });
  }
};

const toggleMute = () => {
  if (audioPlayer.value) {
    isMuted.value = !isMuted.value;
    audioPlayer.value.muted = isMuted.value;
  }
};

const updateProgress = () => {
  if (!audioPlayer.value || isSeeking.value) return;
  currentTime.value = audioPlayer.value.currentTime;
};

const updateDuration = () => {
  if (audioPlayer.value) {
    duration.value = audioPlayer.value.duration || 0;
  }
};

const handleSeekStart = () => {
  isSeeking.value = true;
};

const handleSeek = (e: MouseEvent) => {
  if (!isSeeking.value || !progressRef.value || !audioPlayer.value) return;

  const progressBar = progressRef.value;
  const rect = progressBar.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);

  currentTime.value = percentage * duration.value;
};

const handleSeekEnd = (e: MouseEvent) => {
  if (!progressRef.value || !audioPlayer.value) return;

  const progressBar = progressRef.value;
  const rect = progressBar.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);

  currentTime.value = percentage * duration.value;
  audioPlayer.value.currentTime = currentTime.value;
  isSeeking.value = false;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

onMounted(() => {
  initAudio();
});

onUnmounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.src = '';
    audioPlayer.value.removeAttribute('src');
  }
});

// 鼠标悬浮在音频图标上
const handleMouseHover = (bool: boolean) => {
  if (isMouseHover.value === bool) return;
  isMouseHover.value = bool;
};
</script>

<template>
  <div class="mx-w-350px rounded-lg bg-gray-1 p-4 dark:bg-gray-8">
    <!-- 音频信息区域 -->
    <div class="mb-3 flex items-center gap-3" @mouseover="handleMouseHover(true)" @mouseleave="handleMouseHover(false)">
      <div class="h-12 w-12 flex items-center justify-center rounded-lg bg-purple-1 dark:bg-purple-9">
        <NIcon size="24" color="#7c3aed" dark:color="#a78bfa">
          <VolumeUpFilled v-if="!isMouseHover" />
          <ArrowCircleDownRound v-else @click="$emit('download')" />
        </NIcon>
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm text-gray-8 font-medium dark:text-gray-2">
          {{ file.name || '未命名音频' }}
        </div>
        <div v-if="file.size" class="text-xs text-gray-5 dark:text-gray-4">{{ (file.size / 1024).toFixed(1) }} KB</div>
      </div>
    </div>

    <!-- 音频控制区域 -->
    <div class="flex items-center gap-3">
      <!-- 播放/暂停按钮 -->
      <NTooltip>
        <template #trigger>
          <NButton circle size="small" class="!h-10 !w-10" @click="togglePlay">
            <NIcon :size="20">
              <PlayArrowFilled v-if="!isPlaying" />
              <PauseFilled v-else />
            </NIcon>
          </NButton>
        </template>
        {{ isPlaying ? '暂停' : '播放' }}
      </NTooltip>

      <!-- 进度条 -->
      <div class="flex flex-1 items-center gap-2">
        <div class="w-10 text-center text-xs text-gray-5 dark:text-gray-4">
          {{ formatTime(currentTime) }}
        </div>
        <div ref="progressRef" class="flex-1">
          <NProgress
            type="line"
            :percentage="duration > 0 ? (currentTime / duration) * 100 : 0"
            :height="6"
            :show-indicator="false"
            :rail-color="isSeeking ? '#d8b4fe' : undefined"
            class="cursor-pointer"
            @mousedown="handleSeekStart"
            @mousemove="handleSeek"
            @click="handleSeekEnd"
          />
        </div>
        <div class="w-10 text-center text-xs text-gray-5 dark:text-gray-4">
          {{ formatTime(duration) }}
        </div>
      </div>

      <!-- 静音按钮 -->
      <NTooltip>
        <template #trigger>
          <NButton circle size="small" class="!h-10 !w-10" @click="toggleMute">
            <NIcon :size="20">
              <VolumeUpFilled v-if="!isMuted" />
              <VolumeMuteFilled v-else />
            </NIcon>
          </NButton>
        </template>
        {{ isMuted ? '取消静音' : '静音' }}
      </NTooltip>
    </div>

    <!-- 隐藏的audio元素 -->
    <audio
      ref="audioPlayer"
      :src="baseURL + file.url"
      class="hidden"
      @timeupdate="updateProgress"
      @loadedmetadata="updateDuration"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="
        isPlaying = false;
        currentTime = 0;
      "
    />
  </div>
</template>
