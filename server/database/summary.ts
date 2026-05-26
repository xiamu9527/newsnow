import process from "node:process"
import type { Database } from "db0"

export interface SummaryRow {
  id: string
  column_id: string
  date: string
  period: string
  title: string
  summary: string
  tags: string
  news_items: string
  news_count: number
  updated: number
}

export interface SummaryRecord {
  id: string
  columnId: string
  columnName: string
  date: string
  period: string
  title: string
  summary: string
  tags: string[]
  newsCount: number
  updatedTime: number
}

export interface SummaryDetail extends SummaryRecord {
  newsItems: NewsItemBrief[]
}

export interface NewsItemBrief {
  id: string
  title: string
  url: string
  source: string
  sourceName: string
}

export class SummaryTable {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  async init() {
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS summaries (
        id TEXT PRIMARY KEY,
        column_id TEXT NOT NULL,
        date TEXT NOT NULL,
        period TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        tags TEXT NOT NULL,
        news_items TEXT NOT NULL,
        news_count INTEGER NOT NULL,
        updated INTEGER NOT NULL
      );
    `).run()
    logger.success("init summaries table")
  }

  async set(record: Omit<SummaryRow, "updated">) {
    const now = Date.now()
    await this.db.prepare(
      `INSERT OR REPLACE INTO summaries (id, column_id, date, period, title, summary, tags, news_items, news_count, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      record.id,
      record.column_id,
      record.date,
      record.period,
      record.title,
      record.summary,
      record.tags,
      record.news_items,
      record.news_count,
      now,
    )
    logger.success(`set summary: ${record.id}`)
  }

  async get(id: string): Promise<SummaryRow | undefined> {
    const row = (await this.db.prepare(
      `SELECT * FROM summaries WHERE id = ?`,
    ).get(id)) as SummaryRow | undefined
    return row
  }

  async getByColumnAndDate(columnId: string, date: string): Promise<SummaryRow[]> {
    const res = await this.db.prepare(
      `SELECT * FROM summaries WHERE column_id = ? AND date = ? ORDER BY period ASC`,
    ).all(columnId, date) as any
    return (res.results ?? res) as SummaryRow[]
  }

  async getLatest(): Promise<SummaryRow[]> {
    const res = await this.db.prepare(
      `SELECT * FROM summaries WHERE date = (SELECT date FROM summaries ORDER BY updated DESC LIMIT 1) ORDER BY column_id, period`,
    ).all() as any
    return (res.results ?? res) as SummaryRow[]
  }

  async getAllTags(): Promise<{ name: string, count: number }[]> {
    const rows = (await this.db.prepare(
      `SELECT tags FROM summaries ORDER BY updated DESC LIMIT 50`,
    ).all() as any) as { tags: string }[]

    const tagMap = new Map<string, number>()
    for (const row of rows) {
      try {
        const tags = JSON.parse(row.tags) as string[]
        for (const tag of tags) {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
        }
      } catch {}
    }

    return Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)
  }
}

export async function getSummaryTable() {
  try {
    const db = useDatabase()
    if (process.env.ENABLE_CACHE === "false") return
    const table = new SummaryTable(db)
    if (process.env.INIT_TABLE !== "false") await table.init()
    return table
  } catch (e) {
    logger.error("failed to init summary table ", e)
  }
}
