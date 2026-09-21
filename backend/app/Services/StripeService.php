<?php

namespace App\Services;

use App\Services\Contracts\PaymentGatewayService;
use RuntimeException;

/**
 * NOT WIRED UP YET.
 *
 * This class exists purely so the codebase is architected for a second
 * payment gateway (Stripe) without requiring one for the MVP. It conforms
 * to the same PaymentGatewayService contract as RazorpayService, but every
 * method throws until real Stripe integration is implemented. No route or
 * controller in this application calls into this class.
 *
 * To implement: require the `stripe/stripe-php` package, fill in the
 * methods below using STRIPE_KEY / STRIPE_SECRET / STRIPE_WEBHOOK_SECRET
 * from config/services.php, and wire a StripePaymentController + routes
 * analogous to the Razorpay payment flow.
 */
class StripeService implements PaymentGatewayService
{
    public function createOrder(int $amountMinor, string $currency, string $receipt, array $notes = []): array
    {
        throw new RuntimeException('Stripe integration is not implemented yet. This is a documented stub.');
    }

    public function verifyPaymentSignature(string $orderId, string $paymentId, string $signature): bool
    {
        throw new RuntimeException('Stripe integration is not implemented yet. This is a documented stub.');
    }

    public function verifyWebhookSignature(string $rawPayload, string $signature): bool
    {
        throw new RuntimeException('Stripe integration is not implemented yet. This is a documented stub.');
    }
}
