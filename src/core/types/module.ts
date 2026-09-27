import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';

/**
 * 侧边栏菜单项的元数据
 */
export interface MenuMeta {
  /** 路由路径，也作为 Menu 的 key，例如 '/system/users' */
  key: string;
  /** 菜单显示标题 */
  title: string;
  /** 菜单图标（React 节点） */
  icon?: ReactNode;
  /** 允许访问此菜单的角色 code 列表，为空则任意登录用户可见 */
  roles?: string[];
}

/**
 * 模块级菜单元数据（用于多角色用户时的二级菜单分组）
 */
export interface ModuleMeta {
  /** 分组 key（建议全局唯一），例如 'system'、'timelibrary' */
  key: string;
  /** 模块角色所属的业务范围，与统一后台 Token 的应用范围独立 */
  appScope: string;
  /** 仅超级管理员可访问该模块 */
  superuserOnly?: boolean;
  /** 分组显示标题 */
  title: string;
  /** 分组图标 */
  icon?: ReactNode;
  /** 兼容后端返回的应用状态描述；下架判断只使用 is_active */
  status?: string | null;
  /** 后端返回的应用启用状态；false 表示下架 */
  is_active?: boolean | null;
}

export const isModuleOffShelf = ({ is_active }: Pick<ModuleMeta, 'is_active'>) => is_active === false;

/**
 * 每个独立业务模块的注册结构
 * - routes: 挂载到主路由的子路由配置（包含各自的权限守卫）
 * - menuMeta: 该模块在侧边栏中显示的菜单项列表
 */
export interface AppModule {
  moduleMeta: ModuleMeta;
  routes: RouteObject[];
  menuMeta: MenuMeta[];
}
