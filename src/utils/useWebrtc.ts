import { ref } from 'vue';
import { useSocket } from '@/utils/useSocket';

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream = ref<MediaStream>();
  private remoteStream = ref<MediaStream>();
  private iceCandidates: RTCIceCandidate[] = [];
  private makingOffer = false;
  private ignoreOffer = false;
  private polite = false;
  private socket = useSocket();

  constructor(
    private roomId: string,
    private currentUserId: string
  ) {}

  async initLocalStream(isVideo: boolean) {
    try {
      this.localStream.value = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });
      return this.localStream.value;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  //  初始化本地流
  async startPeerConnection(isVideo: boolean) {
    // 先清理旧的连接（如果存在）
    this.cleanup();

    await this.initLocalStream(isVideo);

    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
        // 可以添加更多的STUN/TURN服务器
      ]
    });

    // 添加本地流到连接
    this.localStream.value?.getTracks().forEach(track => {
      this.pc?.addTrack(track, this.localStream.value!);
    });

    // 设置事件处理器
    this.setupPeerConnectionEvents();

    try {
      // 1. 创建offer
      const offer = await this.pc.createOffer({
        // 添加offer选项，确保稳定的媒体顺序
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo
      });

      // 2. 设置本地描述前先检查状态
      if (this.pc.signalingState !== 'stable') {
        console.warn('Cannot create offer in non-stable state:', this.pc.signalingState);
        return;
      }

      // 3. 设置本地描述
      await this.pc.setLocalDescription(offer);

      // 4. 发送offer
      this.socket.emit('rtc-offer', {
        roomId: this.roomId,
        senderId: this.currentUserId,
        description: this.pc.localDescription
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  private setupPeerConnectionEvents() {
    if (!this.pc) return;

    // 监听ICE候选
    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        // 立即发送ICE候选，不要缓存
        this.socket.emit('rtc-ice-candidate', {
          roomId: this.roomId,
          senderId: this.currentUserId,
          candidate
        });
      }
    };

    // 监听ICE连接状态变化
    this.pc.oniceconnectionstatechange = () => {
      if (this.pc?.iceConnectionState === 'failed') {
        this.pc.restartIce();
      }
    };

    // 监听远程流
    this.pc.ontrack = event => {
      if (!this.remoteStream.value) {
        this.remoteStream.value = new MediaStream();
      }
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.value?.addTrack(track);
      });
    };

    // 监听协商事件
    // 修改协商事件处理
    this.pc.onnegotiationneeded = async () => {
      try {
        // 检查是否已经在协商中
        if (this.makingOffer || this.pc?.signalingState !== 'stable') {
          return;
        }

        this.makingOffer = true;

        // 创建新的offer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        // 发送offer
        this.socket.emit('rtc-offer', {
          roomId: this.roomId,
          senderId: this.currentUserId,
          description: this.pc.localDescription
        });
      } catch (err) {
        console.error('Error in negotiation:', err);
      } finally {
        this.makingOffer = false;
      }
    };
  }

  // 接收offer
  async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.pc || this.ignoreOffer) return;

    try {
      await this.pc.setRemoteDescription(offer);

      // 创建并发送answer
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.socket.emit('rtc-answer', {
        roomId: this.roomId,
        senderId: this.currentUserId,
        description: this.pc.localDescription
      });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }

  //  接收answer
  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.pc) return;

    try {
      await this.pc.setRemoteDescription(answer);
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }

  //  接收ICE候选
  async handleIceCandidate(candidate: RTCIceCandidate) {
    if (!this.pc) return;

    try {
      await this.pc.addIceCandidate(candidate);
    } catch (err) {
      if (!this.ignoreOffer) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  }

  cleanup() {
    this.localStream.value?.getTracks().forEach(track => track.stop());
    this.remoteStream.value?.getTracks().forEach(track => track.stop());
    this.pc?.close();
    this.pc = null;
    this.localStream.value = undefined;
    this.remoteStream.value = undefined;
    this.iceCandidates = [];
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }
}
