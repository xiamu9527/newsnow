import { getSummaryTable } from "#/database/summary"
import type { SummaryRecord } from "#/database/summary"

const columnNames: Record<string, string> = {
  china: "国内",
  world: "国际",
  tech: "科技",
  finance: "财经",
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const columnId = query.column as string
    const date = query.date as string

    if (!columnId || !date) {
      throw createError({ statusCode: 400, message: "Missing required params: column, date" })
    }

    const summaryTable = await getSummaryTable()
    if (!summaryTable) {
      throw createError({ statusCode: 500, message: "Database not available" })
    }

    const rows = await summaryTable.getByColumnAndDate(columnId, date)

    const summaries: SummaryRecord[] = rows.map(row => ({
      id: row.id,
      columnId: row.column_id,
      columnName: columnNames[row.column_id] || row.column_id,
      date: row.date,
      period: row.period,
      title: row.title,
      summary: row.summary,
      tags: JSON.parse(row.tags),
      newsCount: row.news_count,
      updatedTime: row.updated,
    }))

    return {
      columnId,
      columnName: columnNames[columnId] || columnId,
      date,
      summaries,
    }
  } catch (e: any) {
    logger.error(e)
    throw createError({
      statusCode: e.statusCode || 500,
      message: e instanceof Error ? e.message : "Internal Server Error",
    })
  }
})
