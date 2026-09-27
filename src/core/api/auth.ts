import axios from 'axios';
import request from '@/core/utils/request';
import { API_BASE_URL, API_TIMEOUT } from '@/core/config';
import type { User, ApiResponse } from '@/core/types';

const authRequest = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

export interface ScanApp {
  app_key: string;
  name: string;
}

export type ScanStatus = 'WAITING_SCAN' | 'PENDING' | 'CONFIRMED' | 'CONSUMED' | 'CANCELLED' | 'EXPIRED';

interface ScanState {
  transaction_id: string;
  status: ScanStatus;
  app?: ScanApp | null;
  expires_at?: string | null;
}

export interface ScanSession extends ScanState {
  poll_token: string;
  poll_interval_seconds: number;
}

export interface ScanPollResponse extends ScanState {
  exchange_code?: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  app_scope: string;
  user: User;
}

export interface PhoneLoginParams {
  phone: string;
  code: string;
  app_key: string;
}

export const createScanSessionApi = (appKey: string, signal?: AbortSignal) => {
  return authRequest.post<ApiResponse<ScanSession>>('/api/v1/auth/scan/sessions', { app_key: appKey }, { signal });
};

export const pollScanSessionApi = (transactionId: string, pollToken: string, signal?: AbortSignal) => {
  return authRequest.get<ApiResponse<ScanPollResponse>>(`/api/v1/auth/scan/sessions/${transactionId}`, {
    headers: { 'X-Scan-Token': pollToken },
    signal,
  });
};

export const exchangeScanSessionApi = (transactionId: string, exchangeCode: string, pollToken: string, signal?: AbortSignal) => {
  return authRequest.post<ApiResponse<LoginResponse>>('/api/v1/auth/scan/exchange', {
    transaction_id: transactionId,
    exchange_code: exchangeCode,
  }, {
    headers: { 'X-Scan-Token': pollToken },
    signal,
  });
};

export const sendSmsCodeApi = (phone: string, signal?: AbortSignal) => {
  return authRequest.post<ApiResponse<{ code: string } | null>>('/api/v1/auth/sms/send', { phone }, { signal });
};

export const phoneLoginApi = (data: PhoneLoginParams, signal?: AbortSignal) => {
  return authRequest.post<ApiResponse<LoginResponse>>('/api/v1/auth/phone/login', data, { signal });
};

export const getMeApi = () => {
  return request.get<ApiResponse<User>>('/api/v1/auth/me');
};

export const getWechatAuthUrlApi = (params: { redirect_uri: string; appid: string; state?: string; scope?: string }) => {
  return authRequest.get<ApiResponse<{ auth_url: string }>>('/api/v1/auth/wechat/url', { params });
};
