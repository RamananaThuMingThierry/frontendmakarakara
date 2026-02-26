<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        $cartItemId = decrypt_to_int_or_null($this->route('cart_item')); 

        return [
            'cart_id' => [
                'required',
                'exists:carts,id',
            ],

            'product_id' => [
                'required',
                'exists:products,id',
                Rule::unique('cart_items')
                    ->where(fn ($query) => 
                        $query->where('cart_id', $this->cart_id)
                    )
                    ->ignore($cartItemId)
            ],

            'quantity' => [
                'required',
                'integer',
                'min:1'
            ],

            'unit_price' => [
                'required',
                'numeric',
                'min:0'
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'cart_id.required' => 'Le panier est obligatoire.',
            'cart_id.exists'   => 'Le panier sélectionné est invalide.',

            'product_id.required' => 'Le produit est obligatoire.',
            'product_id.exists'   => 'Le produit sélectionné est invalide.',
            'product_id.unique'   => 'Ce produit est déjà présent dans ce panier.',

            'quantity.required' => 'La quantité est obligatoire.',
            'quantity.integer'  => 'La quantité doit être un nombre entier.',
            'quantity.min'      => 'La quantité doit être au minimum 1.',

            'unit_price.required' => 'Le prix unitaire est obligatoire.',
            'unit_price.numeric'  => 'Le prix unitaire doit être un nombre.',
            'unit_price.min'      => 'Le prix unitaire ne peut pas être négatif.',
        ];
    }
}