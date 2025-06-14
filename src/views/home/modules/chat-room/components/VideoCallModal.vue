<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { NButton, NModal, NSpace } from 'naive-ui';

const props = defineProps<{
  show: boolean;
  caller: string;
  isVideo: boolean;
}>();

const emit = defineEmits<{
  (e: 'accept'): void;
  (e: 'reject'): void;
  (e: 'end'): void;
}>();

const localVideoRef = ref<HTMLVideoElement>();
const remoteVideoRef = ref<HTMLVideoElement>();
const audioRef = ref<HTMLAudioElement>();
const isConnected = ref(false);
const localStream = ref<MediaStream>();
const isCallActive = ref(false);

// 停止所有媒体流
const stopMediaStreams = () => {
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => {
      track.stop();
    });
    localStream.value = undefined;
  }

  [localVideoRef.value, remoteVideoRef.value, audioRef.value].forEach(el => {
    if (el?.srcObject) {
      (el.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      el.srcObject = null;
    }
  });

  isCallActive.value = false;
};

// 初始化媒体流
const initMedia = async () => {
  try {
    // 先停止之前的流
    stopMediaStreams();

    // 1. 检查API可用性
    if (!navigator.mediaDevices?.getUserMedia) {
      window.$message?.error('您的浏览器不支持视频通话');
      return;
    }

    // 2. 检查安全上下文
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      window.$message?.error('请使用HTTPS连接或本地开发环境');
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: props.isVideo
    });

    console.log(stream, '本地媒体流');

    localStream.value = stream;
    isCallActive.value = true;

    await nextTick();

    // 绑定本地视频
    if (localVideoRef.value) {
      localVideoRef.value.srcObject = stream;
      localVideoRef.value.play().catch(e => {
        console.error('播放失败:', e);
        window.$message?.error('无法播放本地视频');
      });
    } else {
      console.error('localVideoRef 未绑定');
      window.$message?.error('视频初始化失败');
      return;
    }

    // 模拟远程连接
    setTimeout(() => {
      if (props.isVideo && remoteVideoRef.value) {
        remoteVideoRef.value.srcObject = new MediaStream();
        remoteVideoRef.value.play().catch(e => console.error('远程视频播放失败:', e));
      } else if (audioRef.value) {
        audioRef.value.srcObject = new MediaStream();
      }
      isConnected.value = true;
    }, 500);
  } catch (error: any) {
    console.error('获取媒体设备失败:', error);
    // 4. 处理不同错误类型
    if (error.name === 'NotAllowedError') {
      window.$message?.error('请允许摄像头和麦克风权限');
    } else if (error.name === 'NotFoundError') {
      window.$message?.error('未找到可用的媒体设备');
    } else {
      window.$message?.error(`无法访问媒体设备: ${error.message}`);
      window.$message?.error('无法访问摄像头/麦克风');
    }
    stopMediaStreams();
    emit('end');
  }
};

const handleAccept = async () => {
  await initMedia();
  emit('accept');
};

const handleEndCall = () => {
  stopMediaStreams();
  isConnected.value = false;
  emit('end');
};

const handleSwitchCamera = () => {
  // 切换摄像头
};

// 监听show变化
watch(
  () => props.show,
  newVal => {
    if (!newVal) {
      handleEndCall();
    }
  }
);

onMounted(() => {
  console.log(localVideoRef.value, 'localVideoRef');
  console.dir(localVideoRef.value);
});

onUnmounted(() => {
  handleEndCall();
});
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
      <div v-show="isConnected" class="w-full">
        <div v-show="isVideo" class="relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-gray-900">
          <video ref="remoteVideoRef" autoplay playsinline class="h-full w-full object-cover"></video>

          <!-- 本地视频小窗 -->
          <div
            v-show="localStream"
            class="absolute bottom-4 right-4 w-1/4 overflow-hidden border-2 border-white rounded-md bg-black shadow-lg"
            @click="handleSwitchCamera"
          >
            <video
              ref="localVideoRef"
              autoplay
              playsinline
              muted
              class="h-full w-full scale-x-[-1] object-cover"
              width="100%"
              height="100%"
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
          <NButton type="error" circle size="large" :loading="!isCallActive" @click="handleEndCall">
            <template #icon>
              <icon-ic:baseline-call-end class="text-xl" />
            </template>
          </NButton>
        </NSpace>
      </div>

      <!-- 来电UI -->
      <template v-if="!isConnected">
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
          <NButton type="error" circle size="large" @click="emit('reject')">
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
