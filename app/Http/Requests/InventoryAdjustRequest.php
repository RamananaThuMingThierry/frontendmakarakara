<?php

namespace App\Http\Requests;

use Exception;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class InventoryAdjustRequest extends FormRequest
{
    public function authorize(): bool
    {
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

        if ($this->has('type')) {
            $this->merge([
                'type' => strtolower($this->type)
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'city_id' => ['required', 'integer', 'exists:cities,id'],
            'type' => ['required', 'in:up,down'],
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Le produit est requis.',
            'product_id.exists' => 'Le produit sélectionné est invalide.',

            'city_id.required' => 'La ville est requise.',
            'city_id.exists' => 'La ville sélectionnée est invalide.',

            'type.required' => 'Le type d\'ajustement est requis.',
            'type.in' => 'Le type doit être "up" ou "down".',

            'quantity.required' => 'La quantité est requise.',
            'quantity.integer' => 'La quantité doit être un nombre entier.',
            'quantity.min' => 'La quantité doit être supérieure à 0.',

            'reason.required' => 'La raison de l\'ajustement est requise.',
            'reason.string' => 'La raison doit être une chaîne de caractères.',
            'reason.max' => 'La raison ne doit pas dépasser 255 caractères.',

            'note.string' => 'La note doit être une chaîne de caractères.',
            'note.max' => 'La note ne doit pas dépasser 1000 caractères.',
        ];
    }
}