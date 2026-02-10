<?php

namespace App\Repositories;

use App\Interface\PasswordResetCodeInterface;
use App\Models\PasswordResetCode;

class PasswordResetCodeRepository implements PasswordResetCodeInterface
{
    public function create(string $email, ?string $code, ?\DateTimeInterface $expiresAt): ?PasswordResetCode
    {
        return PasswordResetCode::create([
            'email' => $email,
            'code' => $code,
            'expires_at' => $expiresAt,
        ]);
    }

    public function latestValidByEmailAndCode(string $email, string $code): ?PasswordResetCode
    {
        return PasswordResetCode::where('email', $email)
            ->where('code', $code)
            ->whereNull('used_at')
            ->orderByDesc('id')
            ->first();
    }

    public function markUsed(PasswordResetCode $entry): void
    {
        $entry->used_at = now();
        $entry->save();
    }

    public function invalidateAllForEmail(string $email): void
    {
        PasswordResetCode::where('email', $email)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);
    }
}