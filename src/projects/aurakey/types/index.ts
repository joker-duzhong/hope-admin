export interface AurakeyAdminStats {
  today_new_users: number;
  today_active_users: number;
  today_generations: number;
  today_revenue: number;
  revenue_growth_rate: number;
}

export interface AurakeyAdminAdjustBalancePayload {
  user_id: string;
  amount: number;
  remark?: string;
}

export interface AurakeyAdminAdjustBalanceResult {
  is_success: boolean;
  balance_after: number;
}

export type AurakeyAdminUserStatus = 'normal' | 'banned';

export interface AurakeyAdminUserStatusPayload {
  status: AurakeyAdminUserStatus;
}

export interface AurakeyAdminUserStatusResult {
  currentStatus: AurakeyAdminUserStatus;
}

export interface AurakeyAdminRefundPayload {
  remark?: string;
}

export interface AurakeyAdminRefundResult {
  is_success: boolean;
  refund_id?: string | null;
  deducted_points: number;
}

export interface AurakeyAdminGalleryCategory {
  id: string;
  name: string;
  sort: number;
}

export interface AurakeyAdminGalleryCategoryPayload {
  name: string;
  sort: number;
}

export type AurakeyAdminOptionStatus = 'on' | 'off';

export interface AurakeyAdminOptionModel {
  id: string;
  model_id: string;
  name: string;
  cost: number;
  is_vip_only: boolean;
  status: AurakeyAdminOptionStatus;
}

export interface AurakeyAdminOptionModelPayload {
  model_id: string;
  name: string;
  cost: number;
  is_vip_only: boolean;
  status: AurakeyAdminOptionStatus;
}

export interface AurakeyAdminOptionRatio {
  id: string;
  ratio: string;
  sort: number;
  status: AurakeyAdminOptionStatus;
}

export interface AurakeyAdminOptionRatioPayload {
  ratio: string;
  sort: number;
  status: AurakeyAdminOptionStatus;
}

export interface AurakeyAdminMutationResult {
  isSuccess?: boolean;
  is_success?: boolean;
}

// ============ C端 API 类型定义 ============

// 画廊相关
export interface AurakeyGalleryAuthor {
  user_id: string;
  nickname: string;
  avatar: string;
}

export interface AurakeyGalleryItem {
  id: string;
  thumb_url: string;
  aspect_ratio: string;
  author: AurakeyGalleryAuthor;
  like_count: number;
  is_liked: boolean;
  view_count: number;
}

export interface AurakeyGalleryListResponse {
  items: AurakeyGalleryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 商品相关
export type AurakeyProductType = 'point_pack' | 'vip';

export interface AurakeyProduct {
  id: string;
  type: AurakeyProductType;
  name: string;
  price: number;
  original_price: number | null;
  point_amount: number;
  bonus_amount: number;
  tag: string | null;
  created_at: string;
  updated_at: string;
}

export interface AurakeyProductCreatePayload {
  type: AurakeyProductType;
  name: string;
  price: number;
  original_price?: number | null;
  point_amount: number;
  bonus_amount: number;
  tag?: string | null;
}

export interface AurakeyProductUpdatePayload extends AurakeyProductCreatePayload {}

export interface AurakeyProductMutationResult {
  is_success: boolean;
}