import { type ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  header: string
  key: string
  cell: (row: T) => ReactNode
  primary?: boolean
  hideOnMobile?: boolean
  mobileCell?: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor: (row: T) => string
  rowLink?: (row: T) => string
  cardFooter?: (row: T) => ReactNode
  emptyMessage?: string
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  rowLink,
  cardFooter,
  emptyMessage = 'データがありません。',
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  const primaryCol = columns.find((c) => c.primary)
  const secondaryColumns = columns.filter(
    (c) => !c.primary && !c.hideOnMobile,
  )

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 font-medium',
                    col.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3',
                      col.align === 'right' && 'text-right',
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {data.map((row) => {
          const card = (
            <div className="rounded-lg border bg-card p-4">
              {primaryCol && (
                <div className="mb-2 font-medium">
                  {primaryCol.mobileCell
                    ? primaryCol.mobileCell(row)
                    : primaryCol.cell(row)}
                </div>
              )}
              <div className="space-y-1.5">
                {secondaryColumns.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{col.header}</span>
                    <span>
                      {col.mobileCell ? col.mobileCell(row) : col.cell(row)}
                    </span>
                  </div>
                ))}
              </div>
              {cardFooter && (
                <div className="mt-3 border-t pt-3">{cardFooter(row)}</div>
              )}
            </div>
          )

          const key = keyExtractor(row)

          if (rowLink && !cardFooter) {
            return (
              <Link key={key} to={rowLink(row)} className="block">
                {card}
              </Link>
            )
          }

          return <div key={key}>{card}</div>
        })}
      </div>
    </>
  )
}
