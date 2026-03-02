<?php

namespace App\Services;

use App\Repositories\SettingsRepository;

class SettingsService
{
    public const KEY_ABOUT_PLATFORM = 'about_platform';

    public function __construct(private SettingsRepository $settingsRepository) {}

    public function getAboutPlatform(): array
    {
        return $this->settingsRepository->getValue(self::KEY_ABOUT_PLATFORM, [
            'title' => '',
            'description' => '',
            'phone' => '',
            'email' => '',
            'address' => '',
            'facebook' => '',
            'instagram' => '',
            'whatsapp' => '',
        ]);
    }

    public function updateAboutPlatform(array $payload): array
    {
        $saved = $this->settingsRepository->setValue(self::KEY_ABOUT_PLATFORM, $payload);

        return $saved->value ?? [];
    }
}
