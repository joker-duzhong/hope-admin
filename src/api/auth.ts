import request from '@/utils/request';
import type { User, ApiResponse } from '@/types';

export interface LoginParams {
  username?: string;
  password?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const loginApi = (data: LoginParams) => {
  return request.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', data);
};

export const getMeApi = () => {
  return request.get<ApiResponse<User>>('/api/v1/auth/me');
};

export const getWechatAuthUrlApi = (params: { redirect_uri: string, appid: string, state?: string, scope?: string }) => {
  return request.get<ApiResponse<{ auth_url: string }>>('/api/v1/auth/wechat/url', { params });
};

export const getWechatQrcodeApi = (params: { appid: string }) => {
  return request.get<ApiResponse<{ scene_id: string; qr_url: string }>>('/api/v1/auth/wechat/qrcode', { params });
};

export const getWechatStatusApi = (params: { scene_id: string }) => {
  return request.get<ApiResponse<{ status: 'WAITING' | 'SUCCESS' | 'EXPIRED'; token?: string; userInfo?: any }>>('/api/v1/auth/wechat/status', { params });
};
