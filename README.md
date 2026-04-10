# Hope Admin (My Admin)

基于 React 18 + Vite + TypeScript 构建的现代化后台管理系统。

## 🛠️ 技术栈

- **框架**：[React 18](https://react.dev/)
- **构建工具**：[Vite 8](https://cn.vitejs.dev/)
- **开发语言**：[TypeScript](https://www.typescriptlang.org/)
- **UI 组件库**：[Arco Design React](https://arco.design/react/docs/start)
- **路由**：[React Router v7](https://reactrouter.com/)
- **状态管理**：[Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **网络请求**：[Axios](https://axios-http.com/)
- **样式处理**：Less

## 📁 项目结构

```text
├── public              # 静态资源
├── src                 # 源代码
│   ├── api             # 接口请求中心 (auth/role/user)
│   ├── assets          # 静态资源 (图片/字体等)
│   ├── components      # 公共组件 (Auth/Layout/ProtectedRoute)
│   ├── config          # 全局配置
│   ├── hooks           # 自定义 Hooks
│   ├── pages           # 页面视图 (Login/Apps/System)
│   ├── router          # 路由配置
│   ├── store           # 状态管理 (useUserStore)
│   ├── types           # 全局 TypeScript 类型定义
│   ├── utils           # 工具函数 (请求封装等)
│   ├── index.css       # 全局样式
│   └── main.tsx        # 项目入口文件
├── DEV-RULE.md         # 开发规范说明
├── eslint.config.js    # ESLint 配置
├── package.json        # 项目依赖及 scripts
├── tsconfig.json       # TypeScript 配置
└── vite.config.ts      # Vite 配置
```

## 🚀 快速开始

### 1. 环境准备

确保本地环境已安装 Node.js (建议 v18 及以上版本)。

### 2. 安装依赖

```bash
npm install
```

### 3. 本地开发跑测

```bash
npm run dev
```

### 4. 生产环境构建

```bash
npm run build
```

## 📜 命令说明

- `npm run dev`：启动本地开发服务器并支持 HMR。
- `npm run build`：执行 TypeScript 类型检查并进行 Vite 生产构建。
- `npm run preview`：本地预览 `dist` 构建产物。
- `npm run lint`：运行 ESLint 检查代码格式。

## 💡 开发说明

- 所有的请求接口存放于 `src/api`，并且依赖于 `src/utils/request.ts` 封装的 Axios 实例。
- 页面按功能模块划分在 `src/pages` 中，如系统管理相关的用户和角色页面位于 `System` 目录下。
- 状态管理工具采用更轻量的 `Zustand`，使用 Hooks 的方式暴露于 `src/store`。

---

## 📖 详细开发规范架构说明

本项目采用了**“基建全局化，业务模块化”**的架构设计思想。为了保证代码的长期可维护性和高内聚，我们设立了专门的开发规范文档。

以下是核心的架构与开发规范指南（完整内容也可参考工作区中的 `DEV-RULE.md`）：

<details>
<summary><b>点击展开查看完整多项目管理后台架构设计与开发规范</b></summary>

# 多项目管理后台架构设计与开发规范

## 1. 项目概述
本项目是一个面向个人多项目管理的轻量级后台系统。采用**“基建全局化，业务模块化”**的架构思想，系统分为“全局公共层（Common）”与“独立应用层（Apps/Projects）”。具备多角色权限控制功能，支持超级管理员分配权限。

## 2. 技术栈选型
*   **构建工具**: Vite (极速构建)
*   **核心框架**: React 18 + TypeScript
*   **路由管理**: React Router v6
*   **状态管理**: Zustand (轻量、无样板代码)
*   **网络请求**: Axios
*   **UI 框架**: Arco Design (字节跳动开源，轻量、美观、全面)

---

## 3. 核心设计思想

### 3.1 领域驱动与高内聚
采用按功能模块划分的目录结构。每个独立子项目（App A, App B）作为一个独立的“微型前端”存在于自己的文件夹中，包含该项目专属的 API、组件和类型定义。

### 3.2 严格的单向依赖原则（核心限制）
为了防止代码变成“意大利面条”，必须严格遵守以下依赖隔离规则：
1.  **内部依赖外部（允许）**：子应用（App A）**可以**且应该依赖外部的全局公共基建（如登录状态、全局组件、请求工具）。
2.  **应用间绝对隔离（禁止）**：App A **绝对不可以**引用 App B 目录下的任何文件。如果两个应用需要共享某段逻辑，必须将该逻辑抽离提升到全局公共层（Common）。
3.  **外部不可依赖内部（禁止）**：全局公共层（Common/基建层）**绝对不可以**引用子应用（App A/B）内的任何文件。

---

## 4. 目录结构规范

```text
src/
├── api/              # [全局基建] 全局 API (如登录 login.ts, 用户信息 user.ts)
├── assets/           # [全局基建] 全局静态资源 (logo, global.css)
├── components/       # [全局基建] 全局公共组件 (如 Layout, 权限 Wrapper, 封装的 Table)
├── hooks/            # [全局基建] 全局 Hooks (如 useAuth)
├── router/           # [全局基建] 路由配置中心 (拦截器、路由表)
├── store/            # [全局基建] 全局状态 (Zustand: 用户信息、权限菜单)
├── types/            # [全局基建] 全局 TS 类型 (User, Role 等)
├── utils/            # [全局基建] 全局工具类 (request.ts, format.ts)
│
└── pages/            # [视图层] 页面级别的代码
    ├── Login/        # 全局公共页面：登录
    ├── System/       # 全局公共页面：系统管理 (超管分配权限)
    │
    └── Apps/         # 【独立应用层】(所有的业务子项目放在这里)
        ├── AppA/                 # ---------------- 应用 A 作用域 ----------------
        │   ├── api.ts            # 仅 AppA 使用的请求接口
        │   ├── types.ts          # 仅 AppA 使用的类型声明
        │   ├── components/       # 仅 AppA 使用的局部组件
        │   └── index.tsx         # AppA 入口页面
        │
        └── AppB/                 # ---------------- 应用 B 作用域 ----------------
            ├── api.ts            # 仅 AppB 使用的请求接口
            └── index.tsx         # AppB 入口页面
```

---

## 5. 开发规范与技术限制

### 5.1 导入路径规范 (Import Rules)
通过 Vite 和 TS 配置路径别名 `@` 指向 `src` 目录。
*   **子应用引用全局**：`import { request } from '@/utils/request'` (推荐)
*   **禁止的引用方式 (需在 Code Review 时严格检查)**：
    *   ❌ `import { something } from '@/pages/Apps/AppB/api'` (在 AppA 中)
    *   ❌ `import { AppAType } from '@/pages/Apps/AppA/types'` (在全局 utils 中)

### 5.2 API 与请求规范
1.  **全局请求实例**：在 `@/utils/request.ts` 中统一封装 Axios，处理 Token 注入、统一报错提示（如 401 退出登录）。
2.  **业务接口隔离**：App A 的接口全部写在 `src/pages/Apps/AppA/api.ts` 中，使用全局的 axios 实例发起请求。
    ```typescript
    // src/pages/Apps/AppA/api.ts
    import request from '@/utils/request'; // 允许引用全局基建
    import { AppAData } from './types';    // 引用自身的局部类型

    export const getAppAList = () => request.get<AppAData[]>('/api/app-a/list');
    ```

### 5.3 状态管理规范 (Zustand)
1.  **全局状态 (`@/store`)**：只存放跨级严重的数据，如：**Token、当前登录用户信息、系统主题、全局侧边栏折叠状态**。
2.  **局部状态**：App A 内部的状态，优先使用 React 自带的 `useState` 或 `useReducer`。如果 App A 内部非常复杂，可以在 AppA 目录下建一个自己的 `store.ts`，但**绝不暴露给外部**。

### 5.4 组件复用提取法则（Rule of Three）
在独立应用层开发时，遵循“事不过三”原则：
*   当一个业务组件（如特殊的筛选表单）只在 App A 中用，放在 `AppA/components/`。
*   当 App B 也要用这个组件时，不要从 App A 引入，而是将该组件**移动并重构**到全局 `@/components/` 目录下，供全局使用。

---

## 6. 多角色权限控制规范

权限控制分为**路由级**和**按钮级**，全部依赖 `@/store/useUserStore` 中的 `role` 字段。

### 6.1 路由权限 (页面级拦截)
在 `@/router/index.tsx` 中，利用 `React.lazy` 实现子应用的**按需加载**，并结合 `ProtectedRoute` 鉴权。

```tsx
// 示例伪代码
import { lazy, Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

const AppA = lazy(() => import('@/pages/Apps/AppA'));

const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      // 1. 普通登录即可访问的应用
      {
        element: <ProtectedRoute />, 
        children: [{ path: 'app-a', element: <Suspense><AppA /></Suspense> }]
      },
      // 2. 仅超级管理员可见的系统设置
      {
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
        children: [{ path: 'system/users', element: <UserManage /> }]
      }
    ]
  }
];
```

### 6.2 按钮权限 (交互级拦截)
对于页面内的操作（如“删除”按钮），统一使用全局基建提供的 `<Auth />` 包装组件。

```tsx
import { Auth } from '@/components/Auth';
import { Button } from '@arco-design/web-react';

export default function AppAIndex() {
  return (
    <div>
      <h1>应用 A 总览</h1>
      
      {/* 普通人看不见，只有超管能看见这个按钮 */}
      <Auth allowedRoles={['SUPER_ADMIN']}>
        <Button status="danger">危险操作：格式化项目A</Button>
      </Auth>
    </div>
  );
}
```

## 7. 总结
本规范的核心在于**“克制”**。
通过**物理目录的隔离**和**严格的依赖方向限制**，确保每个 `App` 都是一个即插即用的沙盒。只要坚持“外部基建不关心内部业务，内部业务互不干涉”的原则，这个后台系统即使未来增加到 50 个项目，依然能保持初创时期的清晰和轻巧。

</details>

