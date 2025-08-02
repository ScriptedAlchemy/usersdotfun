import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useWorkflowItemsQuery } from "~/hooks/use-api";
import { ItemDetailsSheet } from "~/components/items/item-details-sheet";

export const Route = createFileRoute("/_layout/workflows/$workflowId/items/$itemId")({
  component: ItemDetailsPage,
});

function ItemDetailsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { workflowId, itemId } = useParams({ from: "/_layout/workflows/$workflowId/items/$itemId" });
  
  // There's no dedicated query for a single item, so we fetch all and find the one.
  // This is not ideal for performance but works for now.
  const { data: items, isLoading } = useWorkflowItemsQuery(workflowId);
  const item = items?.find((i) => i.id === itemId);

  const handleClose = () => {
    navigate({
      to: "/_layout/workflows/$workflowId/items",
      params: { workflowId },
    });
  };

  return (
    <ItemDetailsSheet
      item={item}
      isOpen={true}
      onClose={handleClose}
      isLoading={isLoading}
    />
  );
}
