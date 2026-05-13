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

export type AurakeyAdminGalleryPublishStatus = 'approved' | 'blocked';

export interface AurakeyAdminGalleryListParams {
  page?: number;
  pageSize?: number;
  publishStatus?: AurakeyAdminGalleryPublishStatus;
  isPublished?: boolean;
  categoryId?: string;
  userId?: string;
  keyword?: string;
}

export interface AurakeyAdminGalleryUser {
  user_id: string;
  username?: string | null;
  nickname?: string | null;
  avatar?: string | null;
}

export interface AurakeyAdminGalleryItem {
  task_id: string;
  user: AurakeyAdminGalleryUser;
  image_url?: string | null;
  thumb_url?: string | null;
  prompt: string;
  model_name?: string | null;
  aspect_ratio?: string | null;
  status: string;
  cost: number;
  is_published: boolean;
  publish_status: AurakeyAdminGalleryPublishStatus;
  category_id?: string | null;
  like_count: number;
  view_count: number;
  published_at?: number | null;
  created_at?: number | null;
}

export interface AurakeyAdminGalleryListResponse {
  items: AurakeyAdminGalleryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AurakeyAdminGalleryPublishPayload {
  is_published: boolean;
  category_id?: string | null;
}

export interface AurakeyAdminGalleryStatusPayload {
  publish_status: AurakeyAdminGalleryPublishStatus;
}

export interface AurakeyAdminGalleryPublishState {
  task_id: string;
  is_published: boolean;
  publish_status: AurakeyAdminGalleryPublishStatus;
  category_id?: string | null;
  published_at?: number | null;
}

export interface AurakeyAdminGalleryBatchPublishPayload extends AurakeyAdminGalleryPublishPayload {
  task_ids: string[];
}

export interface AurakeyAdminGalleryBatchFailedItem {
  task_id: string;
  reason: string;
}

export interface AurakeyAdminGalleryBatchPublishResponse {
  updated_count: number;
  failed_count: number;
  items: AurakeyAdminGalleryPublishState[];
  failed_items?: AurakeyAdminGalleryBatchFailedItem[];
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

export interface AurakeySystemConfig {
  register_reward_points: number;
  daily_sign_in_reward_points: number;
  invite_reward_points: number;
  default_vip_valid_days: number;
  default_point_pack_valid_days: number | null;
  daily_free_points_reset_hour: number;
  custom: Record<string, unknown>;
}

export interface AurakeySystemConfigUpdatePayload {
  register_reward_points?: number | null;
  daily_sign_in_reward_points?: number | null;
  invite_reward_points?: number | null;
  default_vip_valid_days?: number | null;
  default_point_pack_valid_days?: number | null;
  daily_free_points_reset_hour?: number | null;
  custom?: Record<string, unknown> | null;
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
  vip_type: string | null;
  vip_level: number;
  valid_days: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface AurakeyProductCreatePayload {
  type: AurakeyProductType;
  name: string;
  price: number;
  original_price?: number | null;
  point_amount?: number;
  bonus_amount?: number;
  tag?: string | null;
  vip_type?: string | null;
  vip_level?: number;
  valid_days?: number | null;
}

export interface AurakeyProductUpdatePayload extends AurakeyProductCreatePayload {}

export interface AurakeyProductMutationResult {
  is_success: boolean;
}
