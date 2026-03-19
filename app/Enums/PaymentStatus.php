<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case UNPAID = 'unpaid';
    case PENDING_VERIFICATION = 'pending_verification';
    case PAID = 'paid';
    case REFUNDED = 'refunded';
}
