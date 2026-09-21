<?php

namespace App\Services\Contracts;

use Illuminate\Http\UploadedFile;

interface StorageService
{
    /**
     * Upload a design/logo asset and return its public URL and provider id.
     *
     * @return array{url: string, public_id: string}
     */
    public function uploadDesignAsset(UploadedFile $file, ?string $folder = null): array;

    /**
     * Delete a previously uploaded asset by its provider id.
     */
    public function delete(string $publicId): bool;
}
