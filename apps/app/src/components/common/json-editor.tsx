import { json } from "@codemirror/lang-json";
import { Diagnostic, linter, lintGutter, LintSource } from "@codemirror/lint";
import CodeMirror from "@uiw/react-codemirror";
import JSON5 from "json5";
import { CheckCircle, Copy, Edit, Eye, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z, ZodError } from "zod";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

const formatZodErrors = (error: ZodError): string[] => {
  const tree = z.treeifyError(error);

  const processNode = (node: any, currentPath: string): string[] => {
    if (!node || typeof node !== "object") {
      return [];
    }

    let messages: string[] = [];

    if (node.errors && Array.isArray(node.errors) && node.errors.length > 0) {
      messages.push(
        ...node.errors.map((e: string) => {
          const prefix = currentPath ? `${currentPath}: ` : "";
          return `${prefix}${e}`;
        })
      );
    }

    if (node.properties && typeof node.properties === "object") {
      for (const key in node.properties) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        messages.push(...processNode(node.properties[key], newPath));
      }
    }

    return messages;
  };

  const errorMessages = processNode(tree, "");
  return [...new Set(errorMessages)].filter(Boolean);
};

interface JsonEditorProps<T> {
  value: T | null;
  onChange: (value: T | null) => void;
  schema: z.ZodType<T>;
  readOnly?: boolean;
  className?: string;
}

export function JsonEditor<T>({
  value,
  onChange,
  schema,
  readOnly = false,
  className,
}: JsonEditorProps<T>) {
  const [jsonString, setJsonString] = useState("");
  const [isEditing, setIsEditing] = useState(!readOnly);
  const editorRef = useRef<any>(null);

  const formatJson = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return "{}";
    }
  };

  useEffect(() => {
    if (editorRef.current?.view?.hasFocus) return;
    setJsonString(value ? formatJson(value) : "{}");
  }, [value]);

  const { isValid, validationErrors } = useMemo(() => {
    try {
      const parsed = JSON5.parse(jsonString);
      const result = schema.safeParse(parsed);
      if (result.success) {
        return { isValid: true, validationErrors: [] };
      } else {
        return {
          isValid: false,
          validationErrors: formatZodErrors(result.error),
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        validationErrors: [`Invalid JSON syntax: ${error.message}`],
      };
    }
  }, [jsonString, schema]);

  const jsonLinter: LintSource = useMemo(() => {
    return (view): Diagnostic[] => {
      if (isValid) return [];

      if (validationErrors.length > 0) {
        return [
          {
            from: 0,
            to: view.state.doc.length,
            severity: "error",
            message: validationErrors.join("; "),
          },
        ];
      }
      return [];
    };
  }, [isValid, validationErrors]);

  const handleJsonChange = (newValue: string) => {
    setJsonString(newValue);
    try {
      const parsed = JSON5.parse(newValue);
      const result = schema.safeParse(parsed);
      if (result.success) {
        onChange(result.data);
      } else {
        onChange(null);
      }
    } catch {
      onChange(null);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON5.parse(jsonString);
      const formatted = formatJson(parsed);
      setJsonString(formatted);
      handleJsonChange(formatted);
    } catch {
      // Linter will show the error
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const toggleEditMode = () => {
    if (!readOnly) {
      setIsEditing(!isEditing);
    }
  };

  if (!isEditing) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <Label>Job Definition (JSON)</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8"
            >
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleEditMode}
              className="h-8"
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </div>
        <pre className="bg-muted/50 dark:bg-muted/30 p-3 rounded-md text-sm overflow-auto max-h-96 border text-foreground font-mono">
          {jsonString || "No job definition"}
        </pre>
        {!isValid && validationErrors.length > 0 && (
          <Alert variant="destructive" className="mt-2">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {" "}
              <ul>
                {validationErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="json-editor">Job Definition (JSON)</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFormat}
            className="h-8"
          >
            Format
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8"
          >
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleEditMode}
              className="h-8"
            >
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border">
        <CodeMirror
          ref={editorRef}
          value={jsonString}
          height="500px"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
            bracketMatching: true,
            autocompletion: true,
          }}
          extensions={[
            json(),
            linter(jsonLinter, { delay: 300 }),
            lintGutter(),
          ]}
          onChange={handleJsonChange}
          readOnly={readOnly}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {isValid ? (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" /> Valid JSON
            </div>
          ) : (
            <div className="flex items-center text-red-600 text-sm">
              <XCircle className="h-4 w-4 mr-1" /> Invalid JSON
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {jsonString.length} characters
        </div>
      </div>
      {!isValid && validationErrors.length > 0 && (
        <Alert variant="destructive" className="mt-2">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <ul>
              {validationErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
