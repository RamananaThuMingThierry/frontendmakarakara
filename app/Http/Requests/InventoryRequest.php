<?php

namespace App\Http\Requests;

use Exception;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class InventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Si tu utilises des policies tu peux vérifier ici
        return Auth::check();
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('product_id')) {
            try {
                $this->merge([
                    'product_id' => decrypt_to_int_or_null($this->input('product_id')),
                ]);
            } catch (Exception $e) {
                $this->merge(['product_id' => null]);
            }
        }
        if ($this->filled('city_id')) {
            try {
                $this->merge([
                    'city_id' => decrypt_to_int_or_null($this->input('city_id')),
                ]);
            } catch (Exception $e) {
                $this->merge(['city_id' => null]);
            }
        }
    }
    
    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'product_id' => [$isUpdate ? 'sometimes' : 'required', 'integer', 'exists:products,id'],
            'city_id' => [$isUpdate ? 'sometimes' : 'required', 'integer', 'exists:cities,id'],

            'price' => ['required', 'numeric', 'min:0'],
            'compare_price' => ['nullable', 'numeric', 'min:0'],

            'quantity' => [$isUpdate ? 'sometimes' : 'required', 'integer', 'min:0'],
            'reserved_quantity' => ['sometimes', 'integer', 'min:0'],

            'min_stock' => ['sometimes', 'integer', 'min:0'],

            'is_available' => ['sometimes', 'boolean'],

            'status' => ['sometimes', 'in:ok,low,out_of_stock'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Le produit est requis.',
            'product_id.exists' => 'Le produit sélectionné est invalide.',

            'city_id.required' => 'La ville est requise.',
            'city_id.exists' => 'La ville sélectionnée est invalide.',

            'price.required' => 'Le prix est requis.',
            'price.numeric' => 'Le prix doit être un nombre.',

            'quantity.required' => 'La quantité est requise.',
            'quantity.integer' => 'La quantité doit être un entier.',
            'quantity.min' => 'La quantité ne peut pas être négative.',

            'compare_price.numeric' => 'Le prix comparatif doit être un nombre.',

            'min_stock.integer' => 'Le stock minimum doit être un entier.',
            'min_stock.min' => 'Le stock minimum doit être positif.',

            'status.in' => 'Le statut est invalide.',
        ];
    }
}