<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CityProductStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'city_id' => [
                'required',
                'integer',
                'exists:cities,id',
            ],

            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
                Rule::unique('city_products')
                    ->where(fn ($query) =>
                        $query->where('city_id', $this->city_id)
                    ),
            ],

            'is_available' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'city_id.required' => 'La ville est obligatoire.',
            'city_id.exists' => 'Ville invalide.',

            'product_id.required' => 'Le produit est obligatoire.',
            'product_id.exists' => 'Produit invalide.',
            'product_id.unique' => 'Ce produit est déjà associé à cette ville.',

            'is_available.boolean' => 'is_available doit être un booléen.',
        ];
    }
}
