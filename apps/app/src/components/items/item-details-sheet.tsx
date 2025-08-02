import { CommonSheet } from "~/components/common/common-sheet";
import type { SourceItem } from "@usersdotfun/shared-types/types";

interface ItemDetailsSheetProps {
  item?: SourceItem;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export function ItemDetailsSheet({
  item,
  isOpen,
  onClose,
  isLoading,
}: ItemDetailsSheetProps) {
  return (
    <CommonSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Item: ${item?.id.slice(0, 12) || ""}...`}
      description="History and details for a specific source item."
      isLoading={isLoading}
      loadingText="Loading item details..."
      className="sm:max-w-2xl"
    >
      {item && (
        <div>
          <p>Item details and reprocessing options will be displayed here.</p>
          <pre className="mt-4 bg-muted p-3 rounded-md text-xs">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
      )}
    </CommonSheet>
  );
}
