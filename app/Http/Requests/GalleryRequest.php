<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class GalleryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'image_url' => [
                $isUpdate ? 'nullable' : 'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
            'name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'likes' => [
                'nullable',
                'integer',
                'min:0',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'image_url.required' => 'L image est obligatoire.',
            'image_url.file' => 'Fichier invalide.',
            'image_url.image' => 'Le fichier doit etre une image.',
            'image_url.mimes' => 'Formats acceptes: jpg, jpeg, png, webp.',
            'image_url.max' => 'L image ne doit pas depasser 2MB.',
            'name.string' => 'Le nom doit etre une chaine de caracteres.',
            'name.max' => 'Le nom ne doit pas depasser 255 caracteres.',
            'likes.integer' => 'Le nombre de likes doit etre un nombre entier.',
            'likes.min' => 'Le nombre de likes doit etre superieur ou egal a 0.',
        ];
    }
}
