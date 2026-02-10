<?php

namespace App\Http\Controllers\WEB;

use Exception;
use Illuminate\Http\Request;
use App\Services\AuthService;
use App\Http\Controllers\Controller;

class AuthController extends Controller
{
public function __construct(private AuthService $auth) {}

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable'],
        ]);

        try{
            $user = $this->auth->login($data['email'], $data['password'], (bool)($data['remember'] ?? false));

            $token = $user?->createToken('makarakara')->plainTextToken;
        
            return response()->json([
                'message' => 'Connecté',
                'user' => $user,
                'token' => $token
            ]);

        }catch(Exception $e){
            return back()->withErrors(['email' => 'Les informations de connexion sont invalides.'])->withInput();
        }
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $this->auth->register($data);

        $user->assignRole('admin');

        // token direct après register (pratique pour React)
        $token = $user->createToken('makarakara')->plainTextToken;


        return response()->json(
            [
                'message' => 'Compte créé avec succès.',
                'user' => $user,
                'token' => $token,
            ],
            201
        );
    }

    public function logout(Request $request)
    {
        $this->auth->logout($request);

        return response()->json([
            'message' => 'Déconnecté',
        ], 200);
    }
}
