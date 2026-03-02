<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\SettingRequest;
use App\Services\ActivityLogService;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Throwable;

class SettingsController extends Controller
{
    public function __construct(private readonly SettingsService $settingService, private readonly ActivityLogService $activityLogService){}

    public function show(): JsonResponse
    {
        return response()->json([
            'key' => SettingsService::KEY_ABOUT_PLATFORM,
            'value' => $this->settingService->getAboutPlatform(),
        ]);
    }

    public function update(SettingRequest $request): JsonResponse
    {
        try {
            $data  = $request->validated();
            $value = $this->settingService->updateAboutPlatform($data);

            $this->activityLogService->createActivityLog([
                'user_id'     => Auth::id(),
                'action'      => 'update_settings',
                'entity_type' => 'Setting',
                'entity_id'   => null,
                'color'       => 'primary',
                'method'      => 'PUT',
                'route'       => 'admin.settings.update',
                'status_code' => 200,
                'message'     => 'À propos mis à jour avec succès.',
                'metadata'    => [
                    'key'     => SettingsService::KEY_ABOUT_PLATFORM,
                    'payload' => $data,
                    'saved'   => $value,
                ],
            ]);

            return response()->json([
                'message' => 'À propos mis à jour avec succès.',
                'key'     => SettingsService::KEY_ABOUT_PLATFORM,
                'value'   => $value,
            ], 200);

        } catch (Throwable $e) {

            $this->activityLogService->createActivityLog([
                'user_id'     => Auth::id(),
                'action'      => 'update_settings_failed',
                'entity_type' => 'Setting',
                'entity_id'   => null,
                'color'       => 'danger',
                'method'      => 'PUT',
                'route'       => 'admin.settings.update',
                'status_code' => 500,
                'message'     => 'Erreur lors de la mise à jour de la plateforme.',
                'metadata'    => [
                    'key'   => SettingsService::KEY_ABOUT_PLATFORM,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jour de la plateforme.',
            ], 500);
        }
    }
}
