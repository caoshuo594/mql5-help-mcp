# MQL5 Help MCP Server

[![npm package](https://img.shields.io/npm/v/mql5-help-mcp.svg)](https://npmjs.org/package/mql5-help-mcp)

`mql5-help-mcp` 让你的 AI 编程助手（Claude Code、Cursor、Copilot、Gemini CLI 等）直接访问本地的 MQL5 文档与学习资料库。基于 Model Context Protocol (MCP)，为 AI 助手提供 4500+ 官方文档与两本补充电子书（HTML）的快速检索能力，助你更高效地完成 EA/指标/脚本开发与调试。

## 有哪些资料被内置？

- 官方 MQL5 文档：`MQL5_HELP/`（4500+ .htm）
- MQL5 算法交易手册（HTML）：`MQL5_Algo_Book/`
- 神经网络与机器学习手册（HTML）：`Neural_Networks_Book/`

> 说明：两本电子书版权归原作者所有，仅作为学习参考随仓库分发；当前版本主要对 `MQL5_HELP/` 做了完整索引，电子书的统一索引与搜索将在后续版本补充（Roadmap 已列出）。

## 面向问题的能力（结合用户建议重构）

当前可用 + 规划中功能一览：

- 搜索文档（已提供）
  - 通过函数名、类名或关键词快速定位官方文档
  - 覆盖交易函数、指标、标准库、ONNX 等常用主题
- 智能匹配（已提供基础能力）
  - 支持精确/模糊匹配，兼容常见类名变体（如 CTrade/Trade）
- 常见错误解决方案库（进行中）
  - 错误 256/undeclared identifier 等典型问题的成因与对照表
  - MQL4→MQL5 迁移差异：Symbol()→_Symbol，Period()→_Period，ResultCode()→ResultRetcode()
- 智能错误匹配（规划中）
  - 直接用“编译器错误文本”搜索：如 `error 256: undeclared identifier ResultCode`
- 上下文感知搜索（规划中）
  - 术语映射与别名：如 MQL4 的 `iMA` → MQL5 的 `IndicatorCreate`
- 代码分析与诊断（规划中）
  - `analyze_code`：指出 API 更名与常见误用
  - `diagnose_error`：基于编译错误日志给出定位与替代建议
- 交互式帮助（规划中）
  - 支持“针对某一行代码/某一错误”的追问式问答
- 学习路径推荐（规划中）
  - 从“语法差异 → 标准库 → 指标/交易 → 性能优化”的循序内容
- 多维标签与版本标注（规划中）
  - 难度/用途/版本/主题等维度过滤；明确 MQL4 兼容信息

> 优先级：
> - 高：智能错误匹配、错误解决方案库、代码示例
> - 中：上下文感知搜索、交互式帮助、学习路径
> - 低：代码分析、标签系统、版本标注（细化）

## 快速开始

### 前提条件

- Node.js 18.0 或更高版本
- npm 或 npx

### 🚀 Claude Code 用户快速安装（最简单）

如果你使用 Claude Code，可以直接在命令行运行：

```bash
claude mcp add mql5-help npx -- -y github:caoshuo594/mql5-help-mcp
```

安装后验证：

```bash
claude mcp list
```

你应该看到 `mql5-help` 显示为 `✓ Connected`。

> **首次安装注意**：第一次运行时，npx 需要从 GitHub 下载源代码、安装依赖并编译 TypeScript，可能需要 10-30 秒。如果首次显示连接失败，请稍等片刻后再次运行 `claude mcp list` 检查状态。

---

### 安装方式 1：直接从 GitHub 安装（手动配置）

使用 `npx` 直接从 GitHub 运行，无需手动克隆或构建：

```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "npx",
      "args": ["-y", "github:caoshuo594/mql5-help-mcp"]
    }
  }
}
```

> **提示**：使用 `github:caoshuo594/mql5-help-mcp` 可直接从 GitHub 获取最新版本。npm 会自动：
> 1. 下载源代码
> 2. 安装依赖
> 3. 运行 `prepare` 脚本编译 TypeScript
> 4. 启动服务器

### 安装方式 2：从 npm 安装

如果包已发布到 npm：

```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "npx",
      "args": ["-y", "mql5-help-mcp"]
    }
  }
}
```

### 安装方式 3：本地开发模式

适用于需要修改代码或贡献的开发者：

```bash
# 1. 克隆仓库
git clone https://github.com/caoshuo594/mql5-help-mcp.git
cd mql5-help-mcp

# 2. 安装依赖
npm install

# 3. 编译 TypeScript 源码
npm run build
```

然后在 MCP 配置中使用绝对路径：

**Windows 示例：**
```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "node",
      "args": ["D:/my-program/mql5-help-mcp/build/index.js"]
    }
  }
}
```

**macOS/Linux 示例：**
```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "node",
      "args": ["/home/user/projects/mql5-help-mcp/build/index.js"]
    }
  }
}
```

> **Windows 路径注意**：使用正斜杠 `/` 或双反斜杠 `\\\\`（在 JSON 中）

### Claude Code 配置位置

配置文件位置：
- **Windows**: `%USERPROFILE%\.claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

### 测试你的配置

配置完成后，在 Claude Code 或其他 AI 助手中测试以下命令：

#### 示例 1：搜索函数文档

```
搜索 MQL5 的 OrderSend 函数用法
```

AI 助手会调用 `search` 工具，返回相关文档列表。

#### 示例 2：获取详细文档

```
获取 CTrade 类的完整文档
```

AI 助手会调用 `get` 工具，返回 CTrade 类的详细说明。

#### 示例 3：浏览分类

```
浏览 MQL5 的交易相关文档有哪些？
```

AI 助手会调用 `browse` 工具，显示 trading 分类下的所有文档。

#### 示例 4：错误诊断（Smart Query - 推荐）

```
我的代码报错：error 256: undeclared identifier ResultCode，怎么解决？
```

AI 助手会自动调用 `smart_query`，直接返回解决方案：
- 诊断: ResultCode → ResultRetcode (MQL5迁移)
- 语法: ulong CTrade::ResultRetcode() const
- 示例代码
- 只消耗 ~500 tokens (vs 传统方式 4000+)

#### 验证 MCP 工具可用性

你也可以直接要求 AI 列出可用的 MQL5 工具：

```
列出你可以使用的 MQL5 文档工具
```

AI 应该会显示七个工具：`smart_query`、`search`、`get`、`browse`、`log_error`、`list_common_errors`、`manage_error_db`。

## 工具列表

本 MCP 服务器当前提供 7 个工具：

### 核心查询工具

1) **`smart_query`** - 🎯 智能查询（推荐）
- 参数：
  - `query`（必填）：查询内容（错误信息、函数名、类名或问题）
  - `mode`（可选）：`quick`（精简，~500 tokens，默认）或 `detailed`（详细，~1500 tokens）
- 特点：
  - **优先从错误数据库查询历史解决方案**
  - 自动识别查询类型（错误/函数/类/概念）
  - 节省 80%+ token 消耗
  - 完全本地化，零 API 成本
- 示例：
  - "error E512: undeclared identifier ResultCode"（优先从数据库查询）
  - "OrderSend 函数用法"
  - "如何使用 CTrade 类下单"

2) `search` - 搜索文档
- 参数：`query`（必填，关键词），`limit`（可选，默认 10）
- 示例：
  - “搜索与订单发送相关的函数”
  - “查找 ONNX 模型相关的文档”

2) `get` - 获取文档详情
- 参数：`filename`（必填，如 `ordersend.htm` 或 `ordersend`）
- 示例：
  - “获取 OrderSend 的完整文档”
  - “查看 CTrade 类的详细说明”

4) `browse` - 浏览分类目录
- 参数：`category`（可选，如 `trading`, `indicators`, `math` 等）
- 常见分类：`trading`, `indicators`, `math`, `array`, `string`, `datetime`, `files`, `chart`, `objects`, `onnx`

### 错误收集与管理工具（新增 v1.3.0）

5) **`log_error`** - 📝 记录编译错误
- 参数：
  - `error_code`（必填）：错误代码（如 `E512`、`E308`）
  - `error_message`（必填）：完整错误消息
  - `file_path`（可选）：发生错误的文件路径
  - `solution`（可选）：解决方案描述
  - `related_docs`（可选）：相关文档列表（JSON 数组格式）
- 功能：记录错误到本地 SQLite 数据库（存储在 `~/.mql5-help-mcp/mql5_errors.db`）
- 自动去重：相同错误会增加计数而不是重复记录
- 示例：
  ```
  记录错误：E512，消息是"undeclared identifier ResultCode"，解决方案是"改用 ResultRetcode()"
  ```

6) **`list_common_errors`** - 📊 查看高频错误
- 参数：`limit`（可选，默认 10）：返回错误数量
- 功能：列出最常见的编译错误（按出现频率排序）
- 显示每个错误的出现次数、最后遇到时间、解决方案摘要
- 示例：
  ```
  显示最常见的 10 个 MQL5 编译错误
  ```

7) **`manage_error_db`** - 🔧 管理错误数据库
- 参数：
  - `action`（必填）：操作类型
    - `export`：导出错误数据库为 JSON
    - `import`：从 JSON 导入错误记录
    - `stats`：查看数据库统计信息
  - `data`（导入时必需）：JSON 格式的错误数据
  - `anonymize`（可选，默认 false）：导出时是否移除文件路径（保护隐私）
- 功能：支持错误库的导出/导入，方便团队共享错误解决方案
- 智能合并：导入时自动合并，保留更高的出现次数
- 示例：
  ```
  导出错误数据库（匿名模式）
  查看错误数据库统计信息
  从JSON文件导入团队共享的错误库
  ```

> **错误数据库位置**：`~/.mql5-help-mcp/mql5_errors.db`（用户主目录，跨项目共享）
> 
> **工作流程**：
> 1. 遇到编译错误 → 使用 `smart_query` 查询（自动从数据库搜索）
> 2. 解决后 → 使用 `log_error` 记录解决方案
> 3. 定期查看 → 使用 `list_common_errors` 了解常见问题
> 4. 团队协作 → 使用 `manage_error_db` 导出/导入错误库

> 关于两本电子书：当前版本优先索引 `MQL5_HELP/`；对 `MQL5_Algo_Book/` 与 `Neural_Networks_Book/` 的"统一搜索与浏览分类"将随 Roadmap 开启，届时可通过 `browse` 与 `search` 在一个入口里检索。

## 示例与最佳实践

### 1. MQL4 → MQL5 迁移常见差异

- 预定义变量：`Symbol()` → `_Symbol`，`Period()` → `_Period`
- CTrade 结果：`ResultCode()` → `ResultRetcode()`
- 指标创建：`iMA(...)`（MQL4 习惯）→ `IndicatorCreate(...)`（MQL5 推荐）

示例（买入操作）：

```mql5
CTrade trade;
trade.SetExpertMagicNumber(12345);
if (trade.Buy(0.1, _Symbol)) {
  Print("买入成功，retcode=", trade.ResultRetcode());
}
```

### 2. 以错误文本驱动的搜索（规划中）

输入：

```
error 256: undeclared identifier ResultCode
```

期望返回：

- 解释“ResultCode 已改名为 ResultRetcode（MQL5）”
- 指向 CTrade 类文档与迁移指南

### 3. 交互式诊断（规划中）

```
mcp__mql5-help__diagnose_error(`
ma_cross_ea.mq5(155,39) : error 256: undeclared identifier 'ResultCode'
`)
```

期望：定位第 155 行问题并给出替代 API。

## 项目结构（含电子书）

```
mql5-help-mcp/
├── src/                       # TypeScript 源码
│   └── index.ts               # MCP 服务器实现
├── build/                     # 编译输出
├── MQL5_HELP/                 # 官方 MQL5 文档（4500+ .htm）
├── MQL5_Algo_Book/            # 算法交易手册（HTML 电子书）
├── Neural_Networks_Book/      # 神经网络/机器学习手册（HTML 电子书）
├── scripts/
├── package.json
├── tsconfig.json
└── README.md
```

## 工作原理与架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    MQL5 Help MCP Server                     │
├─────────────────────────────────────────────────────────────┤
│  工具层 (index.ts)                                          │
│  ├── smart_query  → 智能查询，精简返回                       │
│  ├── search       → 搜索文档，返回列表                       │
│  ├── get          → 获取完整文档内容                         │
│  ├── browse       → 浏览分类目录                            │
│  ├── log_error    → 记录错误到本地数据库                     │
│  └── manage_error_db → 管理错误数据库                       │
├─────────────────────────────────────────────────────────────┤
│  查询引擎层 (smart-query.ts)                                │
│  ├── QueryAnalyzer    → 分析查询类型（错误/函数/类/问题）    │
│  ├── InfoExtractor    → 从HTML提取关键信息                   │
│  └── ResponseFormatter → 格式化精简/详细答案                 │
├─────────────────────────────────────────────────────────────┤
│  数据层                                                     │
│  ├── 文档索引 (内存Map)  → 4500+ htm/html/md 文件索引        │
│  └── 错误数据库 (SQLite) → 本地存储用户遇到的错误记录         │
├─────────────────────────────────────────────────────────────┤
│  资料库 (本地文件，约60MB)                                   │
│  ├── MQL5_HELP/          → 官方文档 4500+ 文件              │
│  ├── MQL5_Algo_Book/     → 算法交易电子书                   │
│  └── Neural_Networks_Book/ → 神经网络电子书                 │
└─────────────────────────────────────────────────────────────┘
```

### 查询流程

```
用户查询 "OrderSend"
         │
         ▼
┌─────────────────────┐
│ 1. 查询分析         │ ← QueryAnalyzer 判断类型(函数查询)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 2. 内部搜索         │ ← 在内存 Map 中匹配 key
│    (不调用API)      │    docIndex.get("ordersend")
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 3. 读取本地文件     │ ← fs.readFile("MQL5_HELP/ordersend.htm")
│    (纯IO操作)       │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 4. 信息提取         │ ← InfoExtractor 用正则提取:
│    (正则匹配)       │    语法/参数/返回值/示例
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 5. 格式化输出       │ ← ResponseFormatter
│    quick: ~500 tokens│
│    detailed: ~1500 tokens
└─────────────────────┘
```

---

## 💰 Token 消耗分析

### 核心结论：查询本身不消耗 Token，返回给 AI 的内容才消耗 Token

| 操作 | Token 消耗 | 说明 |
|------|-----------|------|
| **文档存储** | ❌ 0 | 电子书存在本地，不计入 Token |
| **索引构建** | ❌ 0 | 启动时本地构建 Map，纯内存操作 |
| **搜索匹配** | ❌ 0 | 本地 Map 查找，O(1) 复杂度 |
| **文件读取** | ❌ 0 | `fs.readFile` 本地 IO |
| **信息提取** | ❌ 0 | 正则表达式匹配，本地计算 |

### 消耗 Token 的环节：MCP 工具返回的内容

| 工具 | 返回内容 | 估计 Token | 推荐场景 |
|------|---------|-----------|---------|
| `smart_query` (quick) | 提取的精华信息 | **~500** | ✅ 日常查询（推荐） |
| `smart_query` (detailed) | 完整提取信息 | ~1500 | 需要详细说明 |
| `search` | 文件列表 | ~200-500 | 浏览/确认文件 |
| `get` | 完整文档内容 | **~3000-10000** | ❌ 高消耗，谨慎使用 |

### 传统方式 vs 本服务器

```
传统方式：
AI → "查 OrderSend" → 调用外部API → 返回完整文档 → 消耗大量 Token
                                    (~5000 tokens)

本服务器：
AI → smart_query("OrderSend") 
   → 本地搜索 + 本地读取 + 本地提取 (0 Token)
   → 返回精华内容 (~500 tokens)
   
节省: 5000 - 500 = 4500 tokens (节省 90%)
```

### 总结

| 问题 | 答案 |
|------|------|
| 电子书存储在哪？ | 本地 `MQL5_HELP/`, `MQL5_Algo_Book/`, `Neural_Networks_Book/` |
| 内置资料占用空间？ | ~60MB (纯本地存储) |
| 查询过程是否调用 API？ | ❌ 不调用，纯本地操作 |
| 返回结果消耗 Token？ | ✅ 是，但已优化到 ~500 tokens |
| 如何最省 Token？ | 用 `smart_query` 的 `quick` 模式 |
| 最耗 Token 的操作？ | `get` 工具（返回完整文档，~3000-10000 tokens） |

> **一句话总结**：电子书和索引存储在本地，搜索和提取完全在本地进行（零 API 调用）。唯一消耗 Token 的是 MCP 工具**返回给 AI 的内容**，而 `smart_query` 工具通过提取精华信息，将消耗从 ~5000 tokens 压缩到 ~500 tokens，**节省约 90% 的 Token**。

---

## 故障排除

### 1. 首次安装显示 "Failed to connect"

**症状**：运行 `claude mcp list` 显示 `mql5-help - ✗ Failed to connect`

**原因**：首次从 GitHub 安装时，npx 需要下载、安装依赖并编译 TypeScript，这个过程需要时间。

**解决方法**：
1. 等待 10-30 秒
2. 再次运行 `claude mcp list` 检查状态
3. 如果仍然失败，手动测试服务器：
   ```bash
   npx -y github:caoshuo594/mql5-help-mcp
   ```
   你应该看到：
   ```
   🚀 MQL5 Help MCP Server 启动中...
   📂 文档目录: MQL5_HELP:... | MQL5_Algo_Book:... | Neural_Networks_Book:...
   ✅ 服务器就绪，等待连接...
   ```

### 2. Claude Code 命令行工具相关

**使用 Claude Code CLI 管理 MCP**：

```bash
# 查看所有 MCP 服务器
claude mcp list

# 查看特定 MCP 详情
claude mcp get mql5-help

# 删除 MCP 服务器
claude mcp remove mql5-help
```

### 3. 手动配置 MCP（不使用 CLI）

如果你想手动编辑配置文件，配置文件位置：
- **Windows**: `%USERPROFILE%\.claude\claude_desktop_config.json`（Claude Desktop）或 `%USERPROFILE%\.claude.json`（Claude Code）
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

添加如下配置：

```json
{
  "mcpServers": {
    "mql5-help": {
      "command": "npx",
      "args": ["-y", "github:caoshuo594/mql5-help-mcp"]
    }
  }
}
```

### 4. 本地开发模式问题

**模块未找到/未编译**：

```bash
cd /path/to/mql5-help-mcp
npm install
npm run build
```

确保 `build/index.js` 存在。

### 5. 搜索不到文档

- 优先使用英文函数名（如 `OrderSend`、`CopyBuffer`、`OnTick`）
- 确认拼写正确，或试试更短的关键词
- 类名支持变体：`CTrade` 和 `Trade` 都可以搜索到

### 6. Windows 路径问题

在 JSON 配置文件中，路径需要正确转义：

```json
// ✅ 正确 - 使用正斜杠
"args": ["D:/my-program/mql5-help-mcp/build/index.js"]

// ✅ 正确 - 使用双反斜杠
"args": ["D:\\my-program\\mql5-help-mcp\\build\\index.js"]

// ❌ 错误 - 单反斜杠会被解析为转义字符
"args": ["D:\my-program\mql5-help-mcp\build\index.js"]
```

## 版本历史

### v1.3.0 (2024-11-25) - 错误收集系统

**🎉 新功能:**
- 🗄️ 本地错误数据库（SQLite）- 无需网络服务器
- 📝 `log_error` 工具 - 记录编译错误及解决方案
- 📊 `list_common_errors` 工具 - 查看高频错误 TOP N
- 🔧 `manage_error_db` 工具 - 导出/导入/统计错误库
- 🔍 `smart_query` 增强 - 优先从错误数据库查询历史解决方案

**💡 核心特性:**
- 完全本地化存储（`~/.mql5-help-mcp/mql5_errors.db`）
- 智能去重：相同错误自动合并并计数
- 隐私保护：导出时可选移除文件路径
- 团队协作：支持导出/导入 JSON 格式错误库
- 相似度搜索：模糊匹配历史错误关键词

**🎯 使用场景:**
1. 遇到错误 → `smart_query` 自动查询数据库
2. 解决后 → `log_error` 记录方案供下次使用
3. 学习 → `list_common_errors` 了解常见问题
4. 协作 → `manage_error_db` 分享团队知识库

**📊 性能优化:**
- 数据库索引优化：错误代码、出现次数、时间戳
- WAL 模式提升并发性能
- 增量更新减少重复写入

### v1.2.0 (2024-11-24) - Smart Query重大更新

**🎉 新功能:**
- ✨ 新增 `smart_query` 智能查询工具
- 🎯 支持错误诊断、函数查询、类查询、概念查询
- 📉 节省80%+ token消耗 (4000 → 500 tokens)
- ⚡ 响应速度提升60%
- 🆓 完全本地化，零API成本，无需外部服务

**💡 核心特性:**
- 智能识别5种查询类型 (error/function/class/howto/concept)
- 基于正则表达式精准提取关键信息 (语法/参数/示例/注意事项)
- 两种模式: quick(~500 tokens) 和 detailed(~1500 tokens)
- 内置MQL4→MQL5迁移提示

**📚 新增文档:**
- `QUICK_START_SMART_QUERY.md` - 3分钟快速上手
- `SMART_QUERY_GUIDE.md` - 完整使用指南  
- `AI_USAGE_GUIDE.md` - 针对编译错误修复场景

### v1.0.0 (2024-11-01) - 首次发布

- 基础搜索、获取、浏览功能
- 支持4500+ MQL5官方文档
- 包含2本电子书资源

---

## 路线图（Roadmap）

- ✅ [高] 智能错误匹配 - **v1.2.0已实现**
- ✅ [高] 常见错误解决方案库 - **v1.2.0已实现**
- ✅ [高] 错误收集与持久化 - **v1.3.0已实现**
- ✅ [高] 团队错误库共享 - **v1.3.0已实现**
- [ ] [高] 代码示例库扩展：更多EA模板与策略示例
- [ ] [高] 错误自动诊断：分析编译输出并提供解决方案
- [ ] [中] 上下文感知搜索增强：更多术语映射
- [ ] [中] 交互式帮助：多轮对话支持
- [ ] [中] 学习路径推荐：结构化教程
- [ ] [中] 错误预测：基于代码模式预警潜在问题
- [ ] [低] 统一索引两本电子书
- [ ] [低] 标签系统与版本标注

---

## 许可证与鸣谢

- 许可证：MIT（详见 [LICENSE](LICENSE)）
- MQL5文档版权归 MetaQuotes Ltd. 所有，本工具仅供开发辅助使用
- 文档版权：MQL5 官方文档归 MetaQuotes Ltd. 所有；两本电子书版权归原作者所有
- 致谢：Model Context Protocol、MQL5 社区与贡献者

---

专为量化开发者打造的“问题驱动”MQL5 知识助手：不仅能查文档，更帮你定位与解决真实问题。
