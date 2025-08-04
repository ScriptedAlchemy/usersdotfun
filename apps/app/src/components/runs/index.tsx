import { useAtom } from "jotai";
import { runDataAtom } from "~/atoms/run";
import { RunView } from "./view";

export function Run({ mode }: { mode: "view" }) {
  const [{ data: runDetails, isPending, isError }] = useAtom(runDataAtom);

  if (isPending) return <div>Loading Workflow Run...</div>;
  if (isError) return <div>Error loading Workflow Run.</div>;
  if (!runDetails) return <div>No run found.</div>;

  return <RunView runDetails={runDetails} />;
}
