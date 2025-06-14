import { ref } from 'vue';

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
      console.log('newFile: ', newFile);
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
      // 上传

      selectedFiles.value.forEach(file => {
        const message: Api.Websocket.Message = {
          id: Date.now().toString(),
          roomId: props.roomId,
          text: `[文件] ${file.name}`,
          senderId: props.currentUser.socketId,
          timestamp: new Date(),
          status: 'sent',
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          }
        };
        messages.value.push(message);
        emit('message', message);
      });

      selectedFiles.value = [];
    } catch (error) {
      console.error(error);
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
