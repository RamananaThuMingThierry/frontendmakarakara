<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\SettingRequest;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function __construct(private readonly SettingsService $settingService){}

        public function show(): JsonResponse
    {
        return response()->json([
            'key' => SettingsService::KEY_ABOUT_PLATFORM,
            'value' => $this->settingService->getAboutPlatform(),
        ]);
    }

    public function update(SettingRequest $request): JsonResponse
    {
        $value = $this->settingService->updateAboutPlatform($request->validated());

        return response()->json([
            'message' => 'À propos mis à jour avec succès.',
            'key' => SettingsService::KEY_ABOUT_PLATFORM,
            'value' => $value,
        ]);
    }
}
