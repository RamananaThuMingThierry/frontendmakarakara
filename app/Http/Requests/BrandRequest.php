<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // adapte si tu as une logique d'autorisation
    }

    public function rules(): array
    {
        // Ton paramètre de route est "encryptedId" (ou le nom exact dans ta route)
        $encryptedId = $this->route('encryptedId');

        $brandId = null;
        
        if ($encryptedId) {
            $brandId = decrypt_to_int_or_null($encryptedId);
        }

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('brands', 'name')->ignore($brandId),
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('brands', 'slug')->ignore($brandId),
            ],

            'logo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png',
                'max:2048',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'is_active' => [
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de la marque est obligatoire.',
            'name.string' => 'Le nom de la marque doit être une chaîne de caractères.',
            'name.max' => 'Le nom de la marque ne doit pas dépasser 255 caractères.',
            'name.unique' => 'Cette marque existe déjà.',
            'logo.image' => 'Le logo doit être une image valide.',
            'logo.mimes' => 'Le logo doit être au format jpg, jpeg ou png.',
            'logo.max' => 'Le logo ne doit pas dépasser 2MB.',
        ];
    }
}
