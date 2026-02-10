<?php

use Illuminate\Support\Facades\Crypt;

if (!function_exists('decrypt_to_int_or_null')) {
    /**
     * Décrypte une valeur Crypt::encryptString() en entier, ou null si invalide.
     *
     * @param string|null $value
     * @return int|null
     */
    function decrypt_to_int_or_null(?string $value): ?int
    {
        if (is_null($value) || $value === '') {
            return null;
        }

        // Si c’est déjà un entier ou une string numérique → on renvoie direct
        if (ctype_digit($value)) {
            return (int) $value;
        }

        try {
            return (int) Crypt::decryptString($value);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
