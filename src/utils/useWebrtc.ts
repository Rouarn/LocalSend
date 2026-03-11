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
    // 确保清理旧连接
    this.cleanup();

    await this.initLocalStream(isVideo);

    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'turn:106.14.105.161:3478', username: 'woyuxiaji', credential: 'asdfghjkl' }]
    });

    // 按固定顺序添加轨道
    const tracks = this.localStream.value?.getTracks() || [];
    const audioTracks = tracks.filter(t => t.kind === 'audio');
    const videoTracks = tracks.filter(t => t.kind === 'video');

    // 先添加音频轨道，再添加视频轨道（保持顺序一致）
    audioTracks.forEach(track => this.pc?.addTrack(track, this.localStream.value!));
    if (isVideo) {
      videoTracks.forEach(track => this.pc?.addTrack(track, this.localStream.value!));
    }

    this.setupPeerConnectionEvents();

    try {
      await this.createAndSendOffer();
    } catch (error) {
      console.error('Error creating initial offer:', error);
      throw error;
    }
  }

  private async createAndSendOffer() {
    if (!this.pc || this.pc.signalingState !== 'stable') {
      console.warn('Cannot create offer in non-stable state:', this.pc?.signalingState);
      return;
    }

    try {
      this.makingOffer = true;
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await this.pc.setLocalDescription(offer);

      this.socket.emit('rtc-offer', {
        roomId: this.roomId,
        senderId: this.currentUserId,
        description: this.pc.localDescription
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    } finally {
      this.makingOffer = false;
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
    this.pc.onnegotiationneeded = async () => {
      if (this.makingOffer || !this.pc || this.pc.signalingState !== 'stable') {
        return;
      }
      await this.createAndSendOffer();
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
