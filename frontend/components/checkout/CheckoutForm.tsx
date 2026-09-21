"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import type { Address, AddressPayload } from "@/types/api";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import * as addressService from "@/services/addresses";
import * as ordersService from "@/services/orders";
import * as paymentsService from "@/services/payments";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { AddressForm } from "@/components/checkout/AddressForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { getErrorMessage } from "@/lib/http";
import { getRazorpayKey } from "@/lib/env";
import { cn } from "@/lib/cn";

type CheckoutStep = "address" | "review" | "paying";

export function CheckoutForm() {
  const router = useRouter();
  const { cart, isLoading: isCartLoading, refreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<CheckoutStep>("address");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [newAddress, setNewAddress] = useState<AddressPayload | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowNewAddressForm(true);
      return;
    }
    addressService
      .getAddresses()
      .then((data) => {
        setAddresses(data);
        const defaultAddress = data.find((a) => a.is_default) || data[0];
        if (defaultAddress) setSelectedAddressId(defaultAddress.id);
        else setShowNewAddressForm(true);
      })
      .catch(() => setShowNewAddressForm(true));
  }, [isAuthenticated]);

  function handleAddressSaved(payload: AddressPayload) {
    setNewAddress(payload);
    setShowNewAddressForm(false);
    setSelectedAddressId(null);
  }

  async function handlePay() {
    if (!selectedAddressId && !newAddress) {
      setError("Please select or add a shipping address.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await ordersService.checkout({
        shipping_address_id: selectedAddressId ?? undefined,
        shipping_address: selectedAddressId ? undefined : newAddress ?? undefined,
        billing_same_as_shipping: billingSameAsShipping,
        notes,
      });

      const RazorpayCtor = window.Razorpay;
      if (!isScriptReady || !RazorpayCtor) {
        throw new Error("Payment gateway is still loading. Please try again in a moment.");
      }

      setStep("paying");
      const razorpay = new RazorpayCtor({
        key: response.razorpay_key_id || getRazorpayKey(),
        amount: response.amount_minor,
        currency: response.currency,
        name: "Verve & Weave",
        description: `Order #${response.order.id}`,
        order_id: response.razorpay_order_id,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#171717" },
        handler: async (paymentResponse) => {
          try {
            // The order is only ever marked paid by this server-side
            // verification call — never assume success just because
            // Razorpay's client-side handler fired.
            await paymentsService.verifyRazorpayPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });
            await refreshCart();
            router.push(`/checkout/success?order=${response.order.id}`);
          } catch (err) {
            setError(getErrorMessage(err, "We couldn't verify your payment. If you were charged, contact support with your order number."));
            setStep("review");
          }
        },
        modal: {
          ondismiss: () => setStep("review"),
        },
      });
      razorpay.open();
    } catch (err) {
      const description = getErrorMessage(err, "Checkout failed. Please try again.");
      setError(description);
      showToast({ title: "Checkout failed", description, variant: "error" });
      setStep("review");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCartLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-neutral-500">Loading checkout…</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState title="Your cart is empty" description="Add something to your cart before checking out." actionLabel="Go to shop" actionHref="/shop" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setIsScriptReady(true)} />
      <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Checkout</h1>

      <div className="mt-6 flex gap-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
        <span className={cn(step !== "address" && "text-neutral-900")}>1. Address</span>
        <span>→</span>
        <span className={cn((step === "review" || step === "paying") && "text-neutral-900")}>2. Review</span>
        <span>→</span>
        <span className={cn(step === "paying" && "text-neutral-900")}>3. Payment</span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {step === "address" && (
            <div className="space-y-6">
              {!showNewAddressForm && addresses.length > 0 && (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-4",
                        selectedAddressId === address.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="text-sm">
                        <p className="font-medium text-neutral-900">{address.full_name}</p>
                        <p className="text-neutral-600">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p className="text-neutral-500">{address.phone}</p>
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    className="text-sm font-medium text-neutral-700 underline hover:text-neutral-900"
                  >
                    + Add a new address
                  </button>
                </div>
              )}

              {showNewAddressForm && (
                <AddressForm
                  onSubmit={handleAddressSaved}
                  onCancel={addresses.length > 0 ? () => setShowNewAddressForm(false) : undefined}
                />
              )}

              {!showNewAddressForm && (
                <button
                  type="button"
                  onClick={() => setStep("review")}
                  disabled={!selectedAddressId && !newAddress}
                  className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
                >
                  Continue to Review
                </button>
              )}
            </div>
          )}

          {(step === "review" || step === "paying") && (
            <div className="space-y-6">
              <div>
                <label htmlFor="checkout-notes" className="mb-1 block text-sm font-medium text-neutral-900">
                  Order notes (optional)
                </label>
                <textarea
                  id="checkout-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="h-4 w-4"
                />
                Billing address same as shipping
              </label>

              {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isSubmitting || step === "paying"}
                  className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
                >
                  {isSubmitting || step === "paying" ? "Processing…" : `Pay ${cartTotalLabel(cart.total_minor)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <OrderSummary cart={cart} />
      </div>
    </div>
  );
}

function cartTotalLabel(totalMinor: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalMinor / 100);
}
