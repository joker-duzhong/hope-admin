import request from '@/core/utils/request';
import type { ApiResponse } from '@/core/types';

export interface AdminUserListItem {
  id: string | number;
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

export interface UserUpdateParams {
  nickname?: string;
  avatar_url?: string;
  phone?: string;
}

export const updateUserApi = (userId: string | number, data: UserUpdateParams) => {
  return request.patch<ApiResponse<any>>(`/api/v1/admin/users/${userId}`, data);
};

export interface UserListParams {
  page?: number;
  size?: number;
  keyword?: string;
  is_active?: boolean;
  role_code?: string;
  source?: string;
}

export const getUsersApi = (params: UserListParams) => {
  return request.get<ApiResponse<PaginatedData<AdminUserListItem>>>('/api/v1/admin/users', { params });
};

export const freezeUserApi = (userId: string | number, is_active: boolean) => {
  return request.patch<ApiResponse<any>>(`/api/v1/admin/users/${userId}/freeze`, { is_active });
};

export const assignUserRolesApi = (userId: string | number, role_ids: number[]) => {
  return request.put<ApiResponse<any>>(`/api/v1/admin/users/${userId}/roles`, { role_ids });
};
