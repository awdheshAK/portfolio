<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogService
{
    public function log(?User $actor, string $action, string $resource, ?int $resourceId, ?array $oldValues = null, ?array $newValues = null): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'resource' => $resource,
            'resource_id' => $resourceId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip' => request()?->ip(),
        ]);
    }
}
