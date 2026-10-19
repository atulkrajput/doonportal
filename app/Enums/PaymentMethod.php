<?php

namespace App\Enums;

/**
 * How a manually recorded payment was received. There is no payment gateway yet.
 */
enum PaymentMethod: string
{
    case Upi = 'UPI';
    case BankTransfer = 'BANK_TRANSFER';
    case Card = 'CARD';
    case Cash = 'CASH';
    case Cheque = 'CHEQUE';
    case Complimentary = 'COMPLIMENTARY';
    case Other = 'OTHER';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
