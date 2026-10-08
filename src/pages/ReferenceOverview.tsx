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
        <span className="ref-nav-text tw:font-mono tw:text-xs tw:font-semibold tw:tracking-wide tw:text-text-muted">
          <Library
            aria-hidden="true"
            className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:me-2 tw:text-be-light"
          />
          {m.ref_overview_hub_title()}
        </span>
      </AppNavbar>

      <div className="tw:mx-auto tw:w-full tw:max-w-6xl tw:px-5 tw:pb-12">
        <PageHero title={m.ref_overview_page_title()} subtitle={m.ref_overview_subtitle()} />

        <div className="tw:mx-auto tw:grid tw:max-w-reference-cards tw:grid-cols-1 tw:gap-6 tw:md:grid-cols-2">
          {REFERENCE_PAGES.map((page) => (
            <div key={page.route} className="tw:min-w-0">
              <Link to={page.route} className="tw:no-underline">
                <Card
                  className={cn(
                    "tw:h-full tw:cursor-pointer tw:transition-colors tw:hover:border-border-hover",
                    page.borderClass,
                  )}
                >
                  <CardContent className="tw:p-6">
                    <div className="tw:mb-4">
                      <page.icon aria-hidden="true" className={cn("tw:size-8", page.accentClass)} />
                    </div>
                    <CardTitle className="tw:font-bold tw:mb-2 ref-overview-card__title">
                      {page.titleFn()}
                    </CardTitle>
                    <CardDescription className="ref-overview-card__text">
                      {page.descFn()}
                    </CardDescription>
                    <span className={cn("tw:text-sm tw:font-semibold", page.accentClass)}>
                      {m.ref_nav_read_more()}{" "}
                      <ArrowRight
                        aria-hidden="true"
                        className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:ms-1"
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
