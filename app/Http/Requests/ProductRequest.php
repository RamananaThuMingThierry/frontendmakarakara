<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = decrypt_to_int_or_null($this->route('product'));

        return [
            'category_id'   => ['required', 'integer', 'exists:categories,id'],
            'brand_id'      => ['nullable', 'integer', 'exists:brands,id'],

            'name'          => ['required', 'string', 'max:255'],
            'slug'          => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($productId),
            ],
            'description'   => ['nullable', 'string'],

            'price'         => ['required', 'numeric', 'min:0'],
            'compare_price' => ['nullable', 'numeric', 'min:0', 'gte:price'],

            'sku'           => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'sku')->ignore($productId),
            ],
            'barcode'       => ['nullable', 'string', 'max:255'],

            'is_active'     => ['sometimes', 'boolean'],

            // ✅ Upload fichiers
            'images'        => ['sometimes', 'array'],
            'images.*'      => ['file', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // slug auto si absent
        if (!$this->filled('slug') && $this->filled('name')) {
            $this->merge([
                'slug' => Str::slug($this->input('name')),
            ]);
        }
    }

    public function messages(): array
    {
        return [
            'category_id.required' => 'La catégorie est obligatoire.',
            'category_id.exists'   => 'Catégorie invalide.',
            'brand_id.exists'      => 'Marque invalide.',
            'compare_price.gte'    => 'Le prix barré doit être supérieur ou égal au prix.',
            'images.*.image'       => 'Chaque fichier doit être une image.',
            'images.*.mimes'       => 'Formats acceptés: jpg, jpeg, png, webp.',
            'images.*.max'         => 'Chaque image ne doit pas dépasser 2MB.',
        ];
    }

    /** Champs produits sans images */
    public function productOnly(): array
    {
        return $this->safe()->except(['images']);
    }
}
