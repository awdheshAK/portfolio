"use client";

import { useEffect, useState } from "react";
import type { Address, AddressPayload } from "@/types/api";
import * as addressService from "@/services/addresses";
import { AddressForm } from "@/components/checkout/AddressForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextLineSkeleton } from "@/components/ui/LoadingSkeleton";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/http";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    addressService
      .getAddresses()
      .then(setAddresses)
      .catch((err) => setError(getErrorMessage(err, "Unable to load your addresses.")));
  }

  async function handleCreate(payload: AddressPayload) {
    setIsSubmitting(true);
    try {
      await addressService.createAddress(payload);
      showToast({ title: "Address added", variant: "success" });
      setEditingId(null);
      refresh();
    } catch (err) {
      showToast({ title: "Couldn't save address", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(id: number, payload: AddressPayload) {
    setIsSubmitting(true);
    try {
      await addressService.updateAddress(id, payload);
      showToast({ title: "Address updated", variant: "success" });
      setEditingId(null);
      refresh();
    } catch (err) {
      showToast({ title: "Couldn't update address", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (pendingDeleteId === null) return;
    setIsDeleting(true);
    try {
      await addressService.deleteAddress(pendingDeleteId);
      setAddresses((prev) => prev?.filter((a) => a.id !== pendingDeleteId) ?? null);
      setPendingDeleteId(null);
    } catch (err) {
      showToast({ title: "Couldn't delete address", description: getErrorMessage(err), variant: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!addresses) return <TextLineSkeleton lines={5} />;

  return (
    <div className="space-y-6">
      {addresses.length === 0 && editingId !== "new" && (
        <EmptyState title="No saved addresses" description="Add an address to speed up checkout." />
      )}

      <div className="space-y-3">
        {addresses.map((address) =>
          editingId === address.id ? (
            <div key={address.id} className="rounded-lg border border-neutral-200 p-4">
              <AddressForm initial={address} isSubmitting={isSubmitting} onSubmit={(payload) => handleUpdate(address.id, payload)} onCancel={() => setEditingId(null)} />
            </div>
          ) : (
            <div key={address.id} className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 p-4 text-sm">
              <div>
                <p className="font-medium text-neutral-900">
                  {address.full_name} {address.is_default && <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs">Default</span>}
                </p>
                <p className="text-neutral-600">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postal_code}
                </p>
                <p className="text-neutral-500">{address.phone}</p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button type="button" onClick={() => setEditingId(address.id)} className="font-medium text-neutral-700 underline">
                  Edit
                </button>
                <button type="button" onClick={() => setPendingDeleteId(address.id)} className="text-neutral-500 underline hover:text-red-600">
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {editingId === "new" ? (
        <div className="rounded-lg border border-neutral-200 p-4">
          <AddressForm isSubmitting={isSubmitting} onSubmit={handleCreate} onCancel={() => setEditingId(null)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingId("new")}
          className="rounded-full border border-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
        >
          + Add new address
        </button>
      )}

      <Modal isOpen={pendingDeleteId !== null} onClose={() => setPendingDeleteId(null)} title="Delete this address?">
        <p className="text-sm text-neutral-600">This can&apos;t be undone. You can always add it again later.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setPendingDeleteId(null)}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete address"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
