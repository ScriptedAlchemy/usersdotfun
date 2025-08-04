import type { SourceItem } from "@usersdotfun/shared-types/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";

interface ItemViewProps {
  data: SourceItem;
}

export function ItemView({ data }: ItemViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Item Overview</h3>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div className="font-semibold">Processed At</div>
          <div>
            {data.processedAt
              ? new Date(data.processedAt).toLocaleString()
              : "N/A"}
          </div>
          <div className="font-semibold">Created At</div>
          <div>{new Date(data.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div>
        <h3 className="font-medium">Data</h3>
        <div className="mt-2 space-y-4">
          <Tabs defaultValue="data" className="mt-4">
            <TabsList>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>
            <TabsContent value="data">
              <pre className="p-2 bg-gray-100 rounded-md text-xs">
                {JSON.stringify(data.data, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
