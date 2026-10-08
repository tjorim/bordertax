import { cn } from "@/lib/utils";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, Library } from "lucide-react";
import { Link } from "@tanstack/react-router";

import * as m from "../paraglide/messages.js";
import { AppNavbar } from "../components/AppNavbar";
import { PageHero } from "../components/PageHero";
import { REFERENCE_PAGES } from "../referencePages";

export default function ReferenceOverview() {
  return (
    <>
      <AppNavbar>
        <span className="ref-nav-text font-mono text-xs font-semibold tracking-wide text-text-muted">
          <Library
            aria-hidden="true"
            className="inline size-4 shrink-0 align-text-bottom me-2 text-be-light"
          />
          {m.ref_overview_hub_title()}
        </span>
      </AppNavbar>

      <div className="mx-auto w-full max-w-6xl px-5 pb-12">
        <PageHero title={m.ref_overview_page_title()} subtitle={m.ref_overview_subtitle()} />

        <div className="mx-auto grid max-w-reference-cards grid-cols-1 gap-6 md:grid-cols-2">
          {REFERENCE_PAGES.map((page) => (
            <div key={page.route} className="min-w-0">
              <Link to={page.route} className="no-underline">
                <Card
                  className={cn(
                    "h-full cursor-pointer transition-colors hover:border-border-hover",
                    page.borderClass,
                  )}
                >
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <page.icon aria-hidden="true" className={cn("size-8", page.accentClass)} />
                    </div>
                    <CardTitle className="font-bold mb-2 ref-overview-card__title">
                      {page.titleFn()}
                    </CardTitle>
                    <CardDescription className="ref-overview-card__text">
                      {page.descFn()}
                    </CardDescription>
                    <span className={cn("text-sm font-semibold", page.accentClass)}>
                      {m.ref_nav_read_more()}{" "}
                      <ArrowRight
                        aria-hidden="true"
                        className="inline size-4 shrink-0 align-text-bottom ms-1"
                      />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
