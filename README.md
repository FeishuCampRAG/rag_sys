# RAG 演示系统

一个包含前端与后端的端到端 Retrieval-Augmented Generation (RAG) 演示项目。前端提供对话体验与知识库管理界面，后端负责会话管理、文档检索、引用持久化及与大模型的串流通信。

## 功能概览

- **对话体验**：多会话管理、消息串流展示、引用高亮与预览。
- **RAG 过程跟踪**：实时展示 Embedding、检索、Prompt 组装与生成步骤。
- **知识库管理**：文档上传、状态监控、片段预览、处理进度提示。
- **引用留存**：对话刷新或路由切换后仍能保留 AI 回答引用信息与消息条数。
- **响应式布局**：针对桌面与移动端的三栏布局与滚动体验优化。

## 项目结构

```
├── backend/          # Node.js/Express 服务，SQLite 存储
├── frontend/         # React + Vite + Tailwind 前端应用
├── mock-data/        # 示例文档
├── start.sh          # 简易启动脚本（同时启动前后端）
└── README.md
```

## 环境要求

- Node.js 18+
- npm 9+
- SQLite（随 better-sqlite3 一并管理，无需额外安装）

## 快速开始

### 1. 克隆并安装依赖

```bash
git clone <repo-url>
cd rag_sys
npm install --prefix backend
npm install --prefix frontend
```

### 2. 配置后端环境变量

在 `backend/.env` 中配置以下变量（示例）：

```
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-xxx
EMBEDDING_MODEL=text-embedding-ada-002
CHAT_MODEL=gpt-4o
PORT=3001
```

> 建议不要直接提交真实密钥，可使用 `.env.local` 或 CI 注入方式管理。

### 3. 启动服务

后端：

```bash
cd backend
npm run dev
```

前端：

```bash
cd frontend
npm run dev
```

默认前端运行在 <http://localhost:5173>，后端监听 `PORT`（默认 3001）。前端通过 `/api` 代理访问后端接口，如使用不同端口需在 `frontend/vite.config.js` 中调整代理。

### 一键启动（可选）

```bash
./start.sh
```

脚本会并行启动前后端进程（依赖 `npm-run-all` 内置指令）。

## 主要开发脚本

| 位置      | 指令            | 说明               |
|-----------|-----------------|--------------------|
| backend   | `npm run dev`   | 监听模式启动服务   |
| backend   | `npm run build` | TypeScript 编译    |
| backend   | `npm start`     | 运行编译后的产物   |
| frontend  | `npm run dev`   | Vite 开发服务器    |
| frontend  | `npm run build` | 产出静态资源       |
| frontend  | `npm run preview` | 预览打包结果     |

## 关键资料

- 后端使用 `better-sqlite3` 持久化文档、向量检索结果与会话消息。
- 前端状态管理基于 `zustand`，引用展示逻辑位于 `frontend/src/components/chat/MessageItem.tsx`。
- RAG 步骤流程面板位于 `frontend/src/components/rag/RAGProcessPanel.tsx`。

## 后续可拓展方向

- 接入真实向量数据库或检索引擎（如 Milvus、Qdrant）。
- 增加用户鉴权与权限控制。
- 扩展引用卡片为可跳转到知识库文档详情。
- 引入单元测试与 E2E 测试编排。

欢迎提交 Issue 或 PR 来改进该演示系统！***
