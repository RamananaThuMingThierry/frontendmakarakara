<?php

namespace App\Interface;

use App\Models\Setting;

interface SettingsInterface{
    public function findByKey(string $key): ?Setting;

    public function getValue(string $key, mixed $default = null): mixed;

    public function setValue(string $key, array $value): Setting;
}
