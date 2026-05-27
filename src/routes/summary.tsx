import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useTitle } from "react-use"

export const Route = createFileRoute("/summary")({
  component: SummaryPage,
  validateSearch: (search: Record<string, unknown>): { id?: string } => {
    return {
      id: search.id as string | undefined,
    }
  },
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

interface NewsItemBrief {
  id: string
  title: string
  url: string
  source: string
  sourceName: string
}

interface SummaryDetail extends SummaryRecord {
  newsItems: NewsItemBrief[]
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
  const { id } = Route.useSearch() as { id?: string }

  if (id) {
    return <SummaryDetail id={id} />
  }

  return <SummaryList />
}

function SummaryList() {
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
      to="/summary"
      search={{ id: summary.id }}
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

function SummaryDetail({ id }: { id: string }) {
  useTitle("NewsNow | 摘要详情")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["summary", "detail", id],
    queryFn: async () => {
      return await myFetch(`/summary/detail?id=${id}`) as SummaryDetail
    },
    staleTime: 1000 * 60 * 10,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="i-ph:circle-dashed-duotone text-4xl animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20 text-neutral-500">
        <div className="i-ph:warning-circle-duotone text-4xl mb-4" />
        <p>加载失败</p>
        <Link to="/summary" className="text-primary text-sm mt-4 inline-block hover:underline">
          返回摘要列表
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          to="/summary"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-primary transition-colors mb-4"
        >
          <div className="i-ph:arrow-left-duotone" />
          返回摘要列表
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 color-primary">
            {data.columnName}
          </span>
          <span className="text-xs text-neutral-400">
            {data.date} {periodLabels[data.period] || data.period}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-4">{data.title}</h1>

        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <p className="text-base leading-relaxed whitespace-pre-line">{data.summary}</p>
        </div>

        {data.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {data.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-sm bg-primary/10 color-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">新闻列表</h2>
          <span className="text-sm text-neutral-400">{data.newsCount} 条</span>
        </div>

        <div className="space-y-1">
          {data.newsItems?.map((item, index) => (
            <a
              key={`${item.source}-${item.id}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={$(
                "flex items-start gap-3 p-3 rounded-lg transition-all",
                "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                "group",
              )}
            >
              <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </p>
                <span className="text-xs text-neutral-400 mt-1 inline-block">
                  {item.sourceName}
                </span>
              </div>
              <div className="i-ph:arrow-square-out-duotone shrink-0 text-neutral-300 group-hover:text-primary transition-colors mt-0.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
