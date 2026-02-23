<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class TestimonialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
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

            'position' => [
                'nullable',
                'integer',
                'min:0',
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
            'name.string' => 'Le nom doit être une chaîne de caractères.',
            'name.max' => 'Le nom ne doit pas dépasser 255 caractères.',

            'photo_url.image' => 'Le fichier doit être une image.',
            'photo_url.mimes' => 'La photo doit être au format jpg, jpeg, png ou webp.',
            'photo_url.max' => 'La photo ne doit pas dépasser 2MB.',

            'city.string' => 'La ville doit être une chaîne de caractères.',
            'city.max' => 'La ville ne doit pas dépasser 255 caractères.',

            'product_used.string' => 'Le produit utilisé doit être une chaîne de caractères.',
            'product_used.max' => 'Le produit utilisé ne doit pas dépasser 255 caractères.',

            'rating.integer' => 'La note doit être un nombre entier.',
            'rating.min' => 'La note minimum est 1.',
            'rating.max' => 'La note maximum est 5.',

            'message.required' => 'Le message est obligatoire.',
            'message.string' => 'Le message doit être un texte.',
            'message.max' => 'Le message ne doit pas dépasser 2000 caractères.',

            'position.integer' => 'La position doit être un nombre entier.',
            'position.min' => 'La position doit être supérieure ou égale à 0.',

            'is_active.boolean' => 'Le statut actif doit être vrai ou faux.',
        ];
    }
}
