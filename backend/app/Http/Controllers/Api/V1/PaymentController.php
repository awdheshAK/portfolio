<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payments\RazorpayVerifyRequest;
use App\Http\Resources\OrderResource;
use App\Models\Payment;
use App\Services\RazorpayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(protected RazorpayService $razorpay) {}

    public function verify(RazorpayVerifyRequest $request)
    {
        $data = $request->validated();

        $payment = Payment::query()
            ->where('gateway_order_id', $data['razorpay_order_id'])
            ->with('order')
            ->first();

        if (! $payment || ! $payment->order) {
            return $this->fail('No matching order found for this payment.', 404);
        }

        $this->authorize('view', $payment->order);

        $verified = $this->razorpay->verifyPaymentSignature(
            $data['razorpay_order_id'],
            $data['razorpay_payment_id'],
            $data['razorpay_signature'],
        );

        if (! $verified) {
            $payment->update(['status' => Payment::STATUS_FAILED]);

            return $this->fail('Payment signature verification failed.', 422);
        }

        DB::transaction(function () use ($payment, $data) {
            $payment->update([
                'gateway_payment_id' => $data['razorpay_payment_id'],
                'status' => Payment::STATUS_CAPTURED,
                'raw_response' => array_merge($payment->raw_response ?? [], $data),
            ]);

            if ($payment->order->status === OrderStatus::PendingPayment->value) {
                $payment->order->update(['status' => OrderStatus::PaymentConfirmed->value]);
            }
        });

        return $this->success(new OrderResource($payment->order->fresh('items')), 'Payment verified successfully.');
    }

    public function webhook(Request $request)
    {
        $rawPayload = $request->getContent();
        $signature = $request->header('X-Razorpay-Signature', '');

        if (! $signature || ! $this->razorpay->verifyWebhookSignature($rawPayload, $signature)) {
            return $this->fail('Invalid webhook signature.', 400);
        }

        $payload = json_decode($rawPayload, true) ?? [];
        $event = $payload['event'] ?? null;
        $entity = $payload['payload']['payment']['entity'] ?? $payload['payload']['refund']['entity'] ?? null;

        if (! $event || ! $entity) {
            return $this->success(null, 'Ignored: nothing to process.');
        }

        $gatewayOrderId = $entity['order_id'] ?? null;
        $gatewayPaymentId = $entity['id'] ?? null;

        $payment = Payment::query()
            ->when($gatewayOrderId, fn ($q) => $q->where('gateway_order_id', $gatewayOrderId))
            ->when(! $gatewayOrderId && $gatewayPaymentId, fn ($q) => $q->where('gateway_payment_id', $gatewayPaymentId))
            ->with('order')
            ->first();

        if (! $payment) {
            Log::warning('Razorpay webhook for unknown payment', ['event' => $event, 'entity' => $entity]);

            return $this->success(null, 'Ignored: unknown payment.');
        }

        $newStatus = match ($event) {
            'payment.captured', 'order.paid' => Payment::STATUS_CAPTURED,
            'payment.failed' => Payment::STATUS_FAILED,
            'refund.processed', 'refund.created' => Payment::STATUS_REFUNDED,
            default => null,
        };

        // Idempotency: if we've already recorded this exact payment id in this
        // status, there is nothing further to do.
        if ($newStatus === null
            || ($payment->gateway_payment_id === $gatewayPaymentId && $payment->status === $newStatus)) {
            return $this->success(null, 'Already processed.');
        }

        DB::transaction(function () use ($payment, $newStatus, $gatewayPaymentId, $entity) {
            $payment->update([
                'gateway_payment_id' => $gatewayPaymentId ?: $payment->gateway_payment_id,
                'status' => $newStatus,
                'raw_response' => array_merge($payment->raw_response ?? [], ['webhook' => $entity]),
            ]);

            $orderStatus = match ($newStatus) {
                Payment::STATUS_CAPTURED => OrderStatus::PaymentConfirmed->value,
                Payment::STATUS_FAILED => $payment->order->status,
                Payment::STATUS_REFUNDED => OrderStatus::Refunded->value,
                default => $payment->order->status,
            };

            if ($orderStatus !== $payment->order->status) {
                $payment->order->update(['status' => $orderStatus]);
            }
        });

        return $this->success(null, 'Webhook processed.');
    }
}
