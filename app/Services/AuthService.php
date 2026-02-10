<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(private UserRepository $users) {}

    public function register(array $data): User
    {
        $data['password'] = Hash::make($data['password']);
        $data['status'] = $data['status'] ?? 'active';

        return $this->users->create($data);
    }

    public function login(string $email, string $password, bool $remember = false): ?User
    {
        $ok = Auth::attempt(
            [
                'email' => $email, 
                'password' => $password, 
                'status' => 'active'
            ], $remember);

        if (!$ok) {
            throw ValidationException::withMessages([
                'email' => 'Identifiants invalides ou compte inactif.',
            ]);
        }

        return Auth::user();
    }

    public function logout(Request $request): void
    {
        $request->user()->currentAccessToken()->delete();
    }
}