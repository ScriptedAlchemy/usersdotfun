import { useAtom } from "jotai";
import { useEffect } from "react";
import { runIdAtom } from "~/atoms/run";
import { CommonSheet } from "~/components/common/common-sheet";
import { Run } from ".";

interface RunDetailsSheetProps {
  mode: "view";
  runId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RunDetailsSheet({
  mode,
  runId: initialRunId,
  isOpen,
  onClose,
}: RunDetailsSheetProps) {
  const [runId, setRunId] = useAtom(runIdAtom);

  useEffect(() => {
    if (isOpen) {
      setRunId(initialRunId ?? null);
    }
  }, [isOpen, initialRunId, setRunId]);

  return (
    <CommonSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Run: ${runId?.slice(0, 12) || ""}...`}
      description="Detailed view of a specific workflow run."
      className="sm:max-w-3xl"
    >
      <Run mode={mode} />
    </CommonSheet>
  );
}
