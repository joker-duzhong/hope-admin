import axios from 'axios';
import { useEffect, useState } from 'react';
import type { ApiResponse } from '@/core/types';
import { PASSPORT_SCAN_URL } from '@/core/config';

export function responseData<T>(response: ApiResponse<T | null>): T {
  if (response.code !== 200 || response.data == null) {
    throw new Error(response.message && response.message !== 'success' ? response.message : '服务响应异常，请重试');
  }
  return response.data;
}

export function loginError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; detail?: string | { msg?: string }[] }>(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) return data.detail[0].msg;
    return error.response ? fallback : '网络连接失败，请检查网络后重试';
  }
  return error instanceof Error ? error.message : fallback;
}

export function retryDeadline(error: unknown): number {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return 0;
  const header = error.response.headers['retry-after'];
  const seconds = Number(header);
  if (header != null && Number.isFinite(seconds) && seconds > 0) return Date.now() + seconds * 1000;
  const date = typeof header === 'string' ? Date.parse(header) : NaN;
  return Number.isFinite(date) && date > Date.now() ? date : Date.now() + 60_000;
}

export function scanUrl(transactionId: string): string {
  const url = new URL(PASSPORT_SCAN_URL);
  url.searchParams.set('transaction_id', transactionId);
  if (import.meta.env.DEV) url.searchParams.set('env', 'local');
  return url.toString();
}

export function useCountdown(deadline: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
}
