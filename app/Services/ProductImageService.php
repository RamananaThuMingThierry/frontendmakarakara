<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use App\Repositories\ProductImageRepository;
use Illuminate\Validation\ValidationException;

class ProductImageService
{
    public function __construct(
        private ProductImageRepository $productImageRepository
    ) {}

    public function getAllProductImages(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->productImageRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getProductImageById(int|string $id, array $fields = [], array $relations = [])
    {
        return $this->productImageRepository->getById($id, $fields, $relations);
    }

    public function getProductImageByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [])
    {
        return $this->productImageRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createProductImage(array $data)
    {
        return DB::transaction(function () use ($data) {

            $payload = [];

            if (!isset($data['product_id'])) {
                throw ValidationException::withMessages([
                    'product_id' => 'Le champ product_id est requis.',
                ]);
            }else{
                $payload['product_id'] = (int) $data['product_id'];

                $product = $this->productImageRepository->getById($payload['product_id'], ['id', 'name']);
            
                if (!$product) {
                    throw ValidationException::withMessages([
                        'product_id' => 'Produit non trouvé.',
                    ]);
                }
            }

            // ✅ Images uploadées
            $files = [];
            if (isset($data['images']) && is_array($data['images'])) {
                foreach ($data['images'] as $image) {
                    if ($image instanceof UploadedFile) {
                        $files[] = $image;
                    }
                }
            }

            if (!empty($files)) {

                $destination = public_path('images/products');

                if (!file_exists($destination)) {
                    mkdir($destination, 0755, true);
                }

                foreach ($files as $i => $image) {
                    $extension = $image->getClientOriginalExtension();
                    $filename  = Str::slug($product->name) . '-' . time() . '-' . Str::random(6) . '.' . $extension;

                    $image->move($destination, $filename);

                    $this->productImageRepository->create([
                        'product_id' => $product->id,
                        'url'        => 'images/products/' . $filename, // ✅ champ correct
                        'position'   => $i,
                    ]);
                }

            $productImage = $this->productImageRepository->create($payload);

            if (!$productImage) {
                throw ValidationException::withMessages([
                    'product_image' => 'Création échouée.',
                ]);
            }

   
            }

            return $productImage;
        });
    }

    public function deleteProductImage(int $productImageId): void
    {
        $productImage = $this->getProductImageById($productImageId, ['id','url']);

        if (!$productImage) {
            throw ValidationException::withMessages([
                'ProductImage' => 'Image de produit non trouvée.',
            ]);
        }

        $this->productImageRepository->delete($productImage);
    }
}
