import type { VariantProps } from "class-variance-authority";
import {
  workflowRunStatusValues,
  pluginRunStatusValues,
  workflowStatusValues,
} from "@usersdotfun/shared-types/schemas";
import type { Badge } from "~/components/ui/badge";

export const workflowRunStatusColors: Record<
  (typeof workflowRunStatusValues)[number],
  VariantProps<typeof Badge>["variant"]
> = {
  PENDING: "outline",
  RUNNING: "secondary",
  COMPLETED: "success",
  FAILED: "destructive",
  PARTIAL_SUCCESS: "warning",
  CANCELLED: "cancelled",
};

export const pluginRunStatusColors: Record<
  (typeof pluginRunStatusValues)[number],
  VariantProps<typeof Badge>["variant"]
> = {
  PENDING: "outline",
  RUNNING: "secondary",
  COMPLETED: "success",
  FAILED: "destructive",
  SKIPPED: "outline",
  RETRYING: "warning",
};

export const workflowStatusColors: Record<
  (typeof workflowStatusValues)[number],
  VariantProps<typeof Badge>["variant"]
> = {
  ACTIVE: "success",
  INACTIVE: "outline",
  ARCHIVED: "cancelled",
};
