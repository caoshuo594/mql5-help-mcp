# MQL5 Help MCP Server v1.0.0

## 🎉 首次发布

这是 MQL5 Help MCP Server 的首个正式版本！

### ✨ 核心功能

- **完整的 MQL5 文档库**: 包含 3000+ MQL5 官方文档（HTML 格式）
- **快速文档搜索**: 通过函数名、类名或关键字秒级查询
- **智能匹配**: 支持精确匹配和模糊搜索，自动处理类名变体
- **分类浏览**: 按功能分类组织文档（trading, indicators, math 等）
- **零配置使用**: 内置文档索引，无需额外下载

### 🔧 提供的 MCP 工具

1. **search** - 搜索 MQL5 文档
2. **get** - 获取指定文档的详细内容
3. **browse** - 浏览文档分类目录

### 📦 安装方式

使用 NPX（推荐）:
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

### 🎯 支持的 AI 助手

- Claude Code
- Cursor
- VS Code Copilot
- Gemini CLI
- JetBrains AI Assistant
- Windsurf
- 其他支持 MCP 的客户端

### 📝 文档

完整使用指南请查看 [README.md](https://github.com/caoshuo594/mql5-help-mcp/blob/main/README.md)

### ⚖️ 许可证

MIT License

### ⚠️ 免责声明

MQL5 文档版权归 MetaQuotes Ltd. 所有。本工具仅供开发辅助使用。
