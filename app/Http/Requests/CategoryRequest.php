<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ou vérifie le rôle admin ici
    }

    public function rules(): array
    {
        $categoryId = decrypt_to_int_or_null($this->route('category'));

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($categoryId),
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($categoryId),
            ],

            'parent_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
                'not_in:' . $categoryId, // empêcher parent = soi-même
            ],

            'is_active' => [
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom est obligatoire.',
            'name.unique' => 'Cette catégorie existe déjà.',
            'slug.unique' => 'Slug déjà utilisé.',
            'parent_id.exists' => 'La catégorie parent est invalide.',
            'parent_id.not_in' => 'Une catégorie ne peut pas être son propre parent.',
        ];
    }
}
