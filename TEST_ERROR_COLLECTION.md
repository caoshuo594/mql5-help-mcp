# 错误收集功能测试脚本

本文档展示如何测试新的错误收集功能。

## 测试步骤

### 1. 启动服务器

```bash
cd d:\ai_coding\mql5_help_mcp2.0
node build/index.js
```

你应该看到:
```
🚀 MQL5 Help MCP Server 启动中...
📂 文档目录: MQL5_HELP:... | MQL5_Algo_Book:... | Neural_Networks_Book:...
💾 错误数据库: 0 条记录 (C:\Users\YourName\.mql5-help-mcp\mql5_errors.db)
✅ 服务器就绪，等待连接...
```

### 2. 在 Claude Code 中测试

#### 测试 1: 记录错误

```
使用 log_error 工具记录一个错误:
- 错误代码: E512
- 错误消息: undeclared identifier ResultCode
- 解决方案: ResultCode 在 MQL5 中改为 ResultRetcode(),使用 trade.ResultRetcode() 获取交易结果
- 相关文档: ["CTrade.htm", "trade_constants.htm"]
```

预期输出:
```
✅ 错误已记录到数据库

📋 错误代码: E512
📝 错误消息: undeclared identifier ResultCode
🔢 出现次数: 1
📅 首次遇到: 2024-11-25T...
📅 最后遇到: 2024-11-25T...

💡 解决方案:
ResultCode 在 MQL5 中改为 ResultRetcode(),使用 trade.ResultRetcode() 获取交易结果

📚 相关文档:
["CTrade.htm", "trade_constants.htm"]

💾 数据库位置: C:\Users\...\mql5_errors.db
```

#### 测试 2: 查询错误(从数据库)

```
我的代码报错: error E512: undeclared identifier ResultCode
```

预期输出(使用 smart_query):
```
🔍 **从错误数据库找到解决方案** (出现1次)

**错误:** E512 - undeclared identifier ResultCode

**解决方案:**
ResultCode 在 MQL5 中改为 ResultRetcode(),使用 trade.ResultRetcode() 获取交易结果

**相关文档:**
["CTrade.htm", "trade_constants.htm"]

💡 提示: 如果此解决方案无效,请使用 smart_query 从文档中查询更多信息
```

#### 测试 3: 查看高频错误

```
显示最常见的编译错误
```

预期输出:
```
📊 最常见的MQL5编译错误 (TOP 1)

1. E512 - undeclared identifier ResultCode
   🔢 出现次数: 1
   📅 最后遇到: 2024-11-25T...
   💡 解决方案: ResultCode 在 MQL5 中改为 ResultRetcode()...

📈 统计信息:
  • 总错误类型: 1
  • 总出现次数: 1
  • 数据库位置: C:\Users\...\mql5_errors.db
```

#### 测试 4: 导出数据库

```
导出错误数据库,使用匿名模式
```

预期输出:
```
📤 错误数据库导出成功

🔒 隐私模式: 已移除文件路径信息

📊 导出数据:
```json
[
  {
    "id": 1,
    "error_code": "E512",
    "error_message": "undeclared identifier ResultCode",
    "solution": "ResultCode 在 MQL5 中改为 ResultRetcode()...",
    "related_docs": "[\"CTrade.htm\", \"trade_constants.htm\"]",
    "occurrence_count": 1,
    "first_seen": "2024-11-25T...",
    "last_seen": "2024-11-25T..."
  }
]
```
```

#### 测试 5: 查看统计信息

```
查看错误数据库统计
```

预期输出:
```
📈 错误数据库统计信息

📊 数据统计:
  • 总错误类型: 1
  • 总出现次数: 1
  • 平均每错误: 1.0 次

💾 数据库信息:
  • 位置: C:\Users\...\mql5_errors.db

💡 提示:
  • 使用 list_common_errors 查看高频错误
  • 使用 manage_error_db(action="export") 导出错误库
  • 使用 smart_query 查询错误时会自动从数据库搜索
```

#### 测试 6: 重复记录相同错误

```
再次记录同样的错误 E512
```

预期:
- 出现次数应该增加到 2
- `first_seen` 保持不变
- `last_seen` 更新为当前时间

### 3. 验证数据库文件

检查数据库文件是否已创建:

**Windows:**
```powershell
Test-Path "$env:USERPROFILE\.mql5-help-mcp\mql5_errors.db"
```

**macOS/Linux:**
```bash
ls -lh ~/.mql5-help-mcp/mql5_errors.db
```

### 4. 直接查看数据库(可选)

如果安装了 SQLite 工具:

```bash
sqlite3 ~/.mql5-help-mcp/mql5_errors.db
```

```sql
-- 查看所有表
.tables

-- 查看表结构
.schema error_records

-- 查看所有记录
SELECT * FROM error_records;

-- 查看记录数
SELECT COUNT(*) FROM error_records;

-- 退出
.quit
```

## 预期行为

### ✅ 成功标志

1. 服务器启动时显示数据库路径
2. 记录错误后显示确认信息
3. 查询错误时优先从数据库返回结果
4. 相同错误重复记录时增加计数
5. 导出/导入功能正常工作

### ❌ 常见问题

1. **数据库创建失败**
   - 检查用户主目录是否有写权限
   - 检查 `better-sqlite3` 是否正确安装

2. **查询不到数据库中的错误**
   - 检查错误代码格式是否一致
   - 检查 `smart_query` 是否正确调用

3. **导出为空**
   - 确认数据库中有记录
   - 使用 `list_common_errors` 验证

## 性能测试

### 插入性能

记录 1000 个不同错误应该在 1 秒内完成。

### 查询性能

从 1000 条记录中查询应该在 10ms 内完成。

### 数据库大小

1000 条记录约 1-2 MB。

## 清理测试数据

测试完成后,如果想清空数据库:

**Windows:**
```powershell
Remove-Item "$env:USERPROFILE\.mql5-help-mcp\mql5_errors.db"
```

**macOS/Linux:**
```bash
rm ~/.mql5-help-mcp/mql5_errors.db
```

下次启动服务器时会自动创建新的空数据库。

## 集成测试清单

- [ ] 服务器启动时初始化数据库
- [ ] `log_error` 工具记录新错误
- [ ] `log_error` 工具更新已存在错误
- [ ] `smart_query` 优先从数据库查询
- [ ] `smart_query` 数据库未找到时查询文档
- [ ] `list_common_errors` 正确排序
- [ ] `manage_error_db` 导出功能
- [ ] `manage_error_db` 导入功能
- [ ] `manage_error_db` 匿名导出
- [ ] `manage_error_db` 统计功能
- [ ] 服务器关闭时正确清理数据库连接
- [ ] 相同错误去重并增加计数
- [ ] 错误代码索引提升查询性能

## 已知限制

1. 当前不支持通过工具删除单条记录
2. 不支持编辑已存在的记录(只能追加/更新计数)
3. 模糊搜索基于简单关键词匹配,不支持语义搜索
4. 导入时发生错误会继续处理其他记录,不会回滚

## 下一步

测试通过后:
1. 提交代码到 Git
2. 更新 npm 版本到 1.3.0
3. 发布到 npm (可选)
4. 更新 GitHub Release Notes
5. 通知用户升级

---

测试完成后请记录结果和任何发现的问题!
