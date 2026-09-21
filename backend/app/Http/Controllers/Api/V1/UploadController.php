<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadDesignAssetRequest;
use App\Services\Contracts\StorageService;

class UploadController extends Controller
{
    public function designAsset(UploadDesignAssetRequest $request, StorageService $storage)
    {
        $result = $storage->uploadDesignAsset($request->file('file'));

        return $this->success($result, 'File uploaded.', 201);
    }
}
