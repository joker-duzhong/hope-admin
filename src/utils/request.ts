import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { useUserStore } from '@/store/useUserStore';
import { Message } from '@arco-design/web-react';
import type { ApiResponse } from '@/types';
import { API_BASE_URL, API_TIMEOUT } from '@/config';

const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

// Request interceptor
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useUserStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Handle custom business logic codes here if needed
    // Assuming code 200 or similar means success, but this depends on actual backend
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
      useUserStore.getState().logout();
      if (window.location.pathname !== '/login') {
        Message.error('Token 已过期或无效，请重新登录。');
        window.location.href = '/login';
      }
    } else {
      const data = error.response?.data as any;
      Message.error(data?.message || data?.detail?.[0]?.msg || error.message || '请求错误');
    }
    return Promise.reject(error);
  }
);

export default request;
