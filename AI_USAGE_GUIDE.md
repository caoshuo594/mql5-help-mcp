# AI Assistant Usage Guide for MQL5 Documentation

**本指南教AI助手如何高效使用这个MQL5文档库**

---

## 🎯 核心概念

这个文件夹包含**完整的MQL5官方参考文档**，约3000+个HTML文件。

**关键文件**: `MQL5.hhc` - 这是HTML Help的目录文件，包含完整的树形结构索引。

---

## 📋 标准工作流程

### Step 1: 理解文档结构
```
读取文件: MQL5.hhc
目的: 了解完整的文档组织架构
格式: HTML Help Contents格式，树形结构
```

### Step 2: 定位相关主题
根据用户问题，在MQL5.hhc中找到对应的章节和文件名。

**示例**:
- 用户问: "如何下单？"
- 在MQL5.hhc中搜索: "OrderSend"
- 找到: `<param name="Local" value="ordersend.htm">`

### Step 3: 读取具体文档
打开定位到的.htm文件，提取:
- 函数语法
- 参数说明
- 返回值
- 示例代码
- 注意事项

### Step 4: 生成答案
基于官方文档内容，给出准确、完整的答案和代码示例。

---

## 🔍 文档查找策略

### 查找函数文档
```
函数名: OrderSend
文件名: ordersend.htm (小写，无空格)
位置: 在MQL5.hhc中搜索 "OrderSend"
```

### 查找类文档
```
类名: CTrade
文件名: ctrade.htm (小写)
位置: 在MQL5.hhc中搜索 "CTrade"
```

### 查找常量/枚举
```
枚举: ENUM_TIMEFRAMES
文件名: enum_timeframes.htm
位置: 搜索 "Timeframes" 或 "enum"
```

### 查找主题文档
```
主题: ONNX模型
入口文件: onnx.htm
相关文件: onnx_intro.htm, onnx_mql5.htm, onnx*.htm
```

---

## 📖 常见用户问题模板

### 模板1: 如何使用某个函数
```
用户问: "OrderSend怎么用？"

AI步骤:
1. 查看 MQL5.hhc 找到 ordersend.htm
2. 读取 ordersend.htm 内容
3. 提取: 语法、参数、返回值、示例
4. 返回: 完整说明 + 代码示例
```

### 模板2: 如何实现某个功能
```
用户问: "如何获取当前持仓？"

AI步骤:
1. 在 MQL5.hhc 搜索 "position" 相关内容
2. 找到: PositionSelect, PositionGetDouble, CPositionInfo
3. 读取相关文档
4. 返回: 多种方法 + 示例代码
```

### 模板3: 类的使用方法
```
用户问: "CTrade类怎么用？"

AI步骤:
1. 找到 ctrade.htm (主文档)
2. 找到 ctrade*.htm (所有成员函数)
3. 整合信息
4. 返回: 类概述 + 常用方法 + 完整示例
```

### 模板4: 主题学习
```
用户问: "如何使用ONNX模型？"

AI步骤:
1. 在 MQL5.hhc 找到 "ONNX models" 章节
2. 按顺序阅读:
   - onnx_intro.htm (简介)
   - onnx_prepare.htm (准备模型)
   - onnx_mql5.htm (MQL5中使用)
   - onnx_test.htm (测试)
3. 查看API函数: onnxcreate.htm, onnxrun.htm
4. 返回: 完整教程 + 工作流程 + 代码示例
```

---

## 📁 重要文件和目录

### 核心文件
- `MQL5.hhc` - **最重要**，文档目录树
- `index.htm` - 文档主页
- `README.md` - 人类可读的文档说明
- `QUICK_INDEX.md` - 快速索引
- `default.css` - 样式表

### 主题文件命名规则
- 概述: `topic.htm` (如 onnx.htm, trading.htm)
- 函数: `functionname.htm` (如 ordersend.htm)
- 类: `classname.htm` (如 ctrade.htm)
- 类成员: `classmember.htm` (如 ctradepositionopen.htm)
- 常量: `enum_name.htm` (如 enum_timeframes.htm)

---

## 💡 高效使用技巧

### 技巧1: 利用搜索功能
```
在MQL5.hhc中搜索关键词：
- 函数名
- 类名
- 主题词（如 "trading", "indicator", "matrix"）
```

