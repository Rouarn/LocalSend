<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useSocketStore } from '@/store/modules/socket';
import { useSocket } from '@/utils/useSocket';
import { WebRTCService } from '@/utils/useWebrtc';
import mittBus from '@/utils/mittBus';
import ChatHeader from './components/ChatHeader.vue';
import ChatMessages from './components/ChatMessages.vue';
import ChatInput from './components/ChatInput.vue';
import VideoCallModal from './components/VideoCallModal.vue';
import { useChatMessages } from './composables/useChatMessages';
import { useFileHandling } from './composables/useFileHandling';
import { useChatFunctions } from './composables/useChatFunctions';

const props = defineProps<{
  roomId: string; // 房间ID
  roomName: string; // 房间名称
  isPrivateChat: boolean; // 是否是私聊
  privateChatUser?: Api.Websocket.OnlineUser; // 私聊对象 (对方, 只有私聊时存在)
  currentUser: Api.Websocket.OnlineUser; // 当前用户 (本机)
}>();

const { listen, emit } = useSocket();
const newMessage = ref('');

// 组合式函数
const { messages, onlineUsers, listeneMessage, setOnlineUsers } = useChatMessages(props, emit);
const { selectedFiles, fileInputRef, selectFiles, handleFileChange, removeFile, uploadFiles } = useFileHandling(
  props,
  messages,
  emit
);
const { showEmojiPopover, showMoreFunction, reset } = useChatFunctions();
const socketStore = useSocketStore();

// 发送消息
const sendMessage = () => {
  if (!newMessage.value.trim() && selectedFiles.value.length === 0) return;

  const message: Api.Websocket.Message = {
    id: Date.now().toString(),
    text: newMessage.value,
    roomId: props.roomId,
    senderId: props.currentUser.socketId,
    timestamp: new Date(),
    status: 'sending'
  };
  if (newMessage.value.trim()) {
    emit('message', message).then(() => {
      setTimeout(() => {
        const index = messages.value.findIndex(m => m.id === message.id);
        if (index !== -1) {
          messages.value[index].status = 'sent';
        }
      }, 1000);
    });

    messages.value.push(message);
    newMessage.value = '';
    showEmojiPopover.value = false;
  }

  if (selectedFiles.value.length > 0) {
    uploadFiles();
  }
};

const welcomeMessage = (message: Api.Websocket.Message) => {
  if (socketStore.isPrivateChat) return;
  messages.value.push(message);
};

// 通话状态
const callState = ref({
  showCallModal: false, // 是否显示通话弹窗
  isVideoCall: false, // 是否是视频通话
  isCalling: false, // 是否正在通话
  isIncomingCall: false, // 是否是来电
  caller: '', // 来电用户名
  callerId: '' // 来电者id
});

let webRTCService: WebRTCService | null = null;

// 初始化WebRTC服务
const initWebRTCService = () => {
  webRTCService = new WebRTCService(props.roomId, props.currentUser.socketId);

  // 监听WebRTC相关事件
  listen('listen:offer', async (data: any) => {
    if (data.senderId === props.currentUser.socketId) return;
    if (webRTCService) {
      await webRTCService.handleOffer(data.description);
    }
  });

  listen('listen:answer', async (data: any) => {
    if (data.senderId === props.currentUser.socketId) return;
    if (webRTCService) {
      await webRTCService.handleAnswer(data.description);
    }
  });

  listen('listen:iceCandidate', async (data: any) => {
    if (data.senderId === props.currentUser.socketId) return;
    if (webRTCService) {
      await webRTCService.handleIceCandidate(data.candidate);
    }
  });
};

// 结束通话
const endCall = () => {
  webRTCService?.cleanup();
  webRTCService = null;

  callState.value = {
    showCallModal: false,
    isVideoCall: false,
    isCalling: false,
    isIncomingCall: false,
    caller: '',
    callerId: ''
  };
};

