<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CartRequest extends FormRequest
{
    /**
     * Autorisation
     */
    public function authorize(): bool
    {
        return true; // À adapter selon ta logique d’auth
    }

    /**
     * Règles de validation
     */
    public function rules(): array
    {
        $cartId = decrypt_to_int_or_null($this->route('cart'));
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'user_id' => [
                $isUpdate ? 'sometimes' : 'required',
                'integer',
                'exists:users,id',
                $isUpdate ? Rule::unique('carts', 'user_id')->ignore($cartId)
                : Rule::unique('carts', 'user_id'),
            ],
            'status' => [
                $isUpdate ? 'sometimes' : 'required',
                Rule::in(['active', 'converted']),
            ],
        ];
    }

    /**
     * Messages personnalisés
     */
    public function messages(): array
    {
        return [
            // user_id
            'user_id.required' => 'L’utilisateur est obligatoire.',
            'user_id.integer' => 'L’identifiant utilisateur doit être un nombre valide.',
            'user_id.exists' => 'L’utilisateur sélectionné n’existe pas.',
            'user_id.unique' => 'Cet utilisateur a déjà un panier.',
            
            // status
            'status.required' => 'Le statut du panier est obligatoire.',
            'status.in' => 'Le statut doit être soit "active" soit "converted".',
        ];
    }
}