任务卡片（补充）：时空图书馆 - 章节与AI人设管理
1. 任务背景
在现有的 Library 模块（src/pages/Apps/TimeLibrary）图书列表中，为每一本书增加“追加章节内容”和“配置AI人设”的高级操作功能。

2. 具体 Todo List
第四阶段：API 与类型补充
 补充类型声明 (src/pages/Apps/TimeLibrary/types.ts)：
    - 新增 AppendChapterParams 接口：包含如章节标题、章节正文等（具体根据 API 传参推导）。
    - 新增 SetupPersonaParams 接口：包含 AI 人设描述、系统提示词等字段（如 persona_prompt, role_description）。
 补充 API 请求 (src/pages/Apps/TimeLibrary/api.ts)：
    - appendBookChapter(book_id: string|number, data: AppendChapterParams)：对应 POST /api/v1/time_library_admin/books/{book_id}/contents。
    - setupBookPersona(book_id: string|number, data: SetupPersonaParams)：对应 POST /api/v1/time_library_admin/books/{book_id}/persona。
第五阶段：交互与组件开发
 操作列扩展 (src/pages/Apps/TimeLibrary/index.tsx 或列表组件)：
    - 在现有的 Table action (操作) 列中，新增“追加章节”和“配置人设”按钮。
    - 优化建议：若按钮超过 3 个，请使用 Arco Design 的 Dropdown（下拉菜单）将这些高级操作收纳至“更多”中，保持界面清爽。
 开发「追加章节」弹窗组件 (src/pages/Apps/TimeLibrary/components/AppendChapterModal.tsx)：
    - 接收 visible, bookId, onClose, onSuccess 作为 Props。
    - 表单包含：章节标题 (Input, 必填)、章节内容 (Textarea，需设置足够的高度或自适应，必填)。
    - 点击确认后调用 appendBookChapter API。
 开发「配置AI人设」抽屉/弹窗组件 (src/pages/Apps/TimeLibrary/components/SetupPersonaModal.tsx)：
    - 接收 visible, bookId, onClose, onSuccess 作为 Props。
    - 表单包含：人设系统提示词/描述 (Textarea，建议支持稍大篇幅的文本输入)。
    - 点击确认后调用 setupBookPersona API。
3. 严谨验收标准 (边界与防呆处理)
A. 交互与状态约束
防重复提交：在点击弹窗的“确定”按钮后，弹窗必须处于 confirmLoading=true 状态，并且按钮禁用，直到接口返回成功或失败，严禁连续点击导致重复生成章节。
表单重置：无论是取消关闭还是成功提交关闭，重新打开同一个或另一个 book_id 的弹窗时，表单内容必须被彻底清空（或根据需求回显），严防数据串位。
大文本体验：章节内容和 AI 人设通常是大段文本，对应的 Textarea 需配置 autoSize={{ minRows: 4, maxRows: 10 }}（或类似属性），保证文本超出时可以在组件内部滚动，而不是撑爆弹窗。
B. 数据与传参检查
必填项校验：在请求发起前，Arco Design 的 Form 必须拦截空标题或空内容，并给出明确的飘红提示。
精准路由传参：book_id 是 URL Path 参数（books/{book_id}/...），必须确保发起请求时，bookId 能够被正确获取并拼接到请求路径中，不能出现在 Request Body 中（除非文档特殊注明）。
C. 代码质量
局部组件隔离：新增的两个表单组件必须创建在 Library/components/ 文件夹中，严禁将所有代码堆砌在列表主页面 index.tsx 中。
严格类型：组件的 Props 定义必须清晰，如 bookId: number | null，在 bookId 为 null 时拦截请求。无任何 ts-ignore 遗留。> ❌ 消息流出现异常