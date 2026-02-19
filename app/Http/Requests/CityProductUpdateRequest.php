<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CityProductUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = decrypt_to_int_or_null($this->route('city_product'));

        return [
            'city_id' => [
                'sometimes',
                'integer',
                'exists:cities,id',
            ],

            'product_id' => [
                'sometimes',
                'integer',
                'exists:products,id',
                Rule::unique('city_products')
                    ->ignore($id)
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
            'product_id.unique' => 'Ce produit est déjà associé à cette ville.',
        ];
    }
}
