export interface Role {
  id: number;
  name: string;
  code: string;
  scope: string;
}

export interface User {
  id: number;
  nickname?: string;
  avatar?: string;
  openid?: string;
  phone?: string;
  source: string;
  is_active: boolean;
  is_superuser?: boolean;
  roles: Role[];
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
