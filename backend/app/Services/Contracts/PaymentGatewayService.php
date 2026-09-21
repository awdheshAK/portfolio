<?php

namespace App\Services\Contracts;

/**
 * A common shape future payment gateways (e.g. Stripe) can conform to.
 * Only Razorpay is wired up for MVP; this interface exists so a second
 * gateway can be added later without reshaping the checkout flow.
 */
interface PaymentGatewayService
{
    public function createOrder(int $amountMinor, string $currency, string $receipt, array $notes = []): array;

    public function verifyPaymentSignature(string $orderId, string $paymentId, string $signature): bool;

    public function verifyWebhookSignature(string $rawPayload, string $signature): bool;
}
