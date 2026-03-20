<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TestimonialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'name' => [
                $isUpdate ? 'sometimes' : 'required',
                'string',
                'max:255',
            ],

            'photo_url' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'city' => [
                'nullable',
                'string',
                'max:255',
            ],

            'target_type' => [
                'nullable',
                Rule::in(['platform', 'product']),
            ],

            'product_id' => [
                'nullable',
                'integer',
                'exists:products,id',
                Rule::requiredIf(fn () => $this->input('target_type') === 'product'),
            ],

            'product_used' => [
                'nullable',
                'string',
                'max:255',
            ],

            'rating' => [
                'nullable',
                'integer',
                'min:1',
                'max:5',
            ],

            'message' => [
                $isUpdate ? 'sometimes' : 'required',
                'string',
                'max:2000',
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
            'name.required' => 'Le nom est obligatoire.',
            'name.string' => 'Le nom doit etre une chaine de caracteres.',
            'name.max' => 'Le nom ne doit pas depasser 255 caracteres.',

            'photo_url.image' => 'Le fichier doit etre une image.',
            'photo_url.mimes' => 'La photo doit etre au format jpg, jpeg, png ou webp.',
            'photo_url.max' => 'La photo ne doit pas depasser 2MB.',

            'city.string' => 'La ville doit etre une chaine de caracteres.',
            'city.max' => 'La ville ne doit pas depasser 255 caracteres.',

            'target_type.in' => "Le type d'avis doit etre produit ou plateforme.",

            'product_id.required' => 'Le produit est obligatoire pour un avis produit.',
            'product_id.integer' => 'Le produit selectionne est invalide.',
            'product_id.exists' => 'Le produit selectionne est introuvable.',

            'product_used.string' => 'Le produit utilise doit etre une chaine de caracteres.',
            'product_used.max' => 'Le produit utilise ne doit pas depasser 255 caracteres.',

            'rating.integer' => 'La note doit etre un nombre entier.',
            'rating.min' => 'La note minimum est 1.',
            'rating.max' => 'La note maximum est 5.',

            'message.required' => 'Le message est obligatoire.',
            'message.string' => 'Le message doit etre un texte.',
            'message.max' => 'Le message ne doit pas depasser 2000 caracteres.',

            'is_active.boolean' => 'Le statut actif doit etre vrai ou faux.',
        ];
    }
}
