<?php

namespace App\Http\Requests;

use Exception;
use Illuminate\Foundation\Http\FormRequest;

class ProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('product_id')) {
            try {
                $this->merge([
                    'product_id' => decrypt_to_int_or_null($this->input('product_id')),
                ]);
            } catch (Exception $e) {
                $this->merge(['product_id' => null]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'images'     => ['required', 'array', 'min:1', 'max:6'],
            'images.*'   => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Le champ product_id est requis.',
            'product_id.integer'  => 'Le produit est invalide.',
            'product_id.exists'   => 'Le produit sélectionné n’existe pas.',

            'images.required'    => 'Veuillez ajouter au moins une image.',
            'images.array'       => 'Le champ images doit être un tableau.',
            'images.min'         => 'Veuillez ajouter au moins une image.',
            'images.max'         => 'Le nombre d\'images maximal est 6.', 

            'images.*.required'  => 'Chaque image est obligatoire.',
            'images.*.file'      => 'Chaque élément doit être un fichier.',
            'images.*.image'     => 'Chaque fichier doit être une image.',
            'images.*.mimes'     => 'Formats autorisés : jpg, jpeg, png, webp.',
            'images.*.max'       => 'Chaque image ne doit pas dépasser 2 Mo.',
        ];
    }
}