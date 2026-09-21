<?php

namespace App\Services;

use Razorpay\Api\Api;
use Razorpay\Api\Errors\SignatureVerificationError;
use Razorpay\Api\Utility;
use RuntimeException;

/**
 * Wraps the Razorpay PHP SDK for order creation, payment-signature
 * verification and webhook-signature verification.
 *
 * This will not perform real network calls successfully without valid
 * RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET credentials configured in .env —
 * see backend/README.md.
 */
class RazorpayService
{
    protected ?Api $api = null;

    protected function api(): Api
    {
        if ($this->api === null) {
            $key = config('services.razorpay.key');
            $secret = config('services.razorpay.secret');

            if (empty($key) || empty($secret)) {
                throw new RuntimeException(
                    'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.'
                );
            }

            $this->api = new Api($key, $secret);
        }

        return $this->api;
    }

    /**
     * Create a Razorpay order for the given amount (in minor units / paise).
     *
     * @return array{id: string, amount: int, currency: string, status: string}
     */
    public function createOrder(int $amountMinor, string $currency, string $receipt, array $notes = []): array
    {
        $order = $this->api()->order->create([
            'amount' => $amountMinor,
            'currency' => $currency,
            'receipt' => $receipt,
            'notes' => $notes,
        ]);

        return $order->toArray();
    }

    /**
     * Verify the HMAC-SHA256 signature returned by Razorpay Checkout after payment.
     */
    public function verifyPaymentSignature(string $orderId, string $paymentId, string $signature): bool
    {
        $secret = config('services.razorpay.secret');

        if (empty($secret)) {
            throw new RuntimeException('Razorpay is not configured. Set RAZORPAY_KEY_SECRET in .env.');
        }

        $payload = $orderId.'|'.$paymentId;
        $expected = hash_hmac('sha256', $payload, $secret);

        return hash_equals($expected, $signature);
    }

    /**
     * Verify the X-Razorpay-Signature header on an incoming webhook payload.
     */
    public function verifyWebhookSignature(string $rawPayload, string $signature): bool
    {
        $secret = config('services.razorpay.webhook_secret');

        if (empty($secret)) {
            throw new RuntimeException('Razorpay webhooks are not configured. Set RAZORPAY_WEBHOOK_SECRET in .env.');
        }

        try {
            (new Utility)->verifyWebhookSignature($rawPayload, $signature, $secret);

            return true;
        } catch (SignatureVerificationError $e) {
            return false;
        }
    }
}
