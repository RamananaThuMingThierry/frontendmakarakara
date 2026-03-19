<?php

namespace App\Services;

use App\Repositories\SettingsRepository;
use Illuminate\Http\UploadedFile;

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
            'logo' => '',
            'facebook' => '',
            'instagram' => '',
            'whatsapp' => '',
        ]);
    }

    public function updateAboutPlatform(array $payload): array
    {
        $current = $this->getAboutPlatform();

        if (!empty($payload['logo']) && $payload['logo'] instanceof UploadedFile) {
            if (!empty($current['logo'])) {
                $oldPath = public_path($current['logo']);
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $extension = $payload['logo']->getClientOriginalExtension();
            $filename = 'platform-logo-'.time().'.'.$extension;
            $destination = public_path('images/settings');

            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $payload['logo']->move($destination, $filename);
            $payload['logo'] = 'images/settings/'.$filename;
        } else {
            unset($payload['logo']);
        }

        $payload = array_merge($current, $payload);
        $saved = $this->settingsRepository->setValue(self::KEY_ABOUT_PLATFORM, $payload);

        return $saved->value ?? [];
    }
}
