import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

interface CommonSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  loadingText?: string;
}

export function CommonSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  isLoading = false,
  loadingText = "Loading details...",
}: CommonSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "sm:max-w-[600px] overflow-y-auto p-4 md:p-6",
          className,
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse">{loadingText}</div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <SheetHeader className="mb-4">
              <SheetTitle>{title}</SheetTitle>
              {description && (
                <SheetDescription>{description}</SheetDescription>
              )}
            </SheetHeader>
            <div className="flex-grow overflow-y-auto space-y-6">
              {children}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
