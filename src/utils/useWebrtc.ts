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

  async startPeerConnection(isVideo: boolean) {
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
  }

  private setupPeerConnectionEvents() {
    if (!this.pc) return;

    // 监听ICE候选
    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.iceCandidates.push(candidate);
        // 通过Socket.IO发送ICE候选
        useSocket().emit('rtc-ice-candidate', {
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
    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc?.setLocalDescription();
        // 发送offer
        useSocket().emit('rtc-offer', {
          roomId: this.roomId,
          senderId: this.currentUserId,
          description: this.pc?.localDescription
        });
      } catch (err) {
        console.error('Error in negotiation:', err);
      } finally {
        this.makingOffer = false;
      }
    };
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.pc) return;

    try {
      const offerCollision = this.makingOffer || (this.pc.signalingState !== 'stable' && !this.polite);

      this.ignoreOffer = !this.polite && offerCollision;
      if (this.ignoreOffer) return;

      await this.pc.setRemoteDescription(offer);

      if (offer.type === 'offer') {
        await this.pc.setLocalDescription();
        // 发送answer
        useSocket().emit('rtc-answer', {
          roomId: this.roomId,
          senderId: this.currentUserId,
          description: this.pc.localDescription
        });
      }
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.pc) return;

    try {
      await this.pc.setRemoteDescription(answer);
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }

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
