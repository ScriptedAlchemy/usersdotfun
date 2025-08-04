import type { SourceItem } from "@usersdotfun/shared-types/types";
import { ItemView } from "./view";

export function Item({ data }: { data: SourceItem }) {
  return <ItemView data={data} />;
}
