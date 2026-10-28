import { defaultShouldDehydrateQuery } from "@tanstack/react-query";
import type { DehydrateOptions } from "@tanstack/react-query";

export const queryPersistenceOptions = {
  // Discard snapshots written before payroll was excluded from persistence.
  buster: "report-cache-v3-live-payroll",
  dehydrateOptions: {
    // Reports and payroll must come from the server on each visit. Offline
    // report drafts are stored separately and are unaffected by this policy.
    shouldDehydrateQuery: (query) =>
      defaultShouldDehydrateQuery(query) &&
      ![
        "reports",
        "report-entries",
        "report-suggestions",
        "employee-salaries",
        "sales-commissions",
      ].includes(String(query.queryKey[0])),
  } satisfies DehydrateOptions,
};
