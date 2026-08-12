import { Badge } from "@/components/ui/badge";
import type { ProposalStatus } from "@/lib/supabase/database.types";
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from "@/lib/proposal/types";

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
