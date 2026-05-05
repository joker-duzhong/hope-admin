import { systemModule } from '@/projects/system/router';
import { timelibraryModule } from '@/projects/timelibrary/router';
import type { AppModule } from '@/core/types/module';

/**
 * 全局模块注册表
 *
 * 新增业务应用时，只需在此处 import 对应模块并追加到数组即可。
 * Layout 会自动聚合菜单，router 会自动挂载路由。
 */
export const appModules: AppModule[] = [
  timelibraryModule,
  systemModule,
];
