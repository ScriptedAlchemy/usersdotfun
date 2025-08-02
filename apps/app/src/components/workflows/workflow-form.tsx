import { zodResolver } from "@hookform/resolvers/zod";
import { useRouteContext } from "@tanstack/react-router";
import {
  createWorkflowSchema
} from "@usersdotfun/shared-types/schemas";
import type { RichWorkflow } from "@usersdotfun/shared-types/types";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { JsonEditor } from "~/components/common/json-editor";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
} from "~/hooks/use-api";
import { Textarea } from "../ui/textarea";

const workflowFormSchema = createWorkflowSchema.omit({
  createdBy: true,
  status: true,
});
type WorkflowFormData = z.infer<typeof workflowFormSchema>;

interface WorkflowFormProps {
  workflow?: RichWorkflow;
  onSuccess: () => void;
}

const schedulePresets = [
  { value: "*/5 * * * *", label: "Every 5 minutes" },
  { value: "0 * * * *", label: "Every hour" },
  { value: "0 0 * * *", label: "Every day at midnight" },
  { value: "0 0 * * 0", label: "Every Sunday at midnight" },
];

export function WorkflowForm({ workflow, onSuccess }: WorkflowFormProps) {
  const { user } = useRouteContext({ from: "__root__" });
  const createMutation = useCreateWorkflowMutation();
  const updateMutation = useUpdateWorkflowMutation();

  const [activeTab, setActiveTab] = useState("form");
  const [jsonState, setJsonState] = useState<WorkflowFormData | null>(null);
  const [scheduleType, setScheduleType] = useState<
    "none" | "preset" | "custom"
  >("preset");

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowFormSchema),
    defaultValues: workflow
      ? {
          name: workflow.name,
          schedule: workflow.schedule,
          source: workflow.source,
          pipeline: workflow.pipeline,
        }
      : {
          name: "",
          schedule: "*/5 * * * *",
          source: {
            pluginId: "@usersdotfun/masa-source",
            config: {},
            search: {},
          },
          pipeline: {
            steps: [],
          },
        },
  });

  useEffect(() => {
    const defaultValues = workflow
      ? {
          name: workflow.name,
          schedule: workflow.schedule,
          source: workflow.source,
          pipeline: workflow.pipeline,
        }
      : {
          name: "",
          schedule: "*/5 * * * *",
          source: {
            pluginId: "@usersdotfun/masa-source",
            config: {},
            search: {},
          },
          pipeline: {
            steps: [],
          },
        };
    reset(defaultValues);
    setJsonState(defaultValues);
  }, [workflow, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      setJsonState(value as WorkflowFormData);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (jsonState) {
      for (const key in jsonState) {
        setValue(key as keyof WorkflowFormData, jsonState[key as keyof WorkflowFormData]);
      }
    }
  }, [jsonState, setValue]);

  const onSubmit = (data: WorkflowFormData) => {
    if (workflow) {
      updateMutation.mutate(
        { id: workflow.id, workflow: data },
        {
          onSuccess: () => {
            toast.success("Workflow updated successfully!");
            onSuccess();
          },
          onError: (error) => {
            toast.error(`Failed to update workflow: ${error.message}`);
          },
        }
      );
    } else {
      if (!user?.id) {
        toast.error("You must be logged in to create a workflow.");
        return;
      }
      // Add server-set fields before mutation
      const payload = {
        ...data,
        status: "active" as const,
        createdBy: user.id,
      };
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Workflow created successfully!");
          onSuccess();
        },
        onError: (error) => {
          toast.error(`Failed to create workflow: ${error.message}`);
        },
      });
    }
  };

  const onJsonSubmit = () => {
    if (!jsonState) {
      toast.error("JSON data is invalid or empty.");
      return;
    }
    onSubmit(jsonState);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="form">Form</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="form">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="schedule" className="text-right">
              Schedule
              <span className="text-xs text-gray-500 block">Optional</span>
            </Label>
            <Controller
              name="schedule"
              control={control}
              render={({ field }) => (
                <div className="col-span-3">
                  <Select
                    onValueChange={(value) => {
                      if (value === "none") {
                        setScheduleType("none");
                        field.onChange(undefined);
                      } else if (value === "custom") {
                        setScheduleType("custom");
                        field.onChange("");
                      } else {
                        setScheduleType("preset");
                        field.onChange(value);
                      }
                    }}
                    defaultValue={field.value || "none"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a schedule or run immediately" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Run immediately (no schedule)
                      </SelectItem>
                      {schedulePresets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Cron</SelectItem>
                    </SelectContent>
                  </Select>
                  {scheduleType === "custom" && (
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="* * * * * (cron expression)"
                      className="mt-2"
                    />
                  )}
                  {scheduleType === "none" && (
                    <p className="text-xs text-gray-600 mt-1">
                      Job will run immediately when created/activated
                    </p>
                  )}
                </div>
              )}
            />
            {errors.schedule && (
              <p className="col-span-4 text-red-500">
                {errors.schedule.message}
              </p>
            )}
          </div>
          {/* Simple JSON textareas for now, can be improved later */}
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Textarea
                  className="font-mono min-h-32"
                  value={JSON.stringify(field.value, null, 2)}
                  onChange={(e) => {
                    try {
                      field.onChange(JSON.parse(e.target.value));
                    } catch (err) {
                      // Ignore parse errors while typing
                    }
                  }}
                />
              )}
            />
            {errors.source && (
              <p className="text-red-500 text-sm">
                {typeof errors.source.message === "string"
                  ? errors.source.message
                  : "Invalid Source JSON"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pipeline">Pipeline</Label>
            <Controller
              name="pipeline"
              control={control}
              render={({ field }) => (
                <Textarea
                  className="font-mono min-h-32"
                  value={JSON.stringify(field.value, null, 2)}
                  onChange={(e) => {
                    try {
                      field.onChange(JSON.parse(e.target.value));
                    } catch (err) {
                      // Ignore parse errors while typing
                    }
                  }}
                />
              )}
            />
            {errors.pipeline && (
              <p className="text-red-500 text-sm">
                {typeof errors.pipeline.message === "string"
                  ? errors.pipeline.message
                  : "Invalid Pipeline JSON"}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : "Save Workflow"}
            </Button>
          </div>
        </form>
      </TabsContent>
      <TabsContent value="json">
        <div className="space-y-4">
          <JsonEditor
            value={jsonState}
            onChange={setJsonState}
            schema={workflowFormSchema}
            className="py-4"
          />
          <div className="flex justify-end">
            <Button
              onClick={onJsonSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : "Save from JSON"}
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
