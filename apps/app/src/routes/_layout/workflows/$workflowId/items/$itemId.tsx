import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { CommonSheet } from "~/components/common/common-sheet";
import { Item } from "~/components/items";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { workflowItemsQueryOptions } from "~/lib/queries";

export const Route = createFileRoute(
  "/_layout/workflows/$workflowId/items/$itemId"
)({
  component: ItemDetailsPage,
  loader: async ({
    params: { workflowId, itemId },
    context: { queryClient },
  }) => {
    const items = await queryClient.ensureQueryData(
      workflowItemsQueryOptions(workflowId)
    );
    const item = items?.find((i) => i.id === itemId);

    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    return { item, workflowId };
  },
  pendingComponent: () => (
    <CommonSheet
      isOpen={true}
      onClose={() => {}}
      title="Loading..."
      description="Loading item details..."
      className="sm:max-w-3xl"
    >
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </CommonSheet>
  ),
  errorComponent: ({ error, reset }) => (
    <CommonSheet
      isOpen={true}
      onClose={() => window.history.back()}
      title="Error"
      description="Failed to load item details"
      className="sm:max-w-3xl"
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load item details</AlertTitle>
        <AlertDescription className="mb-4">
          {error.message || "An unexpected error occurred"}
        </AlertDescription>
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
      </Alert>
    </CommonSheet>
  ),
});

function ItemDetailsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { item, workflowId } = useLoaderData({ from: Route.id });

  const handleClose = () => {
    navigate({
      to: "/workflows/$workflowId/items",
      params: { workflowId },
    });
  };

  return (
    <CommonSheet
      isOpen={true}
      onClose={handleClose}
      title={`Item: ${item.id.slice(0, 12)}...`}
      description="Detailed view of a specific source item."
      className="sm:max-w-3xl"
    >
      <Item data={item} />
    </CommonSheet>
  );
}
