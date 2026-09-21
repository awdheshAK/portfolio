<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\NewsletterSubscribeRequest;
use App\Models\NewsletterSubscriber;

class NewsletterController extends Controller
{
    public function subscribe(NewsletterSubscribeRequest $request)
    {
        // Idempotent: never reveal whether the email was already subscribed.
        NewsletterSubscriber::query()->firstOrCreate([
            'email' => strtolower($request->string('email')),
        ]);

        return $this->success(null, 'You are subscribed to our newsletter.', 201);
    }
}
