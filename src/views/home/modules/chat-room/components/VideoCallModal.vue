<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NModal, NSpace } from 'naive-ui';

const props = defineProps<{
  show: boolean;
  caller: string;
  isVideo: boolean;
  isCalling: boolean;
  isIncoming: boolean;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}>();

const emit = defineEmits<{
  (e: 'accept'): void;
  (e: 'reject'): void;
  (e: 'end'): void;
}>();

const localVideoRef = ref<HTMLVideoElement>();
const remoteVideoRef = ref<HTMLVideoElement>();
const audioRef = ref<HTMLAudioElement>();

// 绑定媒体流到视频元素
watch(
  () => props.localStream,
  stream => {
    if (stream && localVideoRef.value) {
      localVideoRef.value.srcObject = stream;
    }
  },
  { immediate: true }
);

watch(
  () => props.remoteStream,
  stream => {
    if (stream) {
      if (props.isVideo && remoteVideoRef.value) {
        remoteVideoRef.value.srcObject = stream;
      } else if (audioRef.value) {
        audioRef.value.srcObject = stream;
      }
    }
  },
  { immediate: true }
);

// 处理接受通话
const handleAccept = () => {
  emit('accept');
};

// 处理拒绝通话
const handleReject = () => {
  emit('reject');
};

// 处理结束通话
const handleEndCall = () => {
  emit('end');
};
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :bordered="false"
    :segmented="false"
    :closable="false"
    transform-origin="center"
    :class="{
      'w-[800px]': isVideo,
      'w-[400px]': !isVideo
    }"
  >
    <div class="flex flex-col items-center p-4">
      <!-- 通话中UI -->
      <div v-show="isCalling" class="w-full flex flex-col items-center">
        <div v-show="isVideo" class="relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-gray-900">
          <video ref="remoteVideoRef" autoplay playsinline class="h-full w-full object-cover"></video>

          <!-- 本地视频小窗 -->
          <div
            v-show="localStream"
            class="absolute bottom-4 right-4 w-1/4 overflow-hidden border-2 border-white rounded-md bg-black shadow-lg"
          >
            <video
              ref="localVideoRef"
              autoplay
              playsinline
              muted
              class="h-full w-full scale-x-[-1] object-cover"
            ></video>
          </div>
        </div>

        <template v-if="!isVideo">
          <div
            class="mb-6 h-32 w-32 flex items-center justify-center rounded-full from-blue-500 to-purple-600 bg-gradient-to-br"
          >
            <icon-ic:baseline-person class="text-6xl text-white" />
          </div>
          <h3 class="mb-1 text-xl font-semibold">{{ caller }}</h3>
          <p class="mb-6 text-gray-500">通话进行中...</p>
          <audio ref="audioRef" autoplay class="hidden"></audio>
        </template>

        <!-- 控制按钮 -->
        <NSpace justify="center" class="w-full">
          <NButton type="error" circle size="large" @click="handleEndCall">
            <template #icon>
              <icon-ic:baseline-call-end class="text-xl" />
            </template>
          </NButton>
        </NSpace>
      </div>

      <!-- 来电UI -->
      <template v-if="isIncoming">
        <div
          class="mb-6 h-32 w-32 flex items-center justify-center rounded-full from-blue-500 to-purple-600 bg-gradient-to-br"
        >
          <icon-ic:baseline-person class="text-6xl text-white" />
        </div>
        <h3 class="mb-1 text-xl font-semibold">{{ caller }}</h3>
        <p class="mb-6 text-gray-500">
          {{ isVideo ? '视频通话请求' : '语音通话请求' }}
        </p>

        <NSpace justify="center" class="w-full">
          <NButton type="error" circle size="large" @click="handleReject">
            <template #icon>
              <icon-ic:baseline-call-end class="text-xl" />
            </template>
          </NButton>
          <NButton type="success" circle size="large" @click="handleAccept">
            <template #icon>
              <icon-ic:baseline-call class="text-xl" />
            </template>
          </NButton>
        </NSpace>
      </template>
    </div>
  </NModal>
</template>
