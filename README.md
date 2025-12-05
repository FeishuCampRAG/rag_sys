# RAG 知识库演示系统

一个包含前端与后端的端到端 Retrieval-Augmented Generation（RAG）演示项目。前端提供对话体验与知识库管理界面，后端负责会话管理、文档检索、引用持久化以及与大模型的流式通信。

## 功能总览

- **对话体验**：多会话管理、消息流式展示、引用卡片预览。
- **RAG 流程跟踪**：实时展示 Embedding、检索、Prompt 组装与答案生成四个阶段。
- **知识库管理**：文档批量上传、状态轮询、片段预览、向量化进度弹窗。
- **引用持久化**：刷新页面或切换路由后仍能保留 AI 回答中的引用信息与消息条数统计。
- **响应式布局**：针对桌面端与小屏设备的三栏布局、滚动行为与禁用态体验优化。

## 目录结构

```
├── backend/            # Node.js + Express 服务，使用 SQLite 持久化
├── frontend/           # React + Vite + Tailwind 前端应用
├── mock-data/          # 示例文档
├── start.sh            # 同时启动前后端的便捷脚本（可选）
└── README.md
```

## 环境要求

- Node.js 18+
- npm 9+
- SQLite（本项目通过 `better-sqlite3` 嵌入，无需额外安装）

## 快速开始

1. **克隆仓库并安装依赖**
   ```bash
   git clone <repo-url>
   cd rag_sys
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. **配置后端环境变量**
   在 `backend/.env` 中设置以下配置（示例）：
   ```env
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_API_KEY=sk-xxx
   EMBEDDING_MODEL=text-embedding-ada-002
   CHAT_MODEL=gpt-4o-mini
   PORT=3001
   ```
   > 建议不要提交真实密钥，可使用 `.env.local` 或 CI 注入方式管理。

3. **启动服务**
   - 后端：
     ```bash
     cd backend
     npm run dev
     ```
   - 前端：
     ```bash
     cd frontend
     npm run dev
     ```
   默认前端运行在 <http://localhost:5173>，后端监听 `PORT`（默认 3001）。前端通过 `/api` 代理访问后端，若端口调整需同步修改 `frontend/vite.config.js` 中的代理配置。

4. **一键启动（可选）**
   ```bash
   ./start.sh
   ```
   脚本会并行启动前后端进程（依赖 `npm-run-all`）。

## 常用脚本

| 位置      | 命令                | 说明                 |
|-----------|---------------------|----------------------|
| backend   | `npm run dev`       | 监听模式启动服务     |
| backend   | `npm run build`     | TypeScript 编译      |
| backend   | `npm start`         | 运行已编译产物       |
| frontend  | `npm run dev`       | Vite 开发服务器      |
| frontend  | `npm run build`     | 构建生产资源         |
| frontend  | `npm run preview`   | 本地预览构建结果     |

## 关键设计亮点

- **流式聊天**：前端使用 `fetch` + ReadableStream 手动解析 SSE，实时推送 token；后端对接 OpenAI Responses/Chat Completions 并逐 token 推送。
- **引用持久化**：后端以 `message_references` 表保存引用信息，并在刷新或路由切换后重建引用卡片。
- **多会话一致性**：会话列表会缓存活跃会话的消息，重新进入时无需重复拉取；非活跃会话展示后端统计的消息条数。
- **响应式体验**：在小屏幕下采用标签式导航；聊天区、RAG 流程与文档列表均使用内部滚动，避免整体页面高度失控。

## 调试与排错

- 构建检查：`npm run build --prefix frontend` 与 `npm run build --prefix backend` 可验证类型与编译是否通过。
- 数据库初始化文件位于 `backend/data/rag.db`，删除即可重置存量数据。
- 若上传卡住，请检查 `.env` 中的 OpenAI 配置或查看控制台日志。

## 后续可扩展方向

- 接入向量数据库（如 Milvus、Qdrant）替换本地向量文件。
- 引入用户鉴权与操作审计。
- 丰富引用卡片，支持跳转到知识库原文位置。
- 补充单元测试与端到端自动化回归。

欢迎提交 Issue 或 PR 以帮助完善该演示系统。 🙌
