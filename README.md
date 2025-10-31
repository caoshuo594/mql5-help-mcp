# MQL5 Help MCP Server

[![npm package](https://img.shields.io/npm/v/mql5-help-mcp.svg)](https://npmjs.org/package/mql5-help-mcp)

`mql5-help-mcp` 让你的 AI 编程助手（如 Claude Code、Cursor、Copilot 等）能够直接访问完整的 MQL5 官方文档。它基于 Model Context Protocol (MCP) 协议,为 AI 助手提供 4500+ 份 MQL5 文档的实时查询能力,助力量化交易程序开发。

## 核心功能

- **快速文档搜索**: 通过函数名、类名或关键字秒级查询 MQL5 官方文档
- **完整 API 覆盖**: 包含交易函数、技术指标、标准库、ONNX 机器学习等所有 MQL5 API
- **智能匹配**: 支持精确匹配和模糊搜索,自动处理类名变体（如 CTrade/Trade）
- **分类浏览**: 按功能分类组织文档,快速定位所需 API
- **零配置使用**: 内置文档索引,无需额外下载或配置

## 免责声明

本项目为开源工具,MQL5 文档版权归 MetaQuotes Ltd. 所有。建议将此工具仅用于开发辅助,涉及敏感代码或商业项目时请谨慎使用。

## 系统要求

- [Node.js](https://nodejs.org/) v18.0 或更高版本
- [npm](https://www.npmjs.com/) 包管理器
- 支持 MCP 协议的 AI 编程工具

## 快速开始

### 安装方式 1: NPM 全局安装（推荐）

在你的 MCP 客户端配置文件中添加以下配置：

```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "npx",
      "args": ["-y", "mql5-help-mcp@latest"]
    }
  }
}
```

> **注意**
> 使用 `mql5-help-mcp@latest` 确保始终使用最新版本。

### 安装方式 2: 本地开发模式

```bash
# 克隆或下载项目到本地
cd D:\my-program\mql5_help_mcp

# 安装依赖
npm install

# 编译 TypeScript 源码
npm run build
```

然后在配置文件中使用绝对路径：

```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "node",
      "args": ["D:\\my-program\\mql5_help_mcp\\build\\index.js"]
    }
  }
}
```

> **Windows 用户注意**
> 路径需使用双反斜杠 `\\` 或正斜杠 `/`

## MCP 客户端配置指南

<details>
  <summary>Claude Code</summary>

使用 Claude Code CLI 添加 MQL5 Help MCP 服务器（<a href="https://docs.anthropic.com/en/docs/claude-code/mcp">查看指南</a>）：

```bash
claude mcp add mql5-help npx mql5-help-mcp@latest
```

或手动编辑配置文件 `~/.config/claude/mcp.json`（macOS/Linux）或 `%APPDATA%\Claude\mcp.json`（Windows）：

```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "npx",
      "args": ["-y", "mql5-help-mcp@latest"]
    }
  }
}
```

</details>

<details>
  <summary>Cursor</summary>

**一键安装:**

前往 `Cursor Settings` -> `MCP` -> `New MCP Server`，使用上述标准配置。

或手动配置项目级 MCP 设置：在项目根目录创建 `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "npx",
      "args": ["-y", "mql5-help-mcp@latest"]
    }
  }
}
```

</details>

<details>
  <summary>VS Code Copilot</summary>

按照 <a href="https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server">MCP 安装指南</a>，使用标准配置。或使用 VS Code CLI：

```bash
code --add-mcp '{"name":"mql5-help","command":"npx","args":["mql5-help-mcp@latest"]}'
```

</details>

<details>
  <summary>Gemini CLI</summary>

**项目级安装:**

```bash
gemini mcp add mql5-help npx mql5-help-mcp@latest
```

**全局安装:**

```bash
gemini mcp add -s user mql5-help npx mql5-help-mcp@latest
```

或参考 <a href="https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md">Gemini MCP 指南</a>使用标准配置。

</details>

<details>
  <summary>JetBrains AI Assistant & Junie</summary>

前往 `Settings | Tools | AI Assistant | Model Context Protocol (MCP)` -> `Add`，使用上述标准配置。

JetBrains Junie 配置路径：`Settings | Tools | Junie | MCP Settings` -> `Add`。

</details>

<details>
  <summary>Windsurf</summary>

参考 <a href="https://docs.windsurf.com/windsurf/cascade/mcp#mcp-config-json">Windsurf MCP 配置指南</a>，使用标准配置。

</details>

<details>
  <summary>其他 MCP 客户端</summary>

大多数支持 MCP 的客户端使用统一配置文件位置：

**macOS/Linux:**
```
~/.config/mcp/config.json
```

**Windows:**
```
%APPDATA%\.mcp\config.json
或
%USERPROFILE%\.config\mcp\config.json
```

配置格式参照上述标准配置。

</details>

### 测试你的配置

配置完成后,在 AI 助手中输入以下提示词测试:

```
搜索 MQL5 的 OrderSend 函数用法
```

你的 AI 助手应该能够通过 MCP 服务器查询文档并返回准确的函数说明。

> **注意**
> MCP 服务器在首次调用工具时自动启动,连接 MCP 服务器本身不会立即启动进程。

## 工具列表

本 MCP 服务器提供 3 个工具供 AI 助手使用:

### 1. `search` - 搜索文档

搜索 MQL5 函数名、类名或关键字,返回匹配的文档列表。

**参数:**
- `query` (必需): 搜索关键词,如 "OrderSend", "CopyBuffer", "OnTick"
- `limit` (可选): 返回结果数量,默认 10

**示例提示词:**
```
搜索 MQL5 中所有与订单相关的函数
查找 ONNX 模型相关的文档
```

### 2. `get` - 获取文档详情

读取指定文档的完整内容,包含函数签名、参数说明、返回值和代码示例。

**参数:**
- `filename` (必需): 文档文件名,如 "ordersend.htm" 或 "ordersend"

**示例提示词:**
```
获取 OrderSend 函数的完整文档
查看 CTrade 类的详细说明
```

### 3. `browse` - 浏览分类目录

查看文档的分类组织结构,快速定位相关主题。

**参数:**
- `category` (可选): 分类名称,如 "trading", "indicators", "math" 等

**可用分类:**
- `trading` - 交易函数 (OrderSend, PositionSelect, CTrade 等)
- `indicators` - 技术指标 (iCustom, CopyBuffer, 指标创建)
- `math` - 数学函数 (MathAbs, MathSin, MathRandom 等)
- `array` - 数组操作 (ArrayResize, ArrayCopy, ArraySort 等)
- `string` - 字符串处理 (StringFind, StringSplit, StringReplace 等)
- `datetime` - 日期时间 (TimeCurrent, TimeToStruct, TimeGMT 等)
- `files` - 文件操作 (FileOpen, FileRead, FileWrite 等)
- `chart` - 图表操作 (ChartOpen, ChartRedraw, ChartSetInteger 等)
- `objects` - 图形对象 (ObjectCreate, ObjectDelete, ObjectSet 等)
- `onnx` - **ONNX 机器学习集成** (Python 训练 + MQL5 调用完整指南) ⭐

**示例提示词:**
```
查看所有交易相关的函数列表
浏览文件操作相关的文档
```

## 贡献与开发

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/yourusername/mql5-help-mcp.git
cd mql5-help-mcp

# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 测试运行
node build/index.js
```

### 项目结构

```
mql5-help-mcp/
├── src/              # TypeScript 源码
│   └── index.ts      # MCP 服务器实现
├── build/            # 编译输出
├── MQL5_HELP/        # MQL5 官方文档（HTML）
├── scripts/          # 辅助脚本
├── package.json      # NPM 配置
└── tsconfig.json     # TypeScript 配置
```

## 配置选项

### 本地开发配置

如果你需要修改服务器代码或使用本地文档副本:

1. **克隆项目并安装依赖:**

```bash
git clone https://github.com/yourusername/mql5-help-mcp.git
cd mql5-help-mcp
npm install
```

2. **修改源码:**

编辑 `src/index.ts` 文件

3. **重新编译:**

```bash
npm run build
```

4. **在 MCP 配置中使用绝对路径:**

```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "node",
      "args": ["/absolute/path/to/mql5-help-mcp/build/index.js"]
    }
  }
}
```

## 工作原理

```
┌─────────────────┐
│  AI 编程助手     │  (Claude Code, Cursor, Copilot...)
│  (MCP Client)   │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│ MQL5 Help MCP   │
│     Server      │  • 索引 4500+ 文档
│                 │  • 智能搜索匹配
└────────┬────────┘  • HTML 内容解析
         │
┌────────▼────────┐
│   MQL5_HELP/    │
│   *.htm 文档     │  官方 MQL5 文档文件
└─────────────────┘
```

1. **AI 助手**识别用户需求,调用 MCP 工具
2. **MCP 服务器**搜索文档索引或读取文件
3. **解析 HTML**内容,提取纯文本
4. **返回结果**给 AI 助手
5. **AI 整合**文档信息,生成准确回答

## 项目结构

```
mql5-help-mcp/
├── src/
│   └── index.ts          # TypeScript 源码
├── build/                # 编译后的 JavaScript (运行时使用)
├── MQL5_HELP/            # MQL5 官方文档 (4500+ .htm 文件)
│   ├── ordersend.htm
│   ├── ctrade.htm
│   ├── onnx.htm
│   └── ...
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
└── README.md             # 本文档
```

## 故障排除

### 问题 1: AI 工具找不到 MCP 服务器

**解决方法:**
1. 确认配置文件路径正确（不同工具位置不同）
2. 检查 JSON 配置语法无误
3. 确保使用**绝对路径**（本地模式）或正确的 npx 命令
4. 重启 AI 工具

### 问题 2: 模块未找到错误

**解决方法:**

```bash
cd /path/to/mql5-help-mcp
npm install
npm run build
```

确保 `build/index.js` 文件存在。

### 问题 3: 搜索不到文档

**常见原因:**
- 使用中文关键词（应使用英文函数名）
- 拼写错误
- 函数名不完整

**解决方法:**
使用英文关键词,如:
- ✅ "OrderSend"
- ✅ "CopyBuffer"
- ✅ "OnTick"
- ❌ "订单发送"

### 问题 4: 服务器启动慢

**原因:** 首次启动时需要索引 4500+ 文档

**解决:** 正常现象,索引会被缓存,后续调用将非常快（< 10ms）

### 问题 5: Windows 路径问题

**错误示例:**
```json
"args": ["d:\my-program\mql5_help_mcp\build\index.js"]  ❌
```

**正确写法:**
```json
"args": ["d:\\my-program\\mql5_help_mcp\\build\\index.js"]  ✅
或
"args": ["d:/my-program/mql5_help_mcp/build/index.js"]      ✅
```

## 常见使用场景

### 场景 1: 编写 EA 交易策略

**提示词:**
```
我想创建一个基于 MACD 的 EA,请查询相关文档并给出代码示例
```

AI 会自动调用:
- `search` 工具查询 MACD、OrderSend 等相关函数
- `get` 工具获取详细文档
- 结合文档生成准确代码

### 场景 2: 调试错误码

**提示词:**
```
我的 EA 返回错误码 4756,这是什么意思?
```

AI 会查询错误码文档并给出解释和解决方案。

### 场景 3: 学习新 API

**提示词:**
```
浏览所有技术指标相关的函数,我想创建自定义指标
```

AI 会使用 `browse` 工具列出所有指标函数,帮你快速上手。

## 性能指标

- **文档索引**: 4500+ 份 HTML 文档
- **索引速度**: 首次 < 100ms（后续使用缓存）
- **查询响应**: < 10ms（内存索引）
- **文档读取**: < 50ms（单个文档）
- **内存占用**: < 50MB（含文档索引）

## 更新与维护

### 更新 MQL5 文档

替换 `MQL5_HELP/` 目录中的 `.htm` 文件即可,无需修改代码。

文档获取方式:
1. 从 MetaTrader 5 安装目录复制（通常在 `C:\Program Files\MetaTrader 5\Help\`）
2. 或从 MetaQuotes 官方下载最新版本

### 修改服务器代码

```bash
# 编辑 src/index.ts
vim src/index.ts

# 重新编译
npm run build

# 测试
node build/index.js
```

## 技术栈

- **语言**: TypeScript / Node.js
- **协议**: Model Context Protocol (MCP) SDK v1.0.4
- **文档格式**: HTML (官方 CHM 导出)
- **索引策略**: 内存 Map 缓存
- **解析器**: 正则表达式 + 字符串处理

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 致谢

- **MetaQuotes Ltd.** - MQL5 语言及文档版权所有者
- **Model Context Protocol** - Anthropic 开发的 AI 工具互操作协议
- **MQL5 社区** - 为量化交易开发者提供支持

## 相关资源

- [MQL5 官方文档](https://www.mql5.com/en/docs)
- [MetaTrader 5 官网](https://www.metatrader5.com/)
- [Model Context Protocol 规范](https://spec.modelcontextprotocol.io/)
- [AI 使用指南](./AI_USAGE_GUIDE.md) - 给 AI 助手的详细使用说明

---

**专为 MQL5 量化交易开发者打造** | 让 AI 成为你的 MQL5 文档专家
