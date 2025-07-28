import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

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
  className = "sm:max-w-[600px] overflow-y-auto",
  isLoading = false,
  loadingText = "Loading details...",
}: CommonSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className={className}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse">{loadingText}</div>
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              {description && (
                <SheetDescription>{description}</SheetDescription>
              )}
            </SheetHeader>
            
            <div className="space-y-6 py-4">
              {children}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
