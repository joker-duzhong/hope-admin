import request from '@/core/utils/request';
import type { ApiResponse } from '@/core/types';
import type { LedgerMateCategory, LedgerMateCategoryPayload } from '../types';

const adminBase = '/api/v1/ledger-mate/admin';

export const getLedgerMateCategories = () =>
  request.get<ApiResponse<LedgerMateCategory[]>>(`${adminBase}/categories`);

export const createLedgerMateCategory = (payload: LedgerMateCategoryPayload) =>
  request.post<ApiResponse<LedgerMateCategory>>(`${adminBase}/categories`, payload);

export const updateLedgerMateCategory = (id: string, payload: Partial<LedgerMateCategoryPayload>) =>
  request.put<ApiResponse<LedgerMateCategory>>(`${adminBase}/categories/${id}`, payload);

export const deleteLedgerMateCategory = (id: string) =>
  request.delete<ApiResponse<null>>(`${adminBase}/categories/${id}`);
