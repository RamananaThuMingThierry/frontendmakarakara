<?php

namespace App\Services;

use App\Mail\PasswordResetCodeMail;
use App\Repositories\PasswordResetCodeRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class PassswordResetService
{
    public function __construct(
        private UserRepository $userRepository,
        private PasswordResetCodeRepository $passwordResetCodeRepository,
    ) {}

    public function sendResetCode(string $email): void
    {
        $constraints = [
            'email' => $email,
        ];

        $user = $this->userRepository->getByKeys(
            array_keys($constraints),
            array_values($constraints),
            ['id']
        );

        if (!$user) {
            return;
        }

        $this->passwordResetCodeRepository->invalidateAllForEmail($email);

        $code = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(15);

        $this->passwordResetCodeRepository->create($email, $code, $expiresAt);

        Mail::to($email)->send(new PasswordResetCodeMail($code, $expiresAt));
    }

    public function verifyCode(string $email, string $code): void
    {
        $entry = $this->passwordResetCodeRepository->latestValidByEmailAndCode($email, $code);

        if (!$entry) {
            throw ValidationException::withMessages(['code' => 'Code invalide.']);
        }

        if ($entry->is_expired) {
            throw ValidationException::withMessages(['code' => 'Code expire.']);
        }
    }

    public function resetPassword(string $email, string $code, string $newPassword): void
    {
        $this->verifyCode($email, $code);

        $user = $this->userRepository->getByKeys(['email'], [$email]);

        if (!$user) {
            throw ValidationException::withMessages(['email' => 'Email invalide.']);
        }

        $entry = $this->passwordResetCodeRepository->latestValidByEmailAndCode($email, $code);

        $this->userRepository->update($user, [
            'password' => Hash::make($newPassword),
        ]);

        $this->passwordResetCodeRepository->markUsed($entry);
        $this->passwordResetCodeRepository->invalidateAllForEmail($email);
    }
}
