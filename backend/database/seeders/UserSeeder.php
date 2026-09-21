<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * NOTE: these default credentials are for local/demo use only. See the
     * bold warning in backend/README.md — change them before any real deploy.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('ChangeMe123!'),
                'role' => UserRole::SuperAdmin->value,
                'email_verified_at' => now(),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'customer@example.com'],
            [
                'name' => 'Demo Customer',
                'password' => Hash::make('ChangeMe123!'),
                'role' => UserRole::Customer->value,
                'email_verified_at' => now(),
            ]
        );
    }
}
