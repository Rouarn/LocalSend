import { ref } from 'vue';
import type { AxiosProgressEvent } from 'axios';
import { uploadFile } from '@/service/api';
export function useFileHandling(props: any, messages: any, emit: any) {
  const fileInputRef = ref<HTMLInputElement | null>(null);
  const selectedFiles = ref<any[]>([]);

  const selectFiles = () => {
    if (!fileInputRef.value) return;
    fileInputRef.value.click();
  };

  const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const newFiles = Array.from(input.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = newFiles.filter(file => file.size <= maxSize);

    if (validFiles.length !== input.files.length) {
      window.$message?.warning('部分文件超过大小限制(10MB)');
    }

    for (const newFile of validFiles) {
      const exists = selectedFiles.value.some(file => file.name === newFile.name && file.size === newFile.size);

      if (!exists) {
        selectedFiles.value.push(newFile);
      } else {
        window.$message?.warning(`文件 ${newFile.name} 已存在`);
      }
    }

    input.value = '';
  };

  const removeFile = (index: number) => {
    selectedFiles.value.splice(index, 1);
  };

  const uploadFiles = async () => {
    if (selectedFiles.value.length === 0) return;

    try {
      // 文件类型映射
      const getFileTypeLabel = (file: File) => {
        const type = file.type.split('/')[0];
        const extensions = file.name.split('.').pop()?.toLowerCase();

        if (type === 'image') return '[图片]';
        if (type === 'video') return '[视频]';
        if (type === 'audio') return '[音频]';

        // 特定文档类型
        const documentTypes = {
          pdf: '[PDF]',
          doc: '[Word]',
          docx: '[Word]',
          xls: '[Excel]',
          xlsx: '[Excel]',
          ppt: '[PPT]',
          pptx: '[PPT]',
          txt: '[文本]',
          zip: '[压缩包]',
          rar: '[压缩包]',
          '7z': '[压缩包]'
        };

        return documentTypes[extensions as keyof typeof documentTypes] || '[文件]';
      };

      // 先创建本地消息（带占位内容）
      const localMessages = selectedFiles.value.map(file => {
        const message: Api.Websocket.Message = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          roomId: props.roomId,
          text: `${getFileTypeLabel(file)} ${file.name}`,
          senderId: props.currentUser.socketId,
          timestamp: new Date(),
          status: 'sending',
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadProgress: 0,
            url: URL.createObjectURL(file) // 本地预览URL
          }
        };
        messages.value.push(message);
        return message;
      });

      // 并行上传所有文件
      const uploadPromises = selectedFiles.value.map(async (file, index) => {
        const currentMessage = messages.value.find((message: { id: any }) => message.id === localMessages[index].id);

        try {
          const { data } = await uploadFile(
            {
              file,
              type: 'file'
            },
            {
              onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
                currentMessage.file.uploadProgress = progress;
              }
            }
          );

          // 上传完成后更新消息
          currentMessage.status = 'sent';
          currentMessage.file.url = data?.info.url;
          currentMessage.file.uploadProgress = 100;

          // 发送到服务器
          emit('message', currentMessage);
        } catch (error) {
          currentMessage.status = 'failed';
          window.$message?.error(`上传失败${error}`);
        } finally {
          //
        }
      });

      await Promise.all(uploadPromises);
      selectedFiles.value = [];
    } catch (error) {
      window.$message?.error(`上传失败${error}`);
    }
  };

  return {
    fileInputRef,
    selectedFiles,
    selectFiles,
    handleFileChange,
    removeFile,
    uploadFiles
  };
}
