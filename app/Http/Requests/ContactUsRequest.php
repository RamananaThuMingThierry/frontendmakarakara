<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContactUsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom est obligatoire.',
            'name.string' => 'Le nom doit etre une chaine de caracteres.',
            'name.max' => 'Le nom ne doit pas depasser 255 caracteres.',
            'email.required' => 'L\'email est obligatoire.',
            'email.email' => 'L\'email doit etre valide.',
            'email.max' => 'L\'email ne doit pas depasser 255 caracteres.',
            'phone.string' => 'Le telephone doit etre une chaine de caracteres.',
            'phone.max' => 'Le telephone ne doit pas depasser 30 caracteres.',
            'subject.required' => 'Le sujet est obligatoire.',
            'subject.string' => 'Le sujet doit etre une chaine de caracteres.',
            'subject.max' => 'Le sujet ne doit pas depasser 255 caracteres.',
            'message.required' => 'Le message est obligatoire.',
            'message.string' => 'Le message doit etre un texte.',
            'message.max' => 'Le message ne doit pas depasser 2000 caracteres.',
        ];
    }
}