### 技巧2: 理解文档层次
```
MQL5 Reference
├── Language Basics (语言基础)
│   ├── Syntax, Data Types, Operators...
├── Constants and Structures (常量结构)
├── MQL5 programs (程序类型)
├── Common Functions (通用函数)
├── Trade Functions (交易函数)
├── Technical Indicators (技术指标)
├── ONNX models (机器学习)
├── Standard Library (标准库)
└── ...
```

### 技巧3: 查找相关文档
一个主题通常有多个相关文件：
```
例如 ONNX:
- onnx.htm (概述)
- onnx_intro.htm (介绍)
- onnx_prepare.htm (准备)
- onnx_mql5.htm (使用)
- onnx_structures.htm (数据结构)
- onnxcreate.htm (函数)
- onnxrun.htm (函数)
等等...
```

### 技巧4: 提供完整答案
好的答案应该包括：
1. ✅ 简短说明
2. ✅ 函数/类语法
3. ✅ 参数详细说明
4. ✅ 返回值
5. ✅ 完整代码示例
6. ✅ 注意事项
7. ✅ 相关链接（其他相关文档）

---

## 🎓 示例对话

### 示例1
```
用户: "MQL5中如何发送市价买单？"

AI思路:
1. 关键词: "市价", "买单", "发送" → OrderSend 或 CTrade
2. 查 MQL5.hhc: 找到 ordersend.htm 和 ctrade.htm
3. 读取两个文件
4. 对比两种方法

回答:
"MQL5中发送市价买单有两种方法：

方法1: 使用OrderSend函数
[提供语法和示例]

方法2: 使用CTrade类 (推荐)
[提供语法和示例]

两种方法对比:
- OrderSend: 更底层，需要手动构建MqlTradeRequest
- CTrade: 更简单，面向对象，推荐使用

完整示例代码:
[完整可运行的代码]

参考文档:
- ordersend.htm
- ctrade.htm
- ctradebuy.htm
"
```

### 示例2
```
用户: "我想用ONNX模型预测价格，从头教我"

AI思路:
1. 这是主题学习，需要完整流程
2. 查 MQL5.hhc: 找到 "ONNX models" 整个章节
3. 按顺序阅读所有相关文档
4. 整合成教程

回答:
"使用ONNX模型预测价格的完整流程：

第一步: 准备模型 (参考 onnx_prepare.htm)
[Python训练模型的代码]

第二步: 在MQL5中加载模型 (参考 onnxcreate.htm)
[MQL5加载代码]

第三步: 准备输入数据
[数据准备代码]

第四步: 运行推理 (参考 onnxrun.htm)
[推理代码]

第五步: 处理结果
[结果处理代码]

完整示例:
[端到端的完整代码]

测试方法: (参考 onnx_test.htm)
[测试指南]

注意事项:
- 数据类型转换
- 输入输出维度
- 性能优化

参考文档:
- onnx.htm (概述)
- onnx_intro.htm (简介)
- onnx_prepare.htm (准备)
- onnx_mql5.htm (使用)
"
```

---

## ⚠️ 注意事项

### DO ✅
- 始终先查看 MQL5.hhc 理解结构
- 提供基于官方文档的准确信息
- 包含完整可运行的代码示例
- 引用具体的文档文件名
- 考虑用户可能的后续问题

### DON'T ❌
- 不要猜测API，必须查阅文档
- 不要提供过时或错误的语法
- 不要忽略重要的参数或返回值
- 不要跳过错误处理
- 不要提供没有上下文的代码片段

---

## 📊 文档覆盖范围

本文档库包含：
- ✅ 完整的语言语法
- ✅ 所有内置函数 (1000+)
- ✅ 所有标准库类 (500+)
- ✅ 技术指标完整文档
- ✅ 交易API完整文档
- ✅ ONNX机器学习
- ✅ Python集成
- ✅ OpenCL并行计算
- ✅ 图形界面
- ✅ 数据库操作
- ✅ 网络通信
- ✅ 文件处理

---

## 🚀 性能提示

### 对于简单问题
直接查找单个文件即可（如某个函数的用法）

### 对于复杂问题
1. 先查 MQL5.hhc 理解相关主题的结构
2. 阅读多个相关文档
3. 整合信息给出完整答案

### 对于学习类问题
按照文档的组织顺序引导用户（如ONNX教程）

---

**记住**: MQL5.hhc 是你的最好朋友！先看它，再找文件，最后给答案。
