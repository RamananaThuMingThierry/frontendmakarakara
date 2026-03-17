<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccountUpdateRequest;
use App\Http\Requests\ChangePasswordRequest;
use App\Services\ActivityLogService;
use App\Services\AuthService;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

class AccountAdminController extends Controller
{
    public function __construct(
        private UserService $userService,
        private AuthService $authService,
        private ActivityLogService $activityLogService
    ) {}

    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'message' => 'Compte charg\u00e9 avec succ\u00e8s.',
            'user' => $user,
            'roles' => $user->getRoleNames(),
        ]);
    }

public function update(AccountUpdateRequest $request)
{
    $user = Auth::user();
    $data = $request->validated();

    try {
        $oldEmail = $user->email;
        $updatedUser = $this->userService->updateUser($user, $data);

        $emailChanged = array_key_exists('email', $data) && $data['email'] !== $oldEmail;
        $verificationMailSent = false;

        if ($emailChanged) {
            try {
                $updatedUser->sendEmailVerificationNotification();
                $verificationMailSent = true;
            } catch (Throwable $mailException) {
                $verificationMailSent = false;
            }
        }

        $this->activityLogService->createActivityLog([
            'user_id' => $user->id,
            'action' => 'update_account',
            'entity_type' => 'User',
            'entity_id' => $user->id,
            'color' => 'success',
            'status_code' => 200,
            'method' => 'PUT',
            'route' => 'account.update',
            'message' => 'Informations du compte mises à jour.',
            'metadata' => [
                'name' => $updatedUser->name,
                'email' => $updatedUser->email,
                'phone' => $updatedUser->phone,
                'email_verified_at' => $updatedUser->email_verified_at,
                'email_changed' => $emailChanged,
                'verification_mail_sent' => $verificationMailSent,
            ],
        ]);

        return response()->json([
            'message' => $emailChanged
                ? ($verificationMailSent
                    ? 'Vos informations ont été mises à jour. Veuillez vérifier votre nouvelle adresse email.'
                    : 'Vos informations ont été mises à jour, mais l’email de vérification n’a pas pu être envoyé.')
                : 'Vos informations ont été mises à jour.',
            'user' => $updatedUser->fresh(),
            'verification_mail_sent' => $verificationMailSent,
        ]);
    } catch (Throwable $e) {
        return response()->json([
            'message' => 'Erreur lors de la mise à jour du compte.',
        ], 500);
    }
}

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = Auth::user();
        $data = $request->validated();

        try {
            $this->userService->updatePassword($user, $data['password']);

            $this->activityLogService->createActivityLog([
                'user_id' => $user->id,
                'action' => 'change_password',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'color' => 'success',
                'status_code' => 200,
                'method' => 'PUT',
                'route' => 'account.password.update',
                'message' => 'Mot de passe modifié avec succès.',
            ]);

            $this->authService->logout($request);

            $this->activityLogService->createActivityLog([
                'user_id' => $user->id,
                'action' => 'logout',
                'color' => 'info',
                'entity_type' => null,
                'entity_id' => null,
                'method' => 'POST',
                'route' => 'logout',
                'message' => 'Mot de passe modifié avec succès. Veuillez vous reconnecter.',
                'status_code' => 200,
            ]);

            return response()->json([
                'message' => 'Mot de passe modifié avec succès. Veuillez vous reconnecter.',
                'redirect' => route('login'),
            ], 200);

        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => $user->id,
                'action' => 'change_password_failed',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'color' => 'danger',
                'status_code' => 500,
                'method' => 'PUT',
                'route' => 'account.password.update',
                'message' => 'Erreur lors du changement du mot de passe.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du changement du mot de passe.',
            ], 500);
        }
    }
}
