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

class ClientAccountController extends Controller
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
            'message' => 'Compte client charge avec succes.',
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
                'action' => 'update_customer_account',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'color' => 'success',
                'status_code' => 200,
                'method' => 'PUT',
                'route' => 'customer.account.update',
                'message' => 'Informations du compte client mises a jour.',
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
                        ? 'Vos informations ont ete mises a jour. Verifiez votre nouvelle adresse email.'
                        : 'Vos informations ont ete mises a jour, mais l email de verification n a pas pu etre envoye.')
                    : 'Vos informations ont ete mises a jour.',
                'user' => $updatedUser->fresh(),
                'verification_mail_sent' => $verificationMailSent,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise a jour du compte client.',
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
                'action' => 'change_customer_password',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'color' => 'success',
                'status_code' => 200,
                'method' => 'PUT',
                'route' => 'customer.account.password.update',
                'message' => 'Mot de passe client modifie avec succes.',
            ]);

            $this->authService->logout($request);

            return response()->json([
                'message' => 'Mot de passe modifie avec succes. Veuillez vous reconnecter.',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors du changement du mot de passe.',
            ], 500);
        }
    }
}
