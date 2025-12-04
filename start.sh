#!/bin/bash

# RAG Demo 一键启动脚本
# 每次启动会清空数据并导入Mock简历

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
MOCK_DATA_DIR="$SCRIPT_DIR/mock-data"
DATA_DIR="$BACKEND_DIR/data"

echo "========================================"
echo "    RAG 知识库演示系统 - 启动脚本"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 请先安装 Node.js >= 18"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "错误: Node.js 版本需要 >= 18，当前版本: $(node -v)"
    exit 1
fi

echo "✓ Node.js 版本检查通过: $(node -v)"
echo ""

# 清理旧数据
echo ">>> 清理旧数据..."
rm -rf "$DATA_DIR"
mkdir -p "$DATA_DIR/uploads"
echo "✓ 数据目录已清空"
echo ""

# 安装后端依赖
echo ">>> 安装后端依赖..."
cd "$BACKEND_DIR"
npm install --silent
echo "✓ 后端依赖安装完成"
echo ""

# 安装前端依赖
echo ">>> 安装前端依赖..."
cd "$FRONTEND_DIR"
npm install --silent
echo "✓ 前端依赖安装完成"
echo ""

# 启动后端服务
echo ">>> 启动后端服务..."
cd "$BACKEND_DIR"
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!
echo "✓ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
echo ">>> 等待后端服务就绪..."
sleep 3

# 检查后端是否启动成功
if ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "警告: 后端服务可能还在启动中，继续等待..."
    sleep 3
fi
echo "✓ 后端服务已就绪"
echo ""

# 导入Mock数据
echo ">>> 导入Mock简历数据..."
for file in "$MOCK_DATA_DIR"/*.txt; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "   上传: $filename"
        curl -s -X POST http://localhost:3001/api/documents/upload \
            -F "file=@$file" > /dev/null 2>&1
        sleep 1
    fi
done
echo "✓ 6份简历已导入知识库"
echo ""

# 等待向量化完成
echo ">>> 等待文档向量化完成..."
sleep 8
echo "✓ 向量化处理完成"
echo ""

# 启动前端服务
echo ">>> 启动前端服务..."
cd "$FRONTEND_DIR"
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "✓ 前端服务已启动 (PID: $FRONTEND_PID)"
sleep 2
echo ""

# 保存PID供后续关闭使用
echo "$BACKEND_PID" > "$SCRIPT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"

echo "========================================"
echo "    RAG Demo 启动成功!"
echo "========================================"
echo ""
echo "  前端地址: http://localhost:5173"
echo "  后端地址: http://localhost:3001"
echo ""
echo "  已导入的简历:"
echo "    - 张三 (高级Java工程师, 8年经验)"
echo "    - 李四 (前端开发工程师, 5年经验)"
echo "    - 王五 (产品经理, 6年经验)"
echo "    - 赵六 (数据分析师, 4年经验)"
echo "    - 钱七 (运维工程师, 6年经验)"
echo "    - 孙八 (UI设计师, 4年经验)"
echo ""
echo "  示例问题:"
echo "    - 谁有最多年的工作经验？"
echo "    - 张三擅长什么技术？"
echo "    - 哪位候选人适合做前端开发？"
echo "    - 列出所有产品经理的工作经历"
echo ""
echo "  按 Ctrl+C 停止服务"
echo ""

# 等待用户中断
cleanup() {
    echo ""
    echo ">>> 正在停止服务..."
    if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
        kill $(cat "$SCRIPT_DIR/.backend.pid") 2>/dev/null || true
        rm "$SCRIPT_DIR/.backend.pid"
    fi
    if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
        kill $(cat "$SCRIPT_DIR/.frontend.pid") 2>/dev/null || true
        rm "$SCRIPT_DIR/.frontend.pid"
    fi
    # 确保所有相关进程都被终止
    pkill -f "node.*rag-sys/backend" 2>/dev/null || true
    pkill -f "node.*rag-sys/frontend" 2>/dev/null || true
    echo "✓ 服务已停止"
    exit 0
}

trap cleanup INT TERM

# 保持脚本运行
wait
