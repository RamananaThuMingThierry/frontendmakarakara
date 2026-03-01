<?php

namespace App\Http\Requests;

use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CouponRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $method = $this->method();

        $encrypted = $this->route('coupon');

        $id = null;

        if ($encrypted) {
            $id = decrypt_to_int_or_null($encrypted);
        }

        $base = [
            'code' => ['required', 'string', 'max:50'],
            'value' => ['required', 'numeric', 'min:0'],
            'type' => ['required', Rule::in(['fixed', 'percent'])],
            'min_subtotal' => ['nullable', 'numeric', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ];

        if ($method === 'POST') {
            // creation: code must be unique
            $base['code'][] = Rule::unique('coupons', 'code');
            return $base;
        }

        if ($method === 'PUT' || $method === 'PATCH') {
            // update: ignore current record
            if ($id) {
                $base['code'][] = Rule::unique('coupons', 'code')->ignore($id);
            } else {
                $base['code'][] = Rule::unique('coupons', 'code');
            }
            return $base;
        }

        return $base;
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Le code est obligatoire.',
            'code.string' => 'Le code doit être une chaîne de caractères.',
            'code.max' => 'Le code ne doit pas dépasser 50 caractères.',
            'code.unique' => 'Ce code est déjà utilisé.',

            'value.required' => 'La valeur est requise.',
            'value.numeric' => 'La valeur doit être un nombre.',
            'value.min' => 'La valeur doit être au moins 0.',

            'min_subtotal.numeric' => 'Le montant minimum doit être un nombre.',
            'min_subtotal.min' => 'Le montant minimum ne peut pas être négatif.',

            'starts_at.date' => 'La date de début doit être une date valide.',
            'ends_at.date' => 'La date de fin doit être une date valide.',

            'usage_limit.integer' => 'La limite d\'utilisation doit être un entier.',
            'usage_limit.min' => 'La limite d\'utilisation doit être au moins 1.',

            'type.required' => 'Le type est requis.',
            'type.in' => 'Le type doit être `amount` ou `percentage`.',

            'expires_at.date' => 'La date d\'expiration doit être une date valide.',

            'is_active.boolean' => 'Le champ actif doit être vrai ou faux.',
        ];
    }
}