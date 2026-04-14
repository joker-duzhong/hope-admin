import request from '@/utils/request';
import type { ApiResponse, Role } from '@/types';

export interface RoleResponse extends Role {
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleCreate {
  scope?: string;
  name: string;
  code: string;
  description?: string;
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export const getRolesApi = () => {
  return request.get<ApiResponse<RoleResponse[]>>('/api/v1/admin/roles');
};

export const createRoleApi = (data: RoleCreate) => {
  return request.post<ApiResponse<RoleResponse>>('/api/v1/admin/roles', data);
};

export const updateRoleApi = (roleId: string | number, data: RoleUpdate) => {
  return request.put<ApiResponse<RoleResponse>>(`/api/v1/admin/roles/${roleId}`, data);
};

export const deleteRoleApi = (roleId: string | number) => {
  return request.delete<ApiResponse<any>>(`/api/v1/admin/roles/${roleId}`);
};
