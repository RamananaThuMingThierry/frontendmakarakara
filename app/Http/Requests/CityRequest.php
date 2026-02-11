<?php

namespace App\Http\Requests;

use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CityRequest extends FormRequest
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

        $encryptedId = $this->route('encryptedId');

        $cityId = null;

        if ($encryptedId) {
            $cityId = decrypt_to_int_or_null($encryptedId);
        }

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('cities', 'name')->ignore($cityId),
            ],
            'region' => [
                'nullable',
                'string'
            ],
            'is_active' => [
                'boolean'
            ]
        ];
    }

    public function messages()
    {
        return [
            'name.required' => 'Le nom de ville est obligatoire.',
            'name.sting' => 'Le nom de ville doit être une chaîne de caractères.',
            'name.max' => 'Le nom de la ville ne doit pas dépasser 255 caractères.',
            'name.unique' => 'Cette ville existe déjà.',
            
            'regition.string' => 'Le nom de la région doit être une chaîne de caractères.',
        ];
    }
}
