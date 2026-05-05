# Hope Admin — 项目架构规范 (Architecture Rules)

> **AI 助手使用须知**：在为本项目新增任何功能、模块或应用之前，请先完整阅读本文件。本文件定义了项目的所有架构约束与开发规范，所有代码修改必须严格遵守。

---

## 一、架构总则

本项目采用 **"单一统一入口 + 路由分发 + 独立模块内聚"** 架构。

- **一套 admin 壳**：统一的登录鉴权、Layout 框架、全局工具
- **多个独立业务应用**：每个应用完全自治，放在 `src/projects/<应用名>/` 下
- **无侵入式接入**：新增应用只需在 `src/router/modules.ts` 注册一行，路由和菜单自动生效

---

## 二、目录结构

```
src/
├── core/                        # 全局公共层（所有项目共享）
│   ├── api/                     # 全局接口（auth、user、role）
│   │   ├── auth.ts
│   │   ├── role.ts
│   │   └── user.ts
│   ├── components/              # 全局组件
│   │   ├── Auth.tsx             # 权限包装组件（按角色渲染子内容）
│   │   ├── ProtectedRoute.tsx   # 路由守卫
│   │   └── Layout/
│   │       └── index.tsx        # 主框架（Sider + Header + Outlet，菜单动态聚合）
│   ├── config/
│   │   └── index.ts             # 全局配置（API_BASE_URL、WECHAT_APP_ID 等）
│   ├── store/
│   │   └── useUserStore.ts      # 全局用户状态（token、userInfo、login、logout）
│   ├── types/
│   │   ├── index.ts             # 全局类型（User、Role、ApiResponse）
│   │   └── module.ts            # 模块注册类型（AppModule、MenuMeta）
│   └── utils/
│       ├── request.ts           # axios 封装（全局请求基础设施）
│       └── upload.ts            # 七牛云上传工具（全局共享）
│
├── projects/                    # 所有业务应用目录
│   ├── system/                  # 内置系统管理模块
│   │   ├── router.tsx           # 模块路由 + 菜单 meta 导出
│   │   └── pages/
│   │       ├── Role/
│   │       └── User/
│   │
│   ├── timelibrary/             # 时空图书馆应用
│   │   ├── router.tsx
│   │   ├── api/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   └── index.tsx
│   │   └── components/
│   │       ├── BookForm.tsx
│   │       └── BookDetailViewer.tsx
│   │
│   ├── aurakey/                 # AuraKey 应用（开发中）
│   │   ├── api/
│   │   ├── types/
│   │   ├── pages/
│   │   ├── components/
│   │   └── store/
│   │
│   └── <new-project>/           # 新应用按此结构创建
│
├── pages/
│   └── Login/                   # 登录页（全局 core 页面，不属于任何 project）
│       └── index.tsx
│
└── router/
    ├── modules.ts               # ★ 全局模块注册表（新增应用在此注册）
    └── index.tsx                # 主路由（聚合所有 modules）
```

---

## 三、核心类型定义

```typescript
// src/core/types/module.ts

export interface MenuMeta {
  key: string;        // 路由路径（同时作为 Menu key），如 '/apps/aurakey'
  title: string;      // 菜单显示名称
  icon?: ReactNode;   // 菜单图标
  roles?: string[];   // 允许访问的角色 code 列表（空/undefined = 所有登录用户可见）
}

export interface ModuleMeta {
  key: string;        // 模块分组 key，如 'system'
  title: string;      // 模块分组标题
  icon?: ReactNode;   // 模块分组图标
}

export interface AppModule {
  moduleMeta: ModuleMeta; // 模块分组信息（用于多角色用户的二级菜单）
  routes: RouteObject[];  // React Router 路由配置（包含权限守卫）
  menuMeta: MenuMeta[];   // 该模块的菜单项列表
}
```

---

## 四、新增业务应用的完整步骤

### 第 1 步：创建应用目录

在 `src/projects/` 下创建 `<项目名>/` 文件夹，包含以下子目录：

```
src/projects/<项目名>/
├── router.tsx         # 必须：模块入口，导出 AppModule
├── api/
│   └── index.ts       # 该应用的所有接口
├── types/
│   └── index.ts       # 该应用的所有类型
├── pages/
│   └── index.tsx      # 主页面（可按需增加子页面）
├── components/        # 该应用的私有组件
└── store/             # 该应用的 Zustand store（如有需要）
```

### 第 2 步：编写 router.tsx

```typescript
// src/projects/<项目名>/router.tsx
import { lazy, Suspense } from 'react';
import { Icon } from '@arco-design/web-react/icon';
import ProtectedRoute from '@/core/components/ProtectedRoute';
import type { AppModule } from '@/core/types/module';

const MainPage = lazy(() => import('./pages'));

export const <projectName>Module: AppModule = {
  moduleMeta: {
    key: '<项目名>',
    title: '应用显示名称',
    icon: <Icon />,
  },
  routes: [
    {
      // 若需要特定角色才能访问，传入 allowedRoles
      element: <ProtectedRoute allowedRoles={['ROLE_CODE']} />,
      // 若所有登录用户均可访问，使用无参数的 <ProtectedRoute />
      children: [
        {
          path: 'apps/<项目名>',   // URL 路径，建议全小写
          element: (
            <Suspense fallback={<div>加载中...</div>}>
              <MainPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
  menuMeta: [
    {
      key: '/apps/<项目名>',       // 与路由 path 对应，以 / 开头
      title: '应用显示名称',
      icon: <Icon />,
      roles: ['ROLE_CODE'],       // 与 ProtectedRoute 的 allowedRoles 保持一致
    },
  ],
};
```

