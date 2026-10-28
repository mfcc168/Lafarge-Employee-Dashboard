import type { QueryClient } from "@tanstack/react-query";
import type { EmployeeProfile } from "@interfaces/EmployeeType";

/** Apply acknowledged fields after cancelling older reads of the same employee. */
export async function updateEmployeeCaches(
  client: QueryClient,
  accessToken: string | null,
  id: number,
  confirmed: Partial<EmployeeProfile>,
) {
  const lists = [
    ["all-employees", accessToken],
    ["employee-salaries", accessToken],
  ];
  const detail = ["employee", String(id)];
  await Promise.all([
    ...lists.map((queryKey) => client.cancelQueries({ queryKey, exact: true })),
    client.cancelQueries({ queryKey: detail, exact: true }),
  ]);
  for (const queryKey of lists) {
    client.setQueryData<EmployeeProfile[]>(queryKey, (previous) =>
      previous?.map((entry) =>
        entry.id === id ? { ...entry, ...confirmed } : entry,
      ),
    );
    void client.invalidateQueries({ queryKey, exact: true });
  }
  client.setQueryData<EmployeeProfile>(detail, (previous) =>
    previous ? { ...previous, ...confirmed } : undefined,
  );
  void client.invalidateQueries({ queryKey: detail, exact: true });
  void client.invalidateQueries({ queryKey: ["employee-profiles"] });
  void client.invalidateQueries({ queryKey: ["reports"] });
}
