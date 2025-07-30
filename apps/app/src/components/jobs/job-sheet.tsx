import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateJobDefinition,
  Job,
  UpdateJobDefinition,
} from "@usersdotfun/shared-types/types";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createJob, createJobDefinition, updateJob } from "~/api/jobs";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { queryKeys } from "~/lib/query-keys";
import { JsonEditor } from "./json-editor";

// Form schema that matches the current form structure
// TODO: grab from shared-types
const jobFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  schedule: z.string().optional(),
  sourcePlugin: z.string().min(1, "Source plugin is required"),
  sourceConfig: z.string().min(1, "Source config is required"),
  sourceSearch: z.string().min(1, "Source search is required"),
  pipeline: z.string().min(1, "Pipeline is required"),
});

type JobFormData = z.infer<typeof jobFormSchema>;

interface JobSheetProps {
  job?: Job;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const schedulePresets = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every week (Sunday)", value: "0 0 * * 0" },
  { label: "Custom", value: "custom" },
];

export function JobSheet({ job, children, open, onOpenChange }: JobSheetProps) {
  const queryClient = useQueryClient();
  const [scheduleType, setScheduleType] = useState("preset");
  const [namePreview, setNamePreview] = useState("");
  const [activeTab, setActiveTab] = useState("form");
  const [jsonJobDefinition, setJsonJobDefinition] =
    useState<CreateJobDefinition | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: job
      ? {
          name: job.name,
          schedule: job.schedule || undefined,
          sourcePlugin: job.sourcePlugin,
          sourceConfig: JSON.stringify(job.sourceConfig, null, 2),
          sourceSearch: JSON.stringify(job.sourceSearch, null, 2),
          pipeline: JSON.stringify(job.pipeline, null, 2),
        }
      : {
          sourcePlugin: "@curatedotfun/masa-source",
        },
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (watchedName) {
      setNamePreview(watchedName.toLowerCase().replace(/\s+/g, "-"));
    } else {
      setNamePreview("");
    }
  }, [watchedName]);

  useEffect(() => {
    if (job) {
      reset({
        ...job,
        schedule: job.schedule || undefined, // Convert null to undefined
        sourceConfig: JSON.stringify(job.sourceConfig, null, 2),
        sourceSearch: JSON.stringify(job.sourceSearch, null, 2),
        pipeline: JSON.stringify(job.pipeline, null, 2),
      });

      // Convert job to JobDefinition format for JSON editor
      const jobDefinition: CreateJobDefinition = {
        name: job.name,
        schedule: job.schedule || undefined, // Convert null to undefined
        source: {
          plugin: job.sourcePlugin,
          config: job.sourceConfig,
          search: job.sourceSearch,
        },
        pipeline: job.pipeline,
      };
      setJsonJobDefinition(jobDefinition);
    }
  }, [job, reset]);

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      toast.success("Job created");
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      onOpenChange?.(false);
    },
    onError: (error) => {
      toast.error(`Failed to create job: ${error.message}`);
    },
  });

  const createJobDefinitionMutation = useMutation({
    mutationFn: createJobDefinition,
    onSuccess: () => {
      toast.success("Job created");
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      onOpenChange?.(false);
    },
    onError: (error) => {
      toast.error(`Failed to create job: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedJob: UpdateJobDefinition) =>
      updateJob(job!.id, updatedJob),
    onSuccess: () => {
      toast.success("Job updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.detail(job!.id),
      });
      onOpenChange?.(false);
    },
    onError: (error) => {
      toast.error(`Failed to update job: ${error.message}`);
    },
  });

  const transformFormDataToJobDefinition = (
    formData: JobFormData
  ): CreateJobDefinition => {
    try {
      return {
        name: formData.name,
        schedule: formData.schedule || undefined,
        source: {
          plugin: formData.sourcePlugin,
          config: JSON.parse(formData.sourceConfig),
          search: JSON.parse(formData.sourceSearch),
        },
        pipeline: JSON.parse(formData.pipeline),
      };
    } catch (error) {
      throw new Error("Invalid JSON in form fields");
    }
  };

  const onSubmit = (data: JobFormData) => {
    try {
      const jobDefinition = transformFormDataToJobDefinition(data);
      if (job) {
        updateMutation.mutate(jobDefinition);
      } else {
        createJobDefinitionMutation.mutate(jobDefinition);
      }
    } catch (error) {
      toast.error("Invalid JSON in form fields. Please check your input.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {job ? "Edit Job" : `Create Job: ${namePreview}`}
          </SheetTitle>
          <SheetDescription>
            {job ? "Edit the job details." : "Create a new job."}
          </SheetDescription>
        </SheetHeader>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    className="col-span-3"
                  />
                  {errors.name && (
                    <p className="col-span-4 text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="schedule" className="text-right">
                    Schedule
                    <span className="text-xs text-gray-500 block">
                      Optional
                    </span>
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
                              <SelectItem
                                key={preset.value}
                                value={preset.value}
                              >
                                {preset.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {scheduleType === "custom" && (
                          <Input
                            {...field}
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sourcePlugin" className="text-right">
                    Source Plugin
                  </Label>
                  <Controller
                    name="sourcePlugin"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="@curatedotfun/masa-source">
                            @curatedotfun/masa-source
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.sourcePlugin && (
                    <p className="col-span-4 text-red-500">
                      {errors.sourcePlugin.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sourceConfig" className="text-right">
                    Source Config
                  </Label>
                  <Textarea
                    id="sourceConfig"
                    {...register("sourceConfig")}
                    className="col-span-3"
                    placeholder='{ "key": "value" }'
                  />
                  {errors.sourceConfig?.message && (
                    <p className="col-span-4 text-red-500">
                      {String(errors.sourceConfig.message)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sourceSearch" className="text-right">
                    Source Search
                  </Label>
                  <Textarea
                    id="sourceSearch"
                    {...register("sourceSearch")}
                    className="col-span-3"
                    placeholder='{ "query": "search terms" }'
                  />
                  {errors.sourceSearch?.message && (
                    <p className="col-span-4 text-red-500">
                      {String(errors.sourceSearch.message)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pipeline" className="text-right">
                    Pipeline
                  </Label>
                  <Textarea
                    id="pipeline"
                    {...register("pipeline")}
                    className="col-span-3"
                    placeholder='[ { "step": "transform" } ]'
                  />
                  {errors.pipeline?.message && (
                    <p className="col-span-4 text-red-500">
                      {String(errors.pipeline.message)}
                    </p>
                  )}
                </div>
              </div>
              <SheetFooter>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : "Save"}
                </Button>
              </SheetFooter>
            </form>
          </TabsContent>

          <TabsContent value="json">
            <div className="space-y-4">
              <JsonEditor
                value={jsonJobDefinition}
                onChange={setJsonJobDefinition}
                className="py-4"
              />
              <SheetFooter>
                <Button
                  onClick={() => {
                    if (jsonJobDefinition) {
                      if (job) {
                        // For updates, convert to CreateJob format since we don't have updateJobDefinition yet
                        const jobDefinition: UpdateJobDefinition = {
                          name: jsonJobDefinition.name,
                          schedule: jsonJobDefinition.schedule,
                          source: jsonJobDefinition.source,
                          pipeline: jsonJobDefinition.pipeline,
                        };
                        updateMutation.mutate(jobDefinition);
                      } else {
                        // For new jobs, use the JobDefinition format directly
                        createJobDefinitionMutation.mutate(jsonJobDefinition);
                      }
                    }
                  }}
                  disabled={
                    !jsonJobDefinition ||
                    createJobDefinitionMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {createJobDefinitionMutation.isPending ||
                  updateMutation.isPending
                    ? "Saving..."
                    : "Save"}
                </Button>
              </SheetFooter>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
