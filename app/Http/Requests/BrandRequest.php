<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $brandId = decrypt_to_int_or_null($this->route('brand'));
        
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('brands', 'name')->ignore($brandId),
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
