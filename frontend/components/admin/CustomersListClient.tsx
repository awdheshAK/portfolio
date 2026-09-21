"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Customer } from "@/types/api";
import * as customersService from "@/services/admin/customers";
import { DisabledBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/http";

export function CustomersListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const debouncedSearch = useDebounce(searchInput, 350);
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [lastPage, setLastPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Customer | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");
    params.set("page", "1");
    router.replace(`/admin/customers?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const load = useCallback(() => {
    setError(null);
    customersService
      .getAdminCustomers({ search: searchParams.get("search") ?? undefined, page })
      .then((res) => {
        setCustomers(res.data);
        setLastPage(res.meta.last_page);
      })
      .catch((err) => setError(getErrorMessage(err, "Unable to load customers.")));
  }, [searchParams, page]);

  useEffect(() => {
    load();
  }, [load]);

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    router.push(`/admin/customers?${params.toString()}`);
  }

  async function handleConfirm() {
    if (!confirmTarget) return;
    setIsMutating(true);
    try {
      if (confirmTarget.is_disabled) {
        await customersService.restoreAdminCustomer(confirmTarget.id);
        showToast({ title: "Customer re-enabled", variant: "success" });
      } else {
        await customersService.disableAdminCustomer(confirmTarget.id);
        showToast({ title: "Customer disabled", variant: "success" });
      }
      setConfirmTarget(null);
      load();
    } catch (err) {
      showToast({ title: "Couldn't update customer", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">Customers</h1>
          <p className="mt-1 text-sm text-neutral-500">Search and manage customer accounts.</p>
        </div>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        />
      </div>

      <div className="mt-6">
        {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!error && customers === null && <TextLineSkeleton lines={6} />}
        {!error && customers !== null && customers.length === 0 && (
          <EmptyState title="No customers found" description="Try a different search." />
        )}
        {!error && customers !== null && customers.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Designs</th>
                  <th className="px-4 py-3">Addresses</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${customer.id}`} className="font-medium text-neutral-900 hover:underline">
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{customer.email}</td>
                    <td className="px-4 py-3 text-neutral-600">{customer.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{customer.orders_count ?? 0}</td>
                    <td className="px-4 py-3 text-neutral-600">{customer.designs_count ?? 0}</td>
                    <td className="px-4 py-3 text-neutral-600">{customer.addresses_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <DisabledBadge disabled={customer.is_disabled} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setConfirmTarget(customer)}
                        className="text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                      >
                        {customer.is_disabled ? "Enable" : "Disable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={page} lastPage={lastPage} onPageChange={goToPage} />
      </div>

      <ConfirmDialog
        isOpen={confirmTarget !== null}
        title={confirmTarget?.is_disabled ? `Re-enable ${confirmTarget?.name}?` : `Disable ${confirmTarget?.name}?`}
        description={
          confirmTarget?.is_disabled
            ? "They'll be able to sign in and place orders again."
            : "They won't be able to sign in or place new orders until re-enabled."
        }
        confirmLabel={confirmTarget?.is_disabled ? "Enable" : "Disable"}
        tone={confirmTarget?.is_disabled ? "default" : "danger"}
        isSubmitting={isMutating}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
