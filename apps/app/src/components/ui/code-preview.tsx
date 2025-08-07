import * as React from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CodePreviewProps extends React.ComponentProps<"pre"> {
  code: string | object;
  language?: string;
  showCopy?: boolean;
  maxHeight?: string;
}

function CodePreview({
  code,
  language = "json",
  showCopy = true,
  maxHeight = "24rem",
  className,
  ...props
}: CodePreviewProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const formattedCode = React.useMemo(() => {
    if (language === "json" && typeof code === "object") {
      return JSON.stringify(code, null, 2);
    }
    if (typeof code === "object") {
      return JSON.stringify(code, null, 2);
    }
    return code;
  }, [code, language]);

  return (
    <div className="relative group">
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
      <pre
        className={cn(
          "relative overflow-auto rounded-md border bg-muted/50 p-4 text-sm font-mono",
          "dark:bg-muted/30 dark:border-border",
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          className
        )}
        style={{ maxHeight }}
        {...props}
      >
        <code className="text-foreground">{formattedCode}</code>
      </pre>
    </div>
  );
}

export { CodePreview };
