import { ArrowDownIcon, ClipboardCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaxResult } from "@/tax/types";
import * as m from "@/paraglide/messages.js";
import { fmt, fmtSigned, stripColon } from "./format.js";

interface Props {
  result: TaxResult;
  onShowResults: () => void;
  onShowFiling: () => void;
}

/** Compact headline numbers, pinned below the navbar so edits show their effect without scrolling. */
export function ResultBar({ result, onShowResults, onShowFiling }: Props) {
  const { netIncome, nlCharge, be } = result;
  const withheld = result.inputs.withheldTaxNL;
  const nlBalance = withheld - nlCharge.netTaxNL;
  const nlLabel =
    withheld > 0
      ? nlBalance >= 0
        ? m.result_bar_dutch_refund()
        : m.result_bar_dutch_due()
      : stripColon(m.summary_dutch_tax());
  const nlValue = withheld > 0 ? fmtSigned(nlBalance) : fmt(nlCharge.netTaxNL);

  return (
    <section
      aria-label={m.result_bar_label()}
      className="sticky top-15 z-30 mb-4 rounded-md border border-border-soft bg-navbar-bg px-3 py-2 backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <dl className="m-0 flex flex-wrap gap-x-5 gap-y-1">
          <ResultBarItem label={stripColon(m.summary_net_income())} value={fmt(netIncome)} strong />
          <ResultBarItem label={`🇳🇱 ${nlLabel}`} value={nlValue} />
          <ResultBarItem
            label={`🇧🇪 ${stripColon(m.summary_belgian_tax())}`}
            value={fmt(be?.netTaxBE ?? 0)}
          />
        </dl>
        <div className="ms-auto flex items-center gap-1">
          <Button variant="ghost" size="xs" className="shell:hidden" onClick={onShowResults}>
            <ArrowDownIcon aria-hidden="true" />
            {m.result_bar_view_results()}
          </Button>
          <Button variant="ghost" size="xs" onClick={onShowFiling}>
            <ClipboardCheckIcon aria-hidden="true" />
            {m.result_bar_filing()}
          </Button>
        </div>
      </div>
    </section>
  );
}

function ResultBarItem({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-label text-text-sub">{label}</dt>
      <dd
        className={cn(
          "m-0 font-mono text-sm font-semibold tabular-nums",
          strong ? "text-brand-light" : "text-text",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
