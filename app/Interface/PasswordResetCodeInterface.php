<?php

namespace App\Interface;

use DateTimeInterface;
use App\Models\PasswordResetCode;

interface PasswordResetCodeInterface
{
    public function create(string $email, ?string $code, ?DateTimeInterface $expiresAt): ?PasswordResetCode;

    public function latestValidByEmailAndCode(string $email, string $code): ?PasswordResetCode;

    public function markUsed(PasswordResetCode $entry);

    public function invalidateAllForEmail(string $email);
}