/**
 * MQL5 Error Database Module
 * 本地SQLite数据库,存储和查询MQL5编译错误案例
 */

import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 错误记录接口
export interface ErrorRecord {
  id?: number;
  error_code: string;           // 错误代码 (如 "E512", "E308")
  error_message: string;         // 完整错误消息
  file_path?: string;            // 发生错误的文件路径 (可选,隐私考虑)
  solution?: string;             // 解决方案描述
  related_docs?: string;         // 相关文档链接(JSON数组)
  occurrence_count: number;      // 出现次数
  first_seen: string;            // 首次遇到时间 (ISO 8601)
  last_seen: string;             // 最后遇到时间 (ISO 8601)
}

// 搜索结果接口
export interface ErrorSearchResult extends ErrorRecord {
  relevance_score?: number;      // 相似度分数 (0-1)
}

class ErrorDatabase {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    // 数据库存放在用户主目录,避免多项目冲突
    const configDir = join(homedir(), '.mql5-help-mcp');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    this.dbPath = join(configDir, 'mql5_errors.db');
  }

  /**
   * 初始化数据库连接
   */
  private initDb(): Database.Database {
    if (this.db) return this.db;

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL'); // 提高并发性能

    // 创建错误记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS error_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        error_code TEXT NOT NULL,
        error_message TEXT NOT NULL,
        file_path TEXT,
        solution TEXT,
        related_docs TEXT,
        occurrence_count INTEGER DEFAULT 1,
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        UNIQUE(error_code, error_message)
      );
    `);

    // 创建索引以提高查询速度
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_error_code ON error_records(error_code);
      CREATE INDEX IF NOT EXISTS idx_last_seen ON error_records(last_seen DESC);
      CREATE INDEX IF NOT EXISTS idx_occurrence_count ON error_records(occurrence_count DESC);
    `);

    return this.db;
  }

  /**
   * 添加或更新错误记录
   */
  addError(record: Omit<ErrorRecord, 'id' | 'occurrence_count' | 'first_seen' | 'last_seen'>): ErrorRecord {
    const db = this.initDb();
    const now = new Date().toISOString();

    // 尝试查找现有记录
    const existing = db.prepare(`
      SELECT * FROM error_records 
      WHERE error_code = ? AND error_message = ?
    `).get(record.error_code, record.error_message) as ErrorRecord | undefined;

    if (existing) {
      // 更新现有记录:增加计数,更新时间和解决方案
      const stmt = db.prepare(`
        UPDATE error_records 
        SET occurrence_count = occurrence_count + 1,
            last_seen = ?,
            solution = COALESCE(?, solution),
            file_path = COALESCE(?, file_path),
            related_docs = COALESCE(?, related_docs)
        WHERE id = ?
      `);
      stmt.run(now, record.solution, record.file_path, record.related_docs, existing.id);
      
      return {
        ...existing,
        occurrence_count: existing.occurrence_count + 1,
        last_seen: now,
        solution: record.solution || existing.solution,
        file_path: record.file_path || existing.file_path,
        related_docs: record.related_docs || existing.related_docs
      };
    } else {
      // 插入新记录
      const stmt = db.prepare(`
        INSERT INTO error_records (error_code, error_message, file_path, solution, related_docs, occurrence_count, first_seen, last_seen)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `);
      const result = stmt.run(
        record.error_code,
        record.error_message,
        record.file_path,
        record.solution,
        record.related_docs,
        now,
        now
      );

      return {
        id: result.lastInsertRowid as number,
        ...record,
        occurrence_count: 1,
        first_seen: now,
        last_seen: now
      };
    }
  }

  /**
   * 精确查询错误记录
   */
  searchError(errorCode: string, errorMessage?: string): ErrorSearchResult[] {
    const db = this.initDb();

    if (errorMessage) {
      // 精确匹配:错误代码 + 消息
      const stmt = db.prepare(`
        SELECT * FROM error_records 
        WHERE error_code = ? AND error_message LIKE ?
        ORDER BY occurrence_count DESC, last_seen DESC
        LIMIT 10
      `);
      return stmt.all(errorCode, `%${errorMessage}%`) as ErrorSearchResult[];
    } else {
      // 仅匹配错误代码
      const stmt = db.prepare(`
        SELECT * FROM error_records 
        WHERE error_code = ?
        ORDER BY occurrence_count DESC, last_seen DESC
        LIMIT 10
      `);
      return stmt.all(errorCode) as ErrorSearchResult[];
    }
  }

  /**
   * 模糊搜索相似错误(基于关键词)
   */
  searchSimilarErrors(keywords: string): ErrorSearchResult[] {
    const db = this.initDb();

    // 分词并构建LIKE查询
    const terms = keywords.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (terms.length === 0) return [];

    const likeConditions = terms.map(() => `(LOWER(error_message) LIKE ? OR LOWER(solution) LIKE ?)`).join(' AND ');
    const params = terms.flatMap(term => [`%${term}%`, `%${term}%`]);

    const stmt = db.prepare(`
      SELECT * FROM error_records 
      WHERE ${likeConditions}
      ORDER BY occurrence_count DESC, last_seen DESC
      LIMIT 10
    `);

    const results = stmt.all(...params) as ErrorSearchResult[];

    // 计算简单的相似度分数(匹配项数量)
    results.forEach(record => {
      const matchCount = terms.filter(term =>
        record.error_message.toLowerCase().includes(term) ||
        (record.solution && record.solution.toLowerCase().includes(term))
      ).length;
      record.relevance_score = matchCount / terms.length;
    });

    return results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  }

  /**
   * 获取高频错误TOP N
   */
  listCommonErrors(limit: number = 10): ErrorRecord[] {
    const db = this.initDb();
    const stmt = db.prepare(`
      SELECT * FROM error_records 
      ORDER BY occurrence_count DESC, last_seen DESC
      LIMIT ?
    `);
    return stmt.all(limit) as ErrorRecord[];
  }

  /**
   * 导出错误数据库(JSON格式,可选脱敏)
   */
  exportErrors(anonymize: boolean = false): string {
    const db = this.initDb();
    const allErrors = db.prepare('SELECT * FROM error_records ORDER BY occurrence_count DESC').all() as ErrorRecord[];

    if (anonymize) {
      // 移除敏感的文件路径信息
      allErrors.forEach(err => {
        delete err.file_path;
      });
    }

    return JSON.stringify(allErrors, null, 2);
  }

  /**
   * 导入错误数据库(JSON格式)
   */
  importErrors(jsonData: string): { imported: number; updated: number; errors: number } {
    const db = this.initDb();
    let imported = 0;
    let updated = 0;
    let errors = 0;

    try {
      const records = JSON.parse(jsonData) as ErrorRecord[];

      for (const record of records) {
        try {
          const existing = db.prepare(`
            SELECT id FROM error_records 
            WHERE error_code = ? AND error_message = ?
          `).get(record.error_code, record.error_message) as { id: number } | undefined;

          if (existing) {
            // 更新现有记录(保留更大的计数)
            db.prepare(`
              UPDATE error_records 
              SET occurrence_count = MAX(occurrence_count, ?),
                  solution = COALESCE(?, solution),
                  related_docs = COALESCE(?, related_docs),
                  last_seen = MAX(last_seen, ?)
              WHERE id = ?
            `).run(record.occurrence_count, record.solution, record.related_docs, record.last_seen, existing.id);
            updated++;
          } else {
            // 插入新记录
            db.prepare(`
              INSERT INTO error_records (error_code, error_message, file_path, solution, related_docs, occurrence_count, first_seen, last_seen)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              record.error_code,
              record.error_message,
              record.file_path,
              record.solution,
              record.related_docs,
              record.occurrence_count,
              record.first_seen,
              record.last_seen
            );
            imported++;
          }
        } catch (err) {
          errors++;
          console.error(`Failed to import record: ${err}`);
        }
      }
    } catch (err) {
      throw new Error(`Failed to parse JSON: ${err}`);
    }

    return { imported, updated, errors };
  }

  /**
   * 获取数据库统计信息
   */
  getStats(): { totalErrors: number; totalOccurrences: number; dbPath: string } {
    const db = this.initDb();
    const result = db.prepare(`
      SELECT COUNT(*) as totalErrors, SUM(occurrence_count) as totalOccurrences
      FROM error_records
    `).get() as { totalErrors: number; totalOccurrences: number };

    return {
      ...result,
      dbPath: this.dbPath
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 单例实例
let dbInstance: ErrorDatabase | null = null;

export function getErrorDb(): ErrorDatabase {
  if (!dbInstance) {
    dbInstance = new ErrorDatabase();
  }
  return dbInstance;
}

export function closeErrorDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
