import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { getRunDetails } from "~/api/runs";

export const runIdAtom = atom<string | null>(null);

export const runDataAtom = atomWithQuery((get) => {
  const id = get(runIdAtom);
  return {
    queryKey: ["runs", id],
    queryFn: async () => {
      const run = await getRunDetails(id as string);
      return run;
    },
    enabled: !!id,
  };
});
