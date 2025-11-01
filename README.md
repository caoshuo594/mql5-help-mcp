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

### 安装方式 1：直接从 GitHub 拉起（推荐）

在你的 MCP 客户端配置文件中加入：

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

> 提示：使用 `github:caoshuo594/mql5-help-mcp` 可直接从 GitHub 获取最新构建，无需发布到 npm。

### 安装方式 2：本地开发模式

```bash
# 克隆或下载项目到本地
cd D:\\my-program\\mql5_help_mcp

# 安装依赖
npm install

# 编译 TypeScript 源码
npm run build
```

然后在 MCP 配置中使用绝对路径：

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

> Windows 注意：路径用双反斜杠 `\\` 或正斜杠 `/`。

### 测试你的配置

配置完成后，在 AI 助手中输入：

```
搜索 MQL5 的 OrderSend 函数用法
```

助手应能返回函数签名、参数解释与示例链接等内容。

## 工具列表（现有）

本 MCP 服务器当前提供 3 个工具：

1) `search` - 搜索文档
- 参数：`query`（必填，关键词），`limit`（可选，默认 10）
- 示例：
  - “搜索与订单发送相关的函数”
  - “查找 ONNX 模型相关的文档”

2) `get` - 获取文档详情
- 参数：`filename`（必填，如 `ordersend.htm` 或 `ordersend`）
- 示例：
  - “获取 OrderSend 的完整文档”
  - “查看 CTrade 类的详细说明”

3) `browse` - 浏览分类目录
- 参数：`category`（可选，如 `trading`, `indicators`, `math` 等）
- 常见分类：`trading`, `indicators`, `math`, `array`, `string`, `datetime`, `files`, `chart`, `objects`, `onnx`

> 关于两本电子书：当前版本优先索引 `MQL5_HELP/`；对 `MQL5_Algo_Book/` 与 `Neural_Networks_Book/` 的“统一搜索与浏览分类”将随 Roadmap 开启，届时可通过 `browse` 与 `search` 在一个入口里检索。

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

## 工作原理（概览）

```
AI 助手（MCP 客户端） → MQL5 Help MCP Server → 本地 HTML 文档（解析/索引/检索）
```

1) 客户端基于 MCP 调用工具；2) 服务端查询内存索引或解析 HTML；3) 返回结果给助手整合回答。

## 故障排除

1) 找不到 MCP 服务器
- 检查配置文件路径与 JSON 语法
- 本地模式需使用绝对路径
- 重启客户端以重新加载 MCP 配置

2) 模块未找到/未编译

```bash
cd /path/to/mql5-help-mcp
npm install
npm run build
```

确保 `build/index.js` 存在。

3) 搜索不到文档
- 优先使用英文函数名（如 `OrderSend`、`CopyBuffer`、`OnTick`）
- 确认拼写正确，或试试更短的关键词

4) Windows 路径

```json
"args": ["d:\\my-program\\mql5_help_mcp\\build\\index.js"]  // ✅
```

> 也可改用 `d:/my-program/mql5_help_mcp/build/index.js`

## 路线图（Roadmap）

- [高] 智能错误匹配：从编译错误文本直达解决方案
- [高] 常见错误解决方案库：成因、定位、替代 API 表
- [高] 代码示例库：EA 模板、常用策略与 CTrade 用法
- [中] 上下文感知搜索：术语映射、别名与常见写法
- [中] 交互式帮助：基于行号与上下文的追问式诊断
- [中] 学习路径推荐：迁移→标准库→指标/交易→优化
- [低] 统一索引两本电子书，纳入 `search/browse`
- [低] 标签系统与版本标注：难度/用途/版本/主题

## 许可证与鸣谢

- 许可证：MIT（详见 [LICENSE](LICENSE)）
- 文档版权：MQL5 官方文档归 MetaQuotes Ltd. 所有；两本电子书版权归原作者所有
- 致谢：Model Context Protocol、MQL5 社区与贡献者

---

专为量化开发者打造的“问题驱动”MQL5 知识助手：不仅能查文档，更帮你定位与解决真实问题。
