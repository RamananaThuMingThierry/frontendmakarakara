<?php 

namespace App\Services;

use App\Mail\PasswordResetCodeMail;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use App\Repositories\PasswordResetCodeRepository;

class PassswordResetService
{
public function __construct(
        private UserRepository $userRepository,
        private PasswordResetCodeRepository $passwordResetCodeRepository,
    ) {}

    public function sendResetCode(string $email): void
    {
        $constraints = [
            'email' => $email
        ];

        $user = $this->userRepository->getByKeys(
            array_keys($constraints),
            array_values($constraints),
            ['id'] // on n'a besoin que de l'id pour vérifier l'existence
        );

        if (!$user) {
            // sécurité: on ne révèle pas si l'email existe
            return;
        }

        // invalider anciens codes
        $this->passwordResetCodeRepository->invalidateAllForEmail($email);

        $code = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(10);

        $this->passwordResetCodeRepository->create($email, $code, $expiresAt);

        Mail::to($email)->send(new PasswordResetCodeMail($code, $expiresAt));
    }

    public function resetPassword(string $email, string $code, string $newPassword): void
    {
        $entry = $this->passwordResetCodeRepository->latestValidByEmailAndCode($email, $code);

        if (!$entry) {
            throw ValidationException::withMessages(['code' => 'Code invalide.']);
        }
        if ($entry->is_expired) {
            throw ValidationException::withMessages(['code' => 'Code expiré.']);
        }

        $constraint = ['email' => $email];

        $user = $this->userRepository->getByKeys(array_keys($constraint),array_values($constraint));

        if (!$user) {
            throw ValidationException::withMessages(['email' => 'Email invalide.']);
        }

        $data = [
            'password' => Hash::make($newPassword)
        ];

        $this->userRepository->update($user, $data);
        $this->passwordResetCodeRepository->markUsed($entry);

        // optionnel: invalider les autres codes
        $this->passwordResetCodeRepository->invalidateAllForEmail($email);
    }
}