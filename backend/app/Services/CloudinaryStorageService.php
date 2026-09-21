<?php

namespace App\Services;

use App\Services\Contracts\StorageService;
use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class CloudinaryStorageService implements StorageService
{
    /**
     * Allowed mime types for design/logo assets.
     */
    public const ALLOWED_MIME_TYPES = [
        'image/png',
        'image/jpeg',
        'image/svg+xml',
    ];

    /**
     * Maximum upload size in bytes (5 MB).
     */
    public const MAX_SIZE_BYTES = 5 * 1024 * 1024;

    protected Cloudinary $cloudinary;

    public function __construct()
    {
        $config = config('services.cloudinary');

        if (! empty($config['url'])) {
            $this->cloudinary = new Cloudinary($config['url']);
        } else {
            $this->cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => $config['cloud_name'],
                    'api_key' => $config['api_key'],
                    'api_secret' => $config['api_secret'],
                ],
                'url' => [
                    'secure' => true,
                ],
            ]);
        }
    }

    public function uploadDesignAsset(UploadedFile $file, ?string $folder = null): array
    {
        $this->validate($file);

        if (empty(config('services.cloudinary.cloud_name')) && empty(config('services.cloudinary.url'))) {
            throw new RuntimeException(
                'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and '
                .'CLOUDINARY_API_SECRET (or CLOUDINARY_URL) in .env before uploading design assets.'
            );
        }

        $folder = $folder ?: config('services.cloudinary.upload_folder', 'custom-clothing-platform');
        $publicId = (string) Str::uuid();

        $result = $this->cloudinary->uploadApi()->upload($file->getRealPath(), [
            'folder' => $folder,
            'public_id' => $publicId,
            'resource_type' => 'image',
            'overwrite' => false,
            'unique_filename' => true,
        ]);

        $data = $result->getArrayCopy();

        return [
            'url' => $data['secure_url'] ?? $data['url'],
            'public_id' => $data['public_id'],
        ];
    }

    public function delete(string $publicId): bool
    {
        $result = $this->cloudinary->uploadApi()->destroy($publicId, ['resource_type' => 'image']);

        $data = $result->getArrayCopy();

        return ($data['result'] ?? null) === 'ok';
    }

    protected function validate(UploadedFile $file): void
    {
        if (! $file->isValid()) {
            throw ValidationException::withMessages(['file' => ['The uploaded file is invalid.']]);
        }

        if ($file->getSize() > self::MAX_SIZE_BYTES) {
            throw ValidationException::withMessages(['file' => ['The file may not be larger than 5MB.']]);
        }

        $mime = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());

        $allowedExtensions = ['png', 'jpg', 'jpeg', 'svg'];

        if (! in_array($mime, self::ALLOWED_MIME_TYPES, true) && ! in_array($extension, $allowedExtensions, true)) {
            throw ValidationException::withMessages([
                'file' => ['Only PNG, JPG, JPEG and SVG files are allowed.'],
            ]);
        }
    }
}
