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
import { createJob, updateJob } from "~/api/jobs";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

// Form schema that matches the current form structure
const jobFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  schedule: z.string().optional(),
  sourcePlugin: z.string().min(1, "Source plugin is required"),
  sourceConfig: z.string().min(1, "Source config is required"),
  sourceSearch: z.string().min(1, "Source search is required"),
  pipeline: z.string().min(1, "Pipeline is required"),
});

type JobFormData = z.infer<typeof jobFormSchema>;

interface JobDialogProps {
  job?: Job;
  children: React.ReactNode;
}

const schedulePresets = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every week (Sunday)", value: "0 0 * * 0" },
  { label: "Custom", value: "custom" },
];

export function JobDialog({ job, children }: JobDialogProps) {
  const queryClient = useQueryClient();
  const [scheduleType, setScheduleType] = useState("preset");
  const [namePreview, setNamePreview] = useState("");

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
          schedule: job.schedule || "",
          sourcePlugin: job.sourcePlugin,
          sourceConfig: JSON.stringify(job.sourceConfig, null, 2),
          sourceSearch: JSON.stringify(job.sourceSearch, null, 2),
          pipeline: JSON.stringify(job.pipeline, null, 2),
        }
      : {
          name: "",
          schedule: "",
          sourcePlugin: "@curatedotfun/masa-source",
          sourceConfig: "{}",
          sourceSearch: "{}",
          pipeline: "{}",
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
        name: job.name,
        schedule: job.schedule || "",
        sourcePlugin: job.sourcePlugin,
        sourceConfig: JSON.stringify(job.sourceConfig, null, 2),
        sourceSearch: JSON.stringify(job.sourceSearch, null, 2),
        pipeline: JSON.stringify(job.pipeline, null, 2),
      });
    }
  }, [job, reset]);

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      toast.success("Job created");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
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
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", job!.id] });
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
        createMutation.mutate(jobDefinition);
      }
    } catch (error) {
      toast.error("Invalid JSON in form fields. Please check your input.");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {job ? "Edit Job" : `Create Job: ${namePreview}`}
          </DialogTitle>
          <DialogDescription>
            {job ? "Edit the job details." : "Create a new job."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" {...register("name")} className="col-span-3" />
              {errors.name && (
                <p className="col-span-4 text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schedule" className="text-right">
                Schedule
              </Label>
              <Controller
                name="schedule"
                control={control}
                render={({ field }) => (
                  <div className="col-span-3">
                    <Select
                      onValueChange={(value) => {
                        if (value === "custom") {
                          setScheduleType("custom");
                          field.onChange("");
                        } else {
                          setScheduleType("preset");
                          field.onChange(value);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {schedulePresets.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {scheduleType === "custom" && (
                      <Input
                        {...field}
                        placeholder="* * * * *"
                        className="mt-2"
                      />
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
          <DialogFooter>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
