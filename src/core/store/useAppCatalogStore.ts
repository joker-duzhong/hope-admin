import { create } from 'zustand';
import { getAppCatalogApi, type AppCatalogItem } from '@/core/api/apps';

interface AppCatalogState {
  apps: Record<string, AppCatalogItem>;
  loading: boolean;
  loaded: boolean;
  fetchAppCatalog: () => Promise<void>;
  reset: () => void;
}

export const useAppCatalogStore = create<AppCatalogState>((set, get) => ({
  apps: {},
  loading: false,
  loaded: false,
  fetchAppCatalog: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    try {
      const response = await getAppCatalogApi();
      const items = Array.isArray(response.data.data) ? response.data.data : [];
      set({
        apps: Object.fromEntries(items.map((item) => [item.key, item])),
        loading: false,
        loaded: true,
      });
    } catch {
      // 接口暂不可用时保留静态模块元数据，避免阻断已登录的管理端。
      set({ loading: false, loaded: true });
    }
  },
  reset: () => set({ apps: {}, loading: false, loaded: false }),
}));
