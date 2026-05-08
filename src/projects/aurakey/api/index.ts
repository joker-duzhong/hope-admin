import request from "@/core/utils/request";
import type { ApiResponse } from "@/core/types";
import type {
  AurakeyAdminAdjustBalancePayload,
  AurakeyAdminAdjustBalanceResult,
  AurakeyAdminGalleryCategory,
  AurakeyAdminGalleryCategoryPayload,
  AurakeyAdminMutationResult,
  AurakeyAdminOptionModel,
  AurakeyAdminOptionModelPayload,
  AurakeyAdminOptionRatio,
  AurakeyAdminOptionRatioPayload,
  AurakeyAdminRefundPayload,
  AurakeyAdminRefundResult,
  AurakeyAdminStats,
  AurakeyAdminUserStatusPayload,
  AurakeyAdminUserStatusResult,
  AurakeyGalleryListResponse,
  AurakeyProduct,
  AurakeyProductCreatePayload,
  AurakeyProductUpdatePayload,
} from "../types";

const versionV1 = "/api/v1";
const baseURL = `${versionV1}/aurakey`;
const adminBase = `${baseURL}/admin`;

export const getAurakeyDashboardStats = () => {
  return request.get<ApiResponse<AurakeyAdminStats>>(`${adminBase}/dashboard/stats`);
};

export const adjustAurakeyUserBalance = (payload: AurakeyAdminAdjustBalancePayload) => {
  return request.post<ApiResponse<AurakeyAdminAdjustBalanceResult>>(`${adminBase}/user/adjust-balance`, payload);
};

export const updateAurakeyUserStatus = (userId: string, payload: AurakeyAdminUserStatusPayload) => {
  return request.put<ApiResponse<AurakeyAdminUserStatusResult>>(`${adminBase}/user/${userId}/status`, payload);
};

export const refundAurakeyOrder = (orderNo: string, payload: AurakeyAdminRefundPayload) => {
  return request.post<ApiResponse<AurakeyAdminRefundResult>>(`${adminBase}/order/${orderNo}/refund`, payload);
};

export const getAurakeyGalleryCategories = () => {
  return request.get<ApiResponse<AurakeyAdminGalleryCategory[]>>(`${baseURL}/gallery/categories`);
};

export const createAurakeyGalleryCategory = (payload: AurakeyAdminGalleryCategoryPayload) => {
  return request.post<ApiResponse<AurakeyAdminMutationResult>>(`${adminBase}/gallery/categories`, payload);
};

export const getAurakeyOptionModels = () => {
  return request.get<ApiResponse<AurakeyAdminOptionModel[]>>(`${adminBase}/task/options/models`);
};

export const createAurakeyOptionModel = (payload: AurakeyAdminOptionModelPayload) => {
  return request.post<ApiResponse<AurakeyAdminMutationResult>>(`${adminBase}/task/options/models`, payload);
};

export const getAurakeyOptionRatios = () => {
  return request.get<ApiResponse<AurakeyAdminOptionRatio[]>>(`${adminBase}/task/options/ratios`);
};

export const createAurakeyOptionRatio = (payload: AurakeyAdminOptionRatioPayload) => {
  return request.post<ApiResponse<AurakeyAdminMutationResult>>(`${adminBase}/task/options/ratios`, payload);
};

// ============ C\u7aef API \u51fd\u6570 ============

const clientBase = "/api/v1/aurakey";

export const getAurakeyGalleryList = (page: number = 1, pageSize: number = 20) => {
  return request.get<ApiResponse<AurakeyGalleryListResponse>>(`${clientBase}/gallery/list`, {
    params: { page, pageSize },
  });
};

export const getAurakeyProducts = () => {
  return request.get<ApiResponse<AurakeyProduct[]>>(`${clientBase}/products`);
};

// ============ 产品管理接口 ============

export const createAurakeyProduct = (payload: AurakeyProductCreatePayload) => {
  return request.post<ApiResponse<AurakeyAdminMutationResult>>(`${adminBase}/products`, payload);
};

export const updateAurakeyProduct = (id: string, payload: AurakeyProductUpdatePayload) => {
  return request.put<ApiResponse<AurakeyAdminMutationResult>>(`${adminBase}/products/${id}`, payload);
};

export const deleteAurakeyProduct = (id: string) => {
  return request.delete<ApiResponse<AurakeyAdminMutationResult>>(`${adminBase}/products/${id}`);
};
