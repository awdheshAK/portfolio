<?php

namespace App\Policies;

use App\Models\Design;
use App\Models\User;

class DesignPolicy
{
    public function view(User $user, Design $design): bool
    {
        return $user->id === $design->user_id;
    }

    public function update(User $user, Design $design): bool
    {
        return $user->id === $design->user_id;
    }

    public function delete(User $user, Design $design): bool
    {
        return $user->id === $design->user_id;
    }
}