// 发起通话
const startCall = (isVideo: boolean) => {
  if (props.isPrivateChat) {
    const call = {
      showCallModal: true,
      isVideoCall: isVideo,
      isCalling: true,
      isIncomingCall: false, // 这是主动发起的通话
      caller: `${props.currentUser.socketName}邀请你进行通话`,
      callerId: props.currentUser.socketId
    };
    // 发送通话请求
    emit('call-request', {
      roomId: props.roomId,
      targetId: props.privateChatUser?.socketId, // 目标用户的socketId
      isVideo,
      caller: call.caller, // 当前用户消息 (相当于 from)
      callerId: props.currentUser.socketId
    }).then(async () => {
      if (!webRTCService) {
        console.log('初始化WebRTC服务:发送通话请求');
        initWebRTCService();
        callState.value = call;
      }

      try {
        await webRTCService?.startPeerConnection(isVideo);
      } catch (error) {
        console.error('Failed to start call:', error);
        window.$message?.error('无法启动通话');
        endCall();
      }
    });
  } else {
    window.$message?.error('当前状态不允许进行通话, 仅支持私聊通话');
  }
};

// 接受通话
const acceptCall = async () => {
  callState.value.isCalling = true; // 设置为正在通话
  callState.value.isIncomingCall = false; // 不再是来电状态

  if (!webRTCService) {
    console.log('初始化WebRTC服务, 接受通话');
    initWebRTCService();
    window.$message?.info('初始化WebRTC服务, 接受通话');
  } else {
    console.log('WebRTC服务已存在, 接受通话');
    window.$message?.info('WebRTC服务已存在, 接受通话');
  }

  try {
    await webRTCService?.startPeerConnection(callState.value.isVideoCall);
  } catch (error) {
    console.error('Failed to accept call:', error);
    window.$message?.error('无法接受通话');
    endCall();
  }
};

// 来电
const handIncomingCall = (data: any) => {
  callState.value = {
    showCallModal: true,
    isVideoCall: data.isVideo,
    isCalling: false, // 等待接听
    isIncomingCall: true,
    caller: data.caller,
    callerId: data.callerId
  };
};

// 初始化
onMounted(() => {
  // initWebRTCService();
  listen('incoming-call', handIncomingCall); // 监听来电
  listen('listen:message', listeneMessage); // 监听消息
  listen('welcome_message', welcomeMessage); // 监听欢迎消息
  listen('goodbye_message', welcomeMessage); // 监听退群消息
  mittBus.on('listen:onlineUsers', setOnlineUsers); // 监听在线用户
});

onUnmounted(() => {
  endCall();

  mittBus.off('listen:onlineUsers');
});
</script>

<template>
  <div class="h-full flex flex-col from-gray-50 to-gray-100 bg-gradient-to-br">
    <ChatHeader :room-name="roomName" :is-private-chat="isPrivateChat" :online-users="onlineUsers" />

    <ChatMessages :messages="messages" :current-user="currentUser" :online-users="onlineUsers" />

    <ChatInput
      v-model:new-message="newMessage"
      :selected-files="selectedFiles"
      :show-emoji-popover="showEmojiPopover"
      :show-more-function="showMoreFunction"
      @toggle-more-function="showMoreFunction = !showMoreFunction"
      @toggle-emoji-popover="showEmojiPopover = !showEmojiPopover"
      @send-message="sendMessage"
      @select-files="selectFiles"
      @remove-file="removeFile"
      @upload-files="uploadFiles"
      @reset="reset"
      @start-video-call="startCall(true)"
      @start-voice-call="startCall(false)"
    />

    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      multiple
      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.mp4,.mp3"
      @change="handleFileChange"
    />

    <!-- 新增通话模态框 -->
    <VideoCallModal
      :show="callState.showCallModal"
      :caller="callState.caller"
      :is-video="callState.isVideoCall"
      :is-calling="callState.isCalling"
      :is-incoming="callState.isIncomingCall"
      :local-stream="webRTCService?.getLocalStream()?.value"
      :remote-stream="webRTCService?.getRemoteStream()?.value"
      @accept="acceptCall"
      @reject="endCall"
      @end="endCall"
    />
  </div>
</template>
