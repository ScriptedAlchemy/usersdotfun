import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { CheckCircle, XCircle, Copy, Eye, Edit } from "lucide-react";
import { CreateJobDefinition, createJobDefinitionSchema } from "@usersdotfun/shared-types";

interface JsonEditorProps {
  value: CreateJobDefinition | null;
  onChange: (value: CreateJobDefinition | null) => void;
  readOnly?: boolean;
  className?: string;
}

export function JsonEditor({ value, onChange, readOnly = false, className }: JsonEditorProps) {
  const [jsonString, setJsonString] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!readOnly);

  // Format JSON with proper indentation
  const formatJson = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return "";
    }
  };

  // Update JSON string when value changes
  useEffect(() => {
    if (value) {
      setJsonString(formatJson(value));
    } else {
      setJsonString("");
    }
  }, [value]);

  // Validate and parse JSON
  const validateJson = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      setIsValid(true);
      setValidationError(null);
      onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const result = createJobDefinitionSchema.safeParse(parsed);
      
      if (result.success) {
        setIsValid(true);
        setValidationError(null);
        onChange(result.data);
      } else {
        setIsValid(false);
        const errorMessages = result.error.issues.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        setValidationError(errorMessages);
        onChange(null);
      }
    } catch (error) {
      setIsValid(false);
      setValidationError("Invalid JSON syntax");
      onChange(null);
    }
  };

  const handleJsonChange = (newValue: string) => {
    setJsonString(newValue);
    validateJson(newValue);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = formatJson(parsed);
      setJsonString(formatted);
      validateJson(formatted);
    } catch {
      // If parsing fails, validation will handle the error
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
    setIsEditing(!isEditing);
  };

  if (!isEditing && readOnly) {
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
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleEditMode}
              className="h-8"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
        <pre className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-96 border">
          {jsonString || "No job definition"}
        </pre>
        {!isValid && validationError && (
          <Alert variant="destructive" className="mt-2">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
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
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleEditMode}
              className="h-8"
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          )}
        </div>
      </div>
      
      <Textarea
        id="json-editor"
        value={jsonString}
        onChange={(e) => handleJsonChange(e.target.value)}
        placeholder={`{
  "name": "my-job",
  "schedule": "*/5 * * * *",
  "source": {
    "plugin": "@curatedotfun/masa-source",
    "config": {},
    "search": {}
  },
  "pipeline": {
    "id": "my-pipeline",
    "name": "My Pipeline",
    "steps": []
  }
}`}
        className="font-mono text-sm min-h-96"
        readOnly={readOnly}
      />
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {isValid ? (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Valid JSON
            </div>
          ) : (
            <div className="flex items-center text-red-600 text-sm">
              <XCircle className="h-4 w-4 mr-1" />
              Invalid JSON
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {jsonString.length} characters
        </div>
      </div>
      
      {!isValid && validationError && (
        <Alert variant="destructive" className="mt-2">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
