<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactRequest;
use App\Models\ContactSubmission;

class ContactController extends Controller
{
    public function store(ContactRequest $request)
    {
        $submission = ContactSubmission::create([
            ...$request->validated(),
            'ip' => $request->ip(),
        ]);

        return $this->success([
            'id' => $submission->id,
        ], 'Thanks for reaching out — we will get back to you shortly.', 201);
    }
}
