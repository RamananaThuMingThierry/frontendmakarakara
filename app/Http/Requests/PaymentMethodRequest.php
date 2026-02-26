<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check(); 
    }

    public function rules(): array
    {
        $paymentMethodId = decrypt_to_int_or_null($this->route('payment_method'));

        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('payment_methods', 'code')
                    ->ignore($paymentMethodId),
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp,svg',
                'max:2048', // 2MB
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du moyen de paiement est obligatoire.',
            'name.string' => 'Le nom doit être une chaîne de caractères.',
            'name.max' => 'Le nom ne doit pas dépasser 255 caractères.',

            'code.required' => 'Le code est obligatoire.',
            'code.string' => 'Le code doit être une chaîne valide.',
            'code.max' => 'Le code ne doit pas dépasser 100 caractères.',
            'code.unique' => 'Ce code existe déjà.',

            'image.image' => 'Le fichier doit être une image valide.',
            'image.mimes' => 'L’image doit être au format jpg, jpeg, png, webp ou svg.',
            'image.max' => 'L’image ne doit pas dépasser 2MB.',

            'is_active.boolean' => 'Le statut doit être vrai ou faux.',
        ];
    }
}