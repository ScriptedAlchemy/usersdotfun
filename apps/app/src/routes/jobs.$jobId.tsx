import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getJob } from "~/api/jobs";
import { NotFound } from "~/components/NotFound";

export const Route = createFileRoute("/jobs/$jobId")({
  loader: ({ context: { queryClient }, params: { jobId } }) =>
    queryClient.ensureQueryData({
      queryKey: ["job", jobId],
      queryFn: () => getJob(jobId),
    }),
  component: JobComponent,
  notFoundComponent: () => {
    return <NotFound>Job not found</NotFound>;
  },
});

function JobComponent() {
  const { jobId } = Route.useParams();
  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
  });

  const table = useReactTable({
    data: job?.steps ?? [],
    columns: [
      {
        accessorKey: "stepId",
        header: "Step ID",
      },
      {
        accessorKey: "pluginName",
        header: "Plugin",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "input",
        header: "Input",
        cell: ({ getValue }) => (
          <pre>{JSON.stringify(getValue(), null, 2)}</pre>
        ),
      },
      {
        accessorKey: "output",
        header: "Output",
        cell: ({ getValue }) => (
          <pre>{JSON.stringify(getValue(), null, 2)}</pre>
        ),
      },
      {
        accessorKey: "error",
        header: "Error",
        cell: ({ getValue }) => (
          <pre>{JSON.stringify(getValue(), null, 2)}</pre>
        ),
      },
      {
        accessorKey: "startedAt",
        header: "Started",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue() as string).toLocaleString() : "N/A",
      },
      {
        accessorKey: "completedAt",
        header: "Completed",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue() as string).toLocaleString() : "N/A",
      },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!job) return <NotFound>Job not found</NotFound>;

  return (
    <div className="space-y-2 p-2">
      <h4 className="text-xl font-bold underline">{job.name}</h4>
      <div className="text-sm">{job.schedule}</div>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-2 border-b text-left">
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-2 border-b">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
