import request from '@/utils/request';
import type { ApiResponse } from '@/types';

export interface AdminUserListItem {
  id: number;
  nickname?: string;
  username?: string;
  phone?: string;
  openid?: string;
  source: string;
  is_active: boolean;
  roles: any[];
  created_at: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export const getUsersApi = (params: { page: number; size: number }) => {
  return request.get<ApiResponse<PaginatedData<AdminUserListItem>>>('/api/v1/admin/users', { params });
};

export const freezeUserApi = (userId: number, is_active: boolean) => {
  return request.patch<ApiResponse<any>>(`/api/v1/admin/users/${userId}/freeze`, { is_active });
};

export const assignUserRolesApi = (userId: number, role_ids: number[]) => {
  return request.put<ApiResponse<any>>(`/api/v1/admin/users/${userId}/roles`, { role_ids });
};
