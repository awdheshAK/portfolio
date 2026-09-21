<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case ProductionManager = 'production_manager';
    case OrderManager = 'order_manager';
    case ContentManager = 'content_manager';
    case Customer = 'customer';

    /**
     * Roles that are allowed into the /admin/* routes.
     *
     * @return list<string>
     */
    public static function adminRoles(): array
    {
        return [
            self::SuperAdmin->value,
            self::Admin->value,
            self::ProductionManager->value,
            self::OrderManager->value,
            self::ContentManager->value,
        ];
    }
}
