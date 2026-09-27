export interface Role {
  id: string;
  name: string;
  code: string;
  scope?: string | null;
}

export interface UserAvatar {
  url: string;
  id?: string | null;
  name?: string | null;
  thumb_url?: string | null;
  size?: number | null;
  type?: string | null;
  scope?: string | null;
  hash?: string | null;
  owner?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface User {
  id: string;
  nickname?: string | null;
  username?: string | null;
  email?: string | null;
  avatar?: UserAvatar | null;
  openid?: string | null;
  phone?: string | null;
  source?: string | null;
  is_active?: boolean | null;
  is_superuser?: boolean | null;
  roles: Role[];
  needs_phone_binding: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
