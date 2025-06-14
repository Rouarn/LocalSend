import type { AxiosProgressEvent } from 'axios';
import { request } from '../request';

/**
 * 上传文件
 *
 * @param data 上传参数
 * @param options 可选配置
 */
export function uploadFile(
  data: { file: File; type: string },
  options?: {
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  }
) {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('type', data.type);

  return request<{
    message: string;
    info: {
      url: string;
      type: string;
      size: string;
      name: string;
    };
    filePath: string;
  }>({
    url: 'upload/classified',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData,
    onUploadProgress: options?.onUploadProgress
  });
}
