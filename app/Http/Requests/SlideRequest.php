<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class SlideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],

            // image obligatoire en store, optionnelle en update
            'image_url' => [
                $isUpdate ? 'nullable' : 'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:255'
            ],

            'position' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.string' => 'Le titre doit être une chaîne de caractères.',
            'title.max' => 'Le titre ne doit pas dépasser 255 caractères.',

            'subtitle.string' => 'Le sous-titre doit être une chaîne de caractères.',
            'subtitle.max' => 'Le sous-titre ne doit pas dépasser 255 caractères.',

            'image_url.required' => 'L’image est obligatoire.',
            'image_url.file' => 'Fichier invalide.',
            'image_url.image' => 'Chaque fichier doit être une image.',
            'image_url.mimes' => 'Formats acceptés: jpg, jpeg, png, webp.',
            'image_url.max' => 'Chaque image ne doit pas dépasser 2MB.',

            'position.integer' => 'La position doit être un nombre entier.',
            'position.min' => 'La position doit être supérieure ou égale à 0.',

            'is_active.boolean' => 'Le statut actif doit être vrai ou faux.',
        ];
    }
}
