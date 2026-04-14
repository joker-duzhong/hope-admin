任务卡片：新增「时空图书馆」业务模块
1. 任务背景
在 src/pages/Apps/ 目录下新增一个独立业务模块 TimeLibrary（时空图书馆管理）。该模块需要实现图书的增删改查、分类管理、状态切换等功能。

2. 核心开发规范（约束条件）
物理隔离：所有业务逻辑（API定义、TS类型、局部组件）必须严格限制在 src/pages/Apps/TimeLibrary/ 目录下。
依赖方向：
    * ✅ 允许引用 @/utils/request、@/components/* (全局组件)、arco-design。
    * ❌ 禁止引用其他业务模块（如 src/pages/Apps/OtherApp/*）。
    * ❌ 禁止在全局 src/api/ 下编写此业务接口。
技术栈：React 18 + TypeScript + Arco Design。
3. 具体 Todo List
第一阶段：基础设施准备
 定义类型声明：在 src/pages/Apps/TimeLibrary/types.ts 中根据 API 文档定义数据结构。
    - 包含 Book 接口：id, title, author, description, category, status(0/1), cover_url, created_at 等。
    - 包含 Category 接口：id, name。
    - 包含 API 响应的基础包装类型。
 封装 API 请求：在 src/pages/Apps/TimeLibrary/api.ts 中定义接口函数：
    - getBooks(params): 获取图书列表（支持分页、搜索、分类筛选）。
    - addBook(data): 新增图书。
    - updateBook(id, data): 修改图书。
    - deleteBook(id): 删除图书。
    - getCategories(): 获取所有分类。
    - updateBookStatus(id, status): 切换图书上架/下架状态。
第二阶段：页面功能实现
 图书列表页主框架：
    - 使用 Arco Design 的 Card 或 Space 布局。
    - 顶部搜索栏：支持按标题模糊搜索，按分类等值筛选。
    - “新增图书”按钮：点击打开抽屉或弹窗。
 数据表格 (Table)：
    - 列定义：封面(图片预览)、标题、作者、分类、创建时间、状态(Switch开关)。
    - 实现分页逻辑。
 表单操作 (Modal/Drawer)：
    - 适配新增和编辑模式。
    - 字段包含：标题(必填)、作者、分类(Select选择器)、描述(Textarea)、封面图地址(Input)。
 状态切换逻辑：
    - 表格内的 Switch 组件在操作时需触发 API，成功后弹出 Message.success，失败时回滚开关状态或刷新列表。
第三阶段：路由注册
 注册菜单与路由：
    - 在 src/router/ 相关配置中增加时空图书馆的路由。
    - 路径：/apps/TimeLibrary。
    - 权限：默认登录可用（或根据需求配置 allowedRoles）。
4. 严谨验收标准 (Acceptance Criteria)
A. 功能正确性
列表展示：进入页面必须自动加载数据，分页切换正常，搜索功能在点击“查询”后能正确过滤结果。
数据联动：新增图书成功后，列表应自动刷新并显示最新数据。
状态变更：点击表格中的“上架/下架”开关，必须调用后端接口，并根据接口返回 code (通常为 200) 提示用户。
删除校验：点击删除按钮需弹出 Popconfirm 确认框，防止误删。
B. 健壮性与交互
加载状态：Table 必须有 loading 属性，在请求未完成前展示加载动画。
空数据处理：当搜索无结果或列表为空时，展示 Arco Design 的 Empty 状态。
错误处理：若后端接口报错（如 500 或 403），应通过全局 request 拦截器或局部 try-catch 弹出错误提示，不能出现页面白屏。
C. 代码质量 (严格审查)
类型安全：代码中禁止出现 any 类型。所有 API 返回值需通过泛型 request.get<T> 约束。
组件拆分：如果 Modal 中的 Form 逻辑超过 80 行，需将其抽离到 src/pages/Apps/TimeLibrary/components/BookForm.tsx。
路径引用：检查 import 语句，确保没有跨模块引用。
性能：切换分页或搜索时，确保没有不必要的重复渲染。
5. API 参考约束（根据文档关键点）
Base URL: 使用环境变量中的基础路径。
Token: 必须自动带在 Header 的 Authorization 中（由全局 request.ts 负责）。
数据结构:
    * 图书状态：0 代表下架，1 代表上架。
    * 图书分类：需调用分类接口动态获取，不能写死在前端。