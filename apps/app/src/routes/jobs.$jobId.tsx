import { createFileRoute } from '@tanstack/react-router'
import { fetchJob } from '../utils/jobs'
import { NotFound } from '~/components/NotFound'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { type PipelineStep } from '@usersdotfun/shared-db'

export const Route = createFileRoute('/jobs/$jobId')({
  loader: ({ params: { jobId } }) => fetchJob({ data: jobId }),
  component: JobComponent,
  notFoundComponent: () => {
    return <NotFound>Job not found</NotFound>
  },
})

function JobComponent() {
  const job = Route.useLoaderData()

  const table = useReactTable({
    data: job.steps,
    columns: [
      {
        accessorKey: 'stepId',
        header: 'Step ID',
      },
      {
        accessorKey: 'pluginName',
        header: 'Plugin',
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        accessorKey: 'input',
        header: 'Input',
        cell: ({ getValue }) => <pre>{JSON.stringify(getValue(), null, 2)}</pre>,
      },
      {
        accessorKey: 'output',
        header: 'Output',
        cell: ({ getValue }) => <pre>{JSON.stringify(getValue(), null, 2)}</pre>,
      },
      {
        accessorKey: 'error',
        header: 'Error',
        cell: ({ getValue }) => <pre>{JSON.stringify(getValue(), null, 2)}</pre>,
      },
      {
        accessorKey: 'startedAt',
        header: 'Started',
        cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed',
        cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
      },
    ],
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{job.name}</h4>
      <div className="text-sm">{job.schedule}</div>
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
