<?php

namespace App\Http\Controllers\WEB;

use Exception;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use App\Services\ActivityLogService;
use App\Services\PassswordResetService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $auth,
        private ActivityLogService $activityLogService,
        private PassswordResetService $passwordResetService,
    ) {}

    public function login(LoginRequest $request)
    {

        $data = $request->validated();

        try{
            $user = $this->auth->login($data['email'], $data['password'], (bool)($data['remember'] ?? false));

            $token = $user->createToken('MAHAKARAKARA')->plainTextToken;

            // ✅ récupérer le rôle spatie
            $roles = $user->getRoleNames(); // "admin" | "customer" | "delivery"

            $this->activityLogService->createActivityLog([
                'user_id' => $user->id,
                'action' => 'login',
                'color' => 'success',
                'entity_type' => null,
                'entity_id' => null,
                'method' => 'POST',
                'route' => 'login',
                'message' => 'Connexion réussie.',
                'status_code' => 200,
                'metadata' => [
                    'pseudo' => $user->name,
                    'email' => $data['email'],
                    'roles' => $roles,
                ]
            ]);

            return response()->json([
                'message' => 'Connexion réussie',
                'user' => $user,
                'roles' => $roles,
                'token' => $token
            ], 200);

        }catch (Exception $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => null,
                'action' => 'login_failed',
                'color' => 'warning',
                'entity_type' => null,
                'entity_id' => null,
                'method' => 'POST',
                'route' => 'login',
                'message' => 'Échec de la connexion.',
                'status_code' => 422,
                'metadata' => [
                    "error" => $e->getMessage()
                ],
            ]);

            return response()->json([
                'message' => 'Les informations de connexion sont invalides.',
                'errors' => [
                    'email' => ['Email ou mot de passe incorrect.']
                ]
            ], 422);
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

        try{
            $user = $this->auth->register($data);

            // $user->assignRole('customer');
            $user->assignRole('admin');

            // token direct après register (pratique pour React)
            $token = $user->createToken('MAHAKARAKARA')->plainTextToken;
            $roles = $user->getRoleNames();

            $this->activityLogService->createActivityLog([
                'user_id' => $user->id,
                'action' => 'register',
                'color' => 'success',
                'entity_type' => null,
                'entity_id' => null,
                'method' => 'POST',
                'route' => 'register',
                'message' => 'Compte créé avec succès.',
                'status_code' => 201,
                'metadata' => [
                    'pseudo' => $user->name,
                    'email' => $user->email,
                    'roles' => $roles,
                ]
            ]);

            return response()->json(
                [
                    'message' => 'Compte créé avec succès.',
                    'user' => $user,
                    'roles' => $roles,
                    'token' => $token,
                ],
                201
            );
        }catch(Throwable $e){
            $this->activityLogService->createActivityLog([
                'user_id' => null,
                'action' => 'register_failed',
                'color' => 'danger',
                'entity_type' => null,
                'entity_id' => null,
                'method' => 'POST',
                'route' => 'register',
                'message' => 'Échec de la création du compte.',
                'status_code' => 500,
                'metadata' => [
                    "error" => $e->getMessage()
                ],
            ]);

            return response()->json([
                'message' => 'Une erreur est survenue lors de la création du compte.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function me()
    {
        $user = Auth::user();

        if (!$user) {

            $this->activityLogService->createActivityLog([
                'user_id' => null,
                'action' => 'fetch_me_failed',
                'color' => 'danger',
                'entity_type' => null,
                'entity_id' => null,
                'method' => 'GET',
                'route' => 'me',
                'message' => 'Utilisateur non authentifié.',
                'status_code' => 401,
            ]);

            return response()->json([
                'message' => 'Non authentifié'
            ], 401);
        }

        return response()->json([
            'user' => $user,
            'roles' => $user->getRoleNames()
        ], 200);
    }

    public function resendVerificationEmail(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Non authentifie',
            ], 401);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Votre adresse email est deja verifiee.',
                'verified' => true,
            ], 200);
        }

        try {
            $user->sendEmailVerificationNotification();

            $this->activityLogService->createActivityLog([
                'user_id' => $user->id,
                'action' => 'resend_email_verification',
                'color' => 'info',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'method' => 'POST',
                'route' => 'verification.send.api',
                'message' => 'Email de verification renvoye.',
                'status_code' => 200,
                'metadata' => [
                    'email' => $user->email,
                ],
            ]);

            return response()->json([
                'message' => 'Un email de verification vient d etre envoye.',
                'verified' => false,
            ], 200);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => $user->id,
                'action' => 'resend_email_verification_failed',
                'color' => 'warning',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'method' => 'POST',
                'route' => 'verification.send.api',
                'message' => 'Echec du renvoi de l email de verification.',
                'status_code' => 500,
                'metadata' => [
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Impossible d envoyer l email de verification pour le moment.',
            ], 500);
        }
    }

    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $this->passwordResetService->sendResetCode($data['email']);

        return response()->json([
            'message' => 'Un code de verification valable 15 minutes a ete envoyé.',
            'expires_in_minutes' => 15,
        ], 200);
    }

    public function verifyResetCode(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
        ]);

        $this->passwordResetService->verifyCode($data['email'], $data['code']);

        return response()->json([
            'message' => 'Code valide.',
            'verified' => true,
        ], 200);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $this->passwordResetService->resetPassword($data['email'], $data['code'], $data['password']);

        return response()->json([
            'message' => 'Mot de passe reinitialise avec succes.',
        ], 200);
    }


    public function logout(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            $this->activityLogService->createActivityLog([
                'user_id' => $user->id,
                'action' => 'logout',
                'color' => 'info',
                'entity_type' => null,
                'entity_id' => null,
                'method' => 'POST',
                'route' => 'logout',
                'message' => 'Déconnexion réussie.',
                'status_code' => 200,
            ]);
        }

        $this->auth->logout($request);

        return response()->json([
            'message' => 'Déconnecté',
        ], 200);
    }
}
