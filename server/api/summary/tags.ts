import { getSummaryTable } from "#/database/summary"

export default defineEventHandler(async (event) => {
  try {
    const summaryTable = await getSummaryTable()
    if (!summaryTable) {
      throw createError({ statusCode: 500, message: "Database not available" })
    }

    const tags = await summaryTable.getAllTags()

    return { tags }
  } catch (e: any) {
    logger.error(e)
    throw createError({
      statusCode: 500,
      message: e instanceof Error ? e.message : "Internal Server Error",
    })
  }
})
