<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class AddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'label' => ['nullable', 'string', 'max:255'],

            'full_name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],

            'phone' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:50'],

            'landmark' => ['nullable', 'string', 'max:255'],

            'address_line1' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],

            'city_name' => ['nullable', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:255'],

            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            'is_default' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'label.string' => 'Le label doit être un texte.',
            'label.max' => 'Le label ne doit pas dépasser 255 caractères.',

            'full_name.required' => 'Le nom complet est obligatoire.',
            'full_name.string' => 'Le nom complet doit être un texte.',
            'full_name.max' => 'Le nom complet ne doit pas dépasser 255 caractères.',

            'phone.required' => 'Le numéro de téléphone est obligatoire.',
            'phone.string' => 'Le numéro de téléphone doit être un texte.',
            'phone.max' => 'Le numéro de téléphone ne doit pas dépasser 50 caractères.',

            'landmark.string' => 'Le repère doit être un texte.',
            'landmark.max' => 'Le repère ne doit pas dépasser 255 caractères.',

            'address_line1.required' => 'Adresse (ligne 1) obligatoire.',
            'address_line1.string' => 'Adresse (ligne 1) invalide.',
            'address_line1.max' => 'Adresse (ligne 1) ne doit pas dépasser 255 caractères.',

            'address_line2.string' => 'Adresse (ligne 2) invalide.',
            'address_line2.max' => 'Adresse (ligne 2) ne doit pas dépasser 255 caractères.',

            'city_name.string' => 'La ville doit être un texte.',
            'city_name.max' => 'La ville ne doit pas dépasser 255 caractères.',

            'region.string' => 'La région doit être un texte.',
            'region.max' => 'La région ne doit pas dépasser 255 caractères.',

            'postal_code.string' => 'Le code postal doit être un texte.',
            'postal_code.max' => 'Le code postal ne doit pas dépasser 50 caractères.',

            'country.string' => 'Le pays doit être un texte.',
            'country.max' => 'Le pays ne doit pas dépasser 255 caractères.',

            'latitude.numeric' => 'La latitude doit être un nombre.',
            'latitude.between' => 'La latitude doit être entre -90 et 90.',

            'longitude.numeric' => 'La longitude doit être un nombre.',
            'longitude.between' => 'La longitude doit être entre -180 et 180.',

            'is_default.boolean' => 'Le champ is_default doit être vrai ou faux.',
        ];
    }
}
