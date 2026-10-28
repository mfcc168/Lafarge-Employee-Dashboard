import { QueryClient } from "@tanstack/react-query";
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { queryPersistenceOptions } from "./queryPersistence";

const clients: QueryClient[] = [];
function createClient() {
  const client = new QueryClient();
  clients.push(client);
  return client;
}
function createPersister() {
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: "test-query-persistence",
    throttleTime: 0,
  });
}
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  window.localStorage.clear();
});

describe("query persistence", () => {
  it("restores ordinary queries but keeps payroll and report snapshots out of storage", async () => {
    const client = createClient();
    const persister = createPersister();
    const keys = [
      "employee-salaries", "sales-commissions",
      "reports", "report-entries", "report-suggestions",
    ];
    for (const key of [...keys, "all-employees"]) {
      client.setQueryData([key, "test-token"], [{ id: 1 }]);
    }
    await persistQueryClientSave({ queryClient: client, persister, ...queryPersistenceOptions });
    await waitFor(() => expect(window.localStorage.getItem("test-query-persistence")).not.toBeNull());
    const restored = createClient();
    await persistQueryClientRestore({ queryClient: restored, persister, ...queryPersistenceOptions });

    expect(restored.getQueryData(["all-employees", "test-token"])).toEqual([{ id: 1 }]);
    for (const key of keys) {
      expect(restored.getQueryData([key, "test-token"])).toBeUndefined();
    }
  });

  it("discards previously persisted payroll snapshots during the upgrade", async () => {
    const oldClient = createClient();
    oldClient.setQueryData(["employee-salaries", "test-token"], [{ id: 1 }]);
    oldClient.setQueryData(["sales-commissions", 2026, 9, "test-token"], { alex: 1000 });
    const persister = createPersister();
    await persistQueryClientSave({ queryClient: oldClient, persister, buster: "report-cache-v2" });
    await waitFor(async () => expect(await persister.restoreClient()).toBeDefined());

    const client = createClient();
    await persistQueryClientRestore({ queryClient: client, persister, ...queryPersistenceOptions });
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(await persister.restoreClient()).toBeUndefined();
  });
});
