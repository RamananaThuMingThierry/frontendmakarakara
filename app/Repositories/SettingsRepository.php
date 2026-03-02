<?php

namespace App\Repositories;

use App\Interface\SettingsInterface;
use App\Models\Setting;

class SettingsRepository implements SettingsInterface{

    public function findByKey(string $key): ?Setting
    {
        return Setting::where('key', $key)->first();
    }

    public function getValue(string $key, mixed $default = null): mixed
    {
        return Setting::get($key, $default);
    }

    public function setValue(string $key, array $value): Setting
    {
        return Setting::set($key, $value);
    }

}