### 第 3 步：在模块注册表中注册

```typescript
// src/router/modules.ts — 仅需在此加一行
import { <projectName>Module } from '@/projects/<项目名>/router';
import type { AppModule } from '@/core/types/module';

export const appModules: AppModule[] = [
  timelibraryModule,
  systemModule,
  <projectName>Module,   // ← 追加这一行即可
];
```

**完成！** 无需修改 `Layout`、`router/index.tsx` 或任何其他文件。菜单和路由自动生效。

---

## 五、依赖方向规则（强制）

```
✅ 允许的引用方向：
  project/* → core/*          (项目层 → 核心层)
  project/* → @arco-design    (项目层 → UI 库)
  core/components/Layout → router/modules  (Layout 读取模块菜单)
  router/* → core/components  (路由层 → 核心组件)
  router/* → projects/*/router (路由层 → 各项目路由)

❌ 绝对禁止：
  core/* → projects/*         (核心层绝不能依赖项目层)
  projects/A/* → projects/B/* (项目间绝不相互引用)
  pages/Login → projects/*    (Login 页面只能引用 core 层)
```

---

## 六、路径别名规范

项目统一使用 `@` 指向 `src/`，通过 `vite.config.ts` + `tsconfig.json` 配置。

| 层级 | 路径示例 |
|------|---------|
| 核心工具 | `@/core/utils/request` |
| 核心 store | `@/core/store/useUserStore` |
| 核心类型 | `@/core/types` |
| 核心 API | `@/core/api/auth` |
| 核心组件 | `@/core/components/ProtectedRoute` |
| 项目内部（同模块内）| 使用相对路径 `../api` `./components/xxx` |
| 跨项目访问 core | `@/core/utils/upload` |

---

## 七、各层编码规范

### core/utils/request.ts
- 全局唯一的 axios 实例，所有接口函数直接 import 使用
- 统一处理 401 → 自动退出登录
- 统一处理其他错误 → Message.error 提示

### core/utils/upload.ts
- 封装七牛云 qiniu-js 上传流程
- 自动处理 Token 缓存与刷新
- 返回类型固定为 `ResourceResponse[]`

### 项目接口层 (api/index.ts)
- 每个接口函数返回 `request.xxx<ApiResponse<T>>(...)` 的 Promise
- 不在接口层做任何错误处理（由 request 拦截器统一处理）

### 项目类型层 (types/index.ts)
- 只定义该应用私有的数据结构
- 通用类型（User、Role、ApiResponse）从 `@/core/types` 引用，不在项目层重复定义

### 路由模块 (router.tsx)
- 每个模块的 `routes` 数组中必须包含对应的 `<ProtectedRoute>` 守卫
- 路由 `path` 规范：`apps/<项目名>` 格式，**全小写，无大写字母**
- `menuMeta.key` 必须与路由 `path` 一致（加前缀 `/`）
- `moduleMeta` 必填，用于在多角色用户侧边栏中进行分组展示

### Layout 菜单策略 (core/components/Layout)
- 自动根据登录用户角色数切换菜单展示：
  - 单角色用户：所有菜单项平铺展示
  - 多角色用户：按模块分组展示为二级菜单
- `SUPER_ADMIN` 必须视为多角色用户（即使其角色数组长度为 1，也使用二级菜单）
- 菜单项展示仍必须遵守 `menuMeta.roles` 的权限过滤

### 视图层 (pages/)
- 统一使用 Arco Design 组件库
- 页面组件通过 `lazy()` 懒加载（已在 router.tsx 中处理）
- 不在页面层直接调用 `window.location.href`，使用 `react-router-dom` 的 `useNavigate`

---

## 八、角色权限体系

| 角色 Code | 说明 |
|-----------|------|
| `SUPER_ADMIN` | 超级管理员，可访问系统管理（用户/角色） |
| （其他业务角色） | 由各应用自行定义，通过 `menuMeta.roles` 和 `ProtectedRoute.allowedRoles` 控制 |

使用方式：
```tsx
// 路由级权限（整页保护）
<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />

// 组件级权限（局部按钮/区块）
import { Auth } from '@/core/components/Auth';
<Auth allowedRoles={['SUPER_ADMIN']}>
  <Button>仅管理员可见</Button>
</Auth>
```

---

## 九、技术栈版本

| 技术 | 版本 |
|------|------|
| React | 18.x |
| TypeScript | ~5.9 |
| React Router | v7 |
| Arco Design | ^2.66 |
| Zustand | ^5.x |
| Vite | ^8.x |
| axios | ^1.x |

---

## 十、禁止事项（AI 必须遵守）

1. **禁止**在 `core/` 层之外重复定义 axios 实例或重新封装 request
2. **禁止**在全局 `core/api/` 下编写业务专属接口，业务接口必须在 `projects/<名称>/api/` 下
3. **禁止**在 `Layout/index.tsx` 中硬编码菜单列表，菜单必须通过 `AppModule.menuMeta` 动态注入
4. **禁止**在 `router/index.tsx` 中直接 import 各项目页面组件，必须通过 `appModules` 注册机制
5. **禁止**直接 import `dayjs` 等未在 `package.json` 中声明的库；时间格式化使用原生 `Date` API
6. **禁止**项目间相互引用（`projects/A` 不得引用 `projects/B` 的任何内容）
7. **禁止**路由 path 使用大写字母（Linux 部署大小写敏感会导致 404）
