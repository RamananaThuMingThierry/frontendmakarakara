<?php

namespace App\Enums;

enum PaymentMethodCode: string
{
    case CASH = 'cash';
    case MOBILE_MONEY = 'mobile_money';
}
