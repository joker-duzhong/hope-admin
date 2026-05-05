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
  /** 分组显示标题 */
  title: string;
  /** 分组图标 */
  icon?: ReactNode;
}

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
