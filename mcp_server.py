#!/usr/bin/env python3
"""
MQL5 Documentation MCP Server
为AI编程工具提供MQL5文档查询服务
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from html.parser import HTMLParser
import asyncio

# 尝试导入MCP SDK
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    print("错误: 需要安装 mcp 包", file=sys.stderr)
    print("请运行: pip install mcp", file=sys.stderr)
    sys.exit(1)


class HTMLTextExtractor(HTMLParser):
    """从HTML中提取纯文本内容"""
    
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.in_script = False
        self.in_style = False
    
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            if tag == 'script':
                self.in_script = True
            else:
                self.in_style = True
    
    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
        elif tag == 'style':
            self.in_style = False
    
    def handle_data(self, data):
        if not (self.in_script or self.in_style):
            text = data.strip()
            if text:
                self.text_parts.append(text)
    
    def get_text(self) -> str:
        return ' '.join(self.text_parts)


class MQL5DocServer:
    """MQL5文档MCP服务器"""
    
    def __init__(self, doc_path: str):
        self.doc_path = Path(doc_path)
        self.server = Server("mql5-help")
        self.index_cache: Optional[Dict[str, str]] = None
        
        # 注册工具
        self._register_tools()
    
    def _register_tools(self):
        """注册MCP工具"""
        
        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            return [
                Tool(
                    name="search_mql5_docs",
                    description="搜索MQL5文档。可以搜索函数名、类名、关键字等。返回相关文档列表。",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "搜索关键词，例如：OrderSend, CopyBuffer, OnTick等"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "返回结果数量限制",
                                "default": 10
                            }
                        },
                        "required": ["query"]
                    }
                ),
                Tool(
                    name="get_mql5_doc",
                    description="获取指定MQL5文档的详细内容。使用文档文件名（如：ordersend.htm）或通过搜索获得的文档名。",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "filename": {
                                "type": "string",
                                "description": "文档文件名，例如：ordersend.htm, ctrade.htm等"
                            }
                        },
                        "required": ["filename"]
                    }
                ),
                Tool(
                    name="browse_mql5_categories",
                    description="浏览MQL5文档分类目录。可以查看文档的组织结构和主要章节。",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "category": {
                                "type": "string",
                                "description": "分类名称（可选），如：trading, indicators, math等",
                                "default": ""
                            }
                        }
                    }
                ),
                Tool(
                    name="get_mql5_error_info",
                    description="查询MQL5错误码信息。根据错误码或错误描述查找详细说明。",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "error_code_or_desc": {
                                "type": "string",
                                "description": "错误码（如：4001）或错误描述关键字"
                            }
                        },
                        "required": ["error_code_or_desc"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Any) -> List[TextContent]:
            """处理工具调用"""
            try:
                if name == "search_mql5_docs":
                    query = arguments.get("query", "")
                    limit = arguments.get("limit", 10)
                    results = await self.search_docs(query, limit)
                    return [TextContent(type="text", text=results)]
                
                elif name == "get_mql5_doc":
                    filename = arguments.get("filename", "")
                    content = await self.get_doc_content(filename)
                    return [TextContent(type="text", text=content)]
                
                elif name == "browse_mql5_categories":
                    category = arguments.get("category", "")
                    categories = await self.browse_categories(category)
                    return [TextContent(type="text", text=categories)]
                
                elif name == "get_mql5_error_info":
                    error_info = arguments.get("error_code_or_desc", "")
                    result = await self.get_error_info(error_info)
                    return [TextContent(type="text", text=result)]
                
                else:
                    return [TextContent(type="text", text=f"未知工具: {name}")]
            
            except Exception as e:
                error_msg = f"工具执行错误: {str(e)}"
                return [TextContent(type="text", text=error_msg)]
    
    def _build_index(self) -> Dict[str, str]:
        """构建文档索引"""
        if self.index_cache:
            return self.index_cache
        
        index = {}
        
        # 扫描所有.htm文件
        for htm_file in self.doc_path.glob("*.htm"):
            filename = htm_file.name
            # 从文件名生成关键词（去掉.htm，转换为小写）
            key = filename[:-4].lower()
            index[key] = filename
            
            # 添加常见变体
            if key.startswith('c'):
                # C开头的类名，也添加不带C的版本
                index[key[1:]] = filename
        
        self.index_cache = index
        return index
    
    async def search_docs(self, query: str, limit: int = 10) -> str:
        """搜索文档"""
        query_lower = query.lower()
        index = self._build_index()
        
        # 精确匹配
        if query_lower in index:
            exact_match = [(query_lower, index[query_lower])]
        else:
            exact_match = []
        
        # 模糊匹配
        fuzzy_matches = []
        for key, filename in index.items():
            if query_lower in key:
                score = len(query_lower) / len(key)  # 相似度评分
                fuzzy_matches.append((score, key, filename))
        
        # 按相似度排序
        fuzzy_matches.sort(reverse=True, key=lambda x: x[0])
        
        # 组合结果
        results = []
        
        if exact_match:
            results.append(f"📌 精确匹配:\n")
            for key, filename in exact_match:
                results.append(f"  • {filename} (关键字: {key})")
        
        if fuzzy_matches:
            results.append(f"\n🔍 相关文档 (找到 {len(fuzzy_matches)} 个):\n")
            for i, (score, key, filename) in enumerate(fuzzy_matches[:limit]):
                results.append(f"  {i+1}. {filename} (匹配度: {score:.0%}, 关键字: {key})")
        
        if not exact_match and not fuzzy_matches:
            results.append(f"❌ 未找到与 '{query}' 相关的文档")
            results.append(f"\n💡 提示: 尝试使用英文关键字，如：OrderSend, CopyBuffer, OnTick 等")
        
        return "\n".join(results)
    
    async def get_doc_content(self, filename: str) -> str:
        """获取文档内容"""
        # 确保文件名有.htm后缀
        if not filename.endswith('.htm'):
            filename = filename + '.htm'
        
        file_path = self.doc_path / filename
        
        if not file_path.exists():
            # 尝试搜索
            search_results = await self.search_docs(filename[:-4], limit=3)
            return f"❌ 文件不存在: {filename}\n\n建议:\n{search_results}"
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # 提取文本内容
            parser = HTMLTextExtractor()
            parser.feed(html_content)
            text_content = parser.get_text()
            
            # 格式化输出
            result = [
                f"📄 文档: {filename}",
                f"{'='*60}",
                "",
                text_content[:8000],  # 限制长度避免过长
                "",
                f"{'='*60}",
                f"💡 提示: 这是从HTML提取的文本内容，完整内容请查看原文件"
            ]
            
            return "\n".join(result)
        
        except Exception as e:
            return f"❌ 读取文档失败: {str(e)}"
    
    async def browse_categories(self, category: str = "") -> str:
        """浏览文档分类"""
        categories = {
            "trading": ["ordersend", "ordercheck", "positionselect", "ctrade"],
            "indicators": ["icustom", "copybuffer", "indicatorcreate"],
            "math": ["mathabs", "mathsin", "mathcos", "mathrandom"],
            "array": ["arrayresize", "arraysize", "arraycopy", "arraysort"],
            "string": ["stringfind", "stringsplit", "stringreplace"],
            "datetime": ["timecurrent", "timelocal", "timetostruct"],
            "files": ["fileopen", "fileclose", "filewrite", "fileread"],
            "chart": ["chartopen", "chartid", "chartredraw"],
            "objects": ["objectcreate", "objectdelete", "objectset"],
            "events": ["ontick", "oninit", "ondeinit", "oncalculate"]
        }
        
        if not category:
            result = ["📚 MQL5 文档分类目录", "="*60, ""]
            for cat, docs in categories.items():
                result.append(f"📁 {cat.upper()}: {len(docs)} 个文档")
            result.append("")
            result.append("💡 使用 browse_mql5_categories(category='trading') 查看具体分类")
            return "\n".join(result)
        
        category_lower = category.lower()
        if category_lower in categories:
            result = [
                f"📁 分类: {category_lower.upper()}",
                "="*60,
                ""
            ]
            for doc in categories[category_lower]:
                result.append(f"  • {doc}.htm")
            return "\n".join(result)
        else:
            return f"❌ 未知分类: {category}\n\n可用分类: {', '.join(categories.keys())}"
    
    async def get_error_info(self, error_info: str) -> str:
        """获取错误信息"""
        # 查找错误码文档
        error_files = ["errorcodes.htm", "errors.htm", "errorscompile.htm"]
        
        results = []
        for filename in error_files:
            file_path = self.doc_path / filename
            if file_path.exists():
                content = await self.get_doc_content(filename)
                if error_info.lower() in content.lower():
                    results.append(f"\n📄 在 {filename} 中找到相关信息:\n{content}")
        
        if results:
            return "\n".join(results)
        else:
            return f"❌ 未找到错误码 '{error_info}' 的相关信息\n\n💡 尝试查看 errorcodes.htm 获取完整错误码列表"
    
    async def run(self):
        """运行MCP服务器"""
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                self.server.create_initialization_options()
            )


async def main():
    """主函数"""
    # 获取当前脚本所在目录
    current_dir = Path(__file__).parent
    
    print(f"📚 MQL5 文档 MCP 服务器", file=sys.stderr)
    print(f"📂 文档目录: {current_dir}", file=sys.stderr)
    print(f"🚀 服务器启动中...", file=sys.stderr)
    
    server = MQL5DocServer(str(current_dir / "MQL5_HELP"))
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())
