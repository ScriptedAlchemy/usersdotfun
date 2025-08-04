import type { RichWorkflowRun } from "@usersdotfun/shared-types/types";
import { RunView } from "./view";

export function Run({ data }: { data: RichWorkflowRun }) {
  return <RunView data={data} />;
}
