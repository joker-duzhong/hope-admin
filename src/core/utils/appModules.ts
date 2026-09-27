import type { AppModule } from '@/core/types/module';
import type { AppCatalogItem } from '@/core/api/apps';

/** 将后端目录状态覆盖到前端静态模块注册信息。 */
export const mergeAppCatalog = (
  modules: AppModule[],
  catalog: Record<string, AppCatalogItem>,
): AppModule[] => modules.map((module) => {
  const app = catalog[module.moduleMeta.appScope];
  if (!app) return module;
  return {
    ...module,
    moduleMeta: {
      ...module.moduleMeta,
      is_active: app.is_active,
    },
  };
});
