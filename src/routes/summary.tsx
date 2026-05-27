import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useTitle } from "react-use"

export const Route = createFileRoute("/summary")({
  component: SummaryPage,
})

interface SummaryRecord {
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

const periodLabels: Record<string, string> = {
  morning: "早间",
  noon: "午间",
  evening: "晚间",
}

const columnColors: Record<string, string> = {
  china: "red",
  world: "orange",
  tech: "blue",
  finance: "emerald",
}

function SummaryPage() {
  useTitle("NewsNow | AI 摘要")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["summaries", "latest"],
    queryFn: async () => {
      return await myFetch("/summary/latest") as {
        updatedTime: number
        summaries: SummaryRecord[]
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">AI 新闻摘要</h1>
        <p className="text-sm text-neutral-500">
          基于大模型自动整理的分类新闻综述，每天更新 3 次（07:00 / 12:00 / 19:00）
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="i-ph:circle-dashed-duotone text-4xl animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-neutral-500">
          <div className="i-ph:warning-circle-duotone text-4xl mb-4" />
          <p>加载失败，请稍后重试</p>
        </div>
      )}

      {data?.summaries && (
        <div className="grid gap-6 md:grid-cols-2">
          {data.summaries.map(summary => (
            <SummaryCard key={summary.id} summary={summary} />
          ))}
        </div>
      )}

      {data?.summaries?.length === 0 && (
        <div className="text-center py-20 text-neutral-500">
          <div className="i-ph:newspaper-duotone text-4xl mb-4" />
          <p>暂无摘要数据</p>
          <p className="text-sm mt-2">摘要将在下一个时段自动生成</p>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ summary }: { summary: SummaryRecord }) {
  const color = columnColors[summary.columnId] || "blue"

  return (
    <Link
      to="/summary/$id"
      params={{ id: summary.id }}
      className={$(
        "block rounded-2xl p-5 transition-all cursor-pointer",
        "bg-white dark:bg-neutral-900",
        "border border-neutral-200 dark:border-neutral-800",
        "hover:shadow-lg hover:border-primary/30",
        "group",
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${color}-500/10 color-${color}-600 dark:color-${color}-400`}>
          {summary.columnName}
        </span>
        <span className="text-xs text-neutral-400">
          {periodLabels[summary.period] || summary.period}
        </span>
        <span className="text-xs text-neutral-400 ml-auto">
          {summary.newsCount} 条新闻
        </span>
      </div>

      <h2 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {summary.title}
      </h2>

      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-3">
        {summary.summary}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {summary.tags?.slice(0, 5).map(tag => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  )
}
