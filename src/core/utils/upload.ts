import * as qiniu from 'qiniu-js';
import SparkMD5 from 'spark-md5';
import request from './request';
import { Message } from '@arco-design/web-react';

/**
 * 环境探测
 */
const isMiniProgram = typeof ArrayBuffer !== 'undefined' && (typeof (globalThis as any).wx !== 'undefined' || typeof (globalThis as any).my !== 'undefined');
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * 上传 Token 响应结构
 */
interface TokenResponse {
  token: string;
  domain: string;
}

/**
 * 确认上传请求参数
 */
export interface ConfirmUploadRequest {
  name: string;
  url: string;
  thumb_url?: string;
  size: number;
  type: string;
  hash: string;
}

/**
 * 资源响应模型
 */
export interface ResourceResponse {
  id: string;
  name: string;
  url: string;
  thumb_url?: string;
  size: number;
  type: string;
  hash: string;
  created_at: string;
  updated_at: string;
}

// Token 缓存
let cachedToken: string | null = null;
let cachedDomain: string | null = null;
let tokenExpireTime: number = 0;

/**
 * 从后端获取上传 Token
 */
async function fetchUploadToken(): Promise<TokenResponse> {
  const res = await request.get('/api/v1/storage/upload-token');
  const { token, domain } = res.data.data;
  tokenExpireTime = Date.now() + 50 * 60 * 1000;
  cachedToken = token;
  cachedDomain = domain;
  return { token, domain };
}

/**
 * 获取有效的 Token
 */
async function getValidToken(): Promise<TokenResponse> {
  if (cachedToken && cachedDomain && Date.now() < tokenExpireTime) {
    return { token: cachedToken, domain: cachedDomain };
  }
  return await fetchUploadToken();
}

/**
 * 计算文件 MD5（兼容 Web 和小程序）
 */
async function getFileMD5(file: any): Promise<string> {
  if (isWeb && file instanceof File) {
    return new Promise((resolve, reject) => {
      const blobSlice = File.prototype.slice;
      const chunkSize = 2097152; // 2MB
      const chunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();

      fileReader.onload = (e) => {
        spark.append(e.target?.result as ArrayBuffer);
        currentChunk++;
        if (currentChunk < chunks) {
          loadNext();
        } else {
          resolve(spark.end());
        }
      };

      fileReader.onerror = () => reject(new Error('MD5 计算失败'));

      function loadNext() {
        const start = currentChunk * chunkSize;
        const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
      }

      loadNext();
    });
  }

  if (isMiniProgram) {
    const wxObj = (globalThis as any).wx;
    if (wxObj?.getFileSystemManager) {
      return new Promise((resolve, reject) => {
        wxObj.getFileSystemManager().readFile({
          filePath: file.path || file,
          success: (res: any) => {
            const spark = new SparkMD5.ArrayBuffer();
            spark.append(res.data);
            resolve(spark.end());
          },
          fail: reject,
        });
      });
    }
  }

  // Fallback
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 生成缩略图（仅 Web 图片文件）
 */
async function generateThumbnail(file: any): Promise<Blob | null> {
  const type = file.type || '';
  if (!type.startsWith('image/')) return null;

  if (isWeb) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    });
  }

  return null;
}

/**
 * 执行七牛上传（兼容 Web 和小程序）
 */
async function uploadToQiniu(file: any, key: string, token: string, fileName: string): Promise<any> {
  if (isWeb) {
    const uploadTask = () =>
      new Promise((resolve, reject) => {
        const observable = qiniu.upload(file, key, token, { fname: fileName }, { useCdnDomain: true });
        observable.subscribe({
          next: () => {},
          error: (err: any) => {
            if (err.code === 401) reject({ type: 'TOKEN_EXPIRED', originalError: err });
            else reject(err);
          },
          complete: (res) => resolve(res),
        });
      });

    try {
      return await uploadTask();
    } catch (error: any) {
      if (error.type === 'TOKEN_EXPIRED') {
        const { token: newToken } = await fetchUploadToken();
        return new Promise((resolve, reject) => {
          qiniu
            .upload(file, key, newToken, { fname: fileName }, { useCdnDomain: true })
            .subscribe({ error: (err) => reject(err), complete: (res) => resolve(res) });
        });
      }
      throw error;
    }
  }

  if (isMiniProgram) {
    const uploadApi = (globalThis as any).wx?.uploadFile || (globalThis as any).uni?.uploadFile;
    if (uploadApi) {
      return new Promise((resolve, reject) => {
        uploadApi({
          url: 'https://upload-z2.qiniup.com',
          filePath: file.path || file,
          name: 'file',
          formData: { token, key },
          success: (res: any) => resolve(JSON.parse(res.data)),
          fail: reject,
        });
      });
    }
  }

  throw new Error('Unsupported environment for upload');
}

/**
 * 单个文件上传流程
 */
async function processSingleUpload(file: any): Promise<ConfirmUploadRequest> {
  const hash = await getFileMD5(file);
  const name = file.name || file.path?.split('/').pop() || 'file';
  const ext = name.includes('.') ? name.split('.').pop() : '';
  const mainKey = `uploads/${hash}${ext ? '.' + ext : ''}`;

  const { token } = await getValidToken();
  const uploadRes = await uploadToQiniu(file, mainKey, token, name);
  const key = uploadRes.key;

  let thumbKey: string | undefined;
  const thumbBlob = await generateThumbnail(file);
  if (thumbBlob) {
    thumbKey = `thumbnails/${hash}_thumb.jpg`;
    await uploadToQiniu(thumbBlob, thumbKey, token, `thumb_${name}`);
  }

  return {
    name,
    url: key,
    thumb_url: thumbKey,
    size: file.size || 0,
    type: file.type || 'application/octet-stream',
    hash,
  };
}

/**
 * 全局通用上传工具
 * 支持 Web（File 对象）和小程序（文件信息对象）
 */
export async function uploadFiles(files: any | any[]): Promise<ResourceResponse[]> {
  const fileList = Array.isArray(files) ? files : [files];
  if (fileList.length === 0) return [];

  const uploadTasks = fileList.map(async (file) => {
    try {
      return await processSingleUpload(file);
    } catch (error) {
      console.error('Upload failed:', error);
      if (isWeb) Message.error('上传失败');
      throw error;
    }
  });

  const confirmPayloads = await Promise.all(uploadTasks);

  try {
    const response = await request.post('/api/v1/storage/confirm-upload', confirmPayloads);
    return response.data.data;
  } catch (error) {
    if (isWeb) Message.error('上传确认失败，请重试');
    throw error;
  }
}
