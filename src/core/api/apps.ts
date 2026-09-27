import request from '@/core/utils/request';
import type { ApiResponse } from '@/core/types';

export interface AppCatalogItem {
  key: string;
  name: string;
  is_active: boolean;
}

/** 获取后端注册的应用目录及启用状态。 */
export const getAppCatalogApi = () => {
  return request.get<ApiResponse<AppCatalogItem[]>>('/api/v1/admin/apps');
};
