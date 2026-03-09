<?php

namespace App\Http\Requests;

use Exception;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class InventoryTransfertRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
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

        if ($this->filled('city_from_id')) {
            try {
                $this->merge([
                    'city_from_id' => decrypt_to_int_or_null($this->input('city_from_id')),
                ]);
            } catch (Exception $e) {
                $this->merge(['city_from_id' => null]);
            }
        }

        if ($this->filled('city_to_id')) {
            try {
                $this->merge([
                    'city_to_id' => decrypt_to_int_or_null($this->input('city_to_id')),
                ]);
            } catch (Exception $e) {
                $this->merge(['city_to_id' => null]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_id'   => ['required', 'integer', 'exists:products,id'],
            'city_from_id' => ['required', 'integer', 'exists:cities,id'],
            'city_to_id'   => [
                'required',
                'integer',
                'exists:cities,id',
                'different:city_from_id',
            ],
            'quantity'     => ['required', 'integer', 'min:1'],
            'reason'       => ['required', 'string', 'max:255'],
            'note'         => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required'      => 'Le produit est obligatoire.',
            'product_id.integer'       => 'L’identifiant du produit est invalide.',
            'product_id.exists'        => 'Le produit sélectionné est introuvable.',

            'city_from_id.required'    => 'La ville source est obligatoire.',
            'city_from_id.integer'     => 'L’identifiant de la ville source est invalide.',
            'city_from_id.exists'      => 'La ville source sélectionnée est introuvable.',

            'city_to_id.required'      => 'La ville de destination est obligatoire.',
            'city_to_id.integer'       => 'L’identifiant de la ville de destination est invalide.',
            'city_to_id.exists'        => 'La ville de destination sélectionnée est introuvable.',
            'city_to_id.different'     => 'La ville de destination doit être différente de la ville source.',

            'quantity.required'        => 'La quantité est obligatoire.',
            'quantity.integer'         => 'La quantité doit être un nombre entier.',
            'quantity.min'             => 'La quantité doit être supérieure à 0.',

            'reason.required'          => 'Le motif du transfert est obligatoire.',
            'reason.string'            => 'Le motif du transfert est invalide.',
            'reason.max'               => 'Le motif du transfert ne doit pas dépasser 255 caractères.',

            'note.string'              => 'La note est invalide.',
            'note.max'                 => 'La note ne doit pas dépasser 1000 caractères.',
        ];
    }
}