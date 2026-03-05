<?php

namespace App\Services;

use App\Models\ProductImage;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use App\Repositories\ProductImageRepository;
use App\Repositories\ProductRepository;
use Illuminate\Validation\ValidationException;

class ProductImageService
{
    public function __construct(
        private readonly ProductImageRepository $productImageRepository,
        private readonly ProductRepository $productRepository,
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

            $productId = (int) $data['product_id'];

            $product = $this->productRepository->getById($productId, ['id', 'name'], ['images']);

            if (!$product) {
                throw ValidationException::withMessages([
                    'product_id' => 'Produit non trouvé.',
                ]);
            }

            /** @var UploadedFile[] $images */
            $images = $data['images'] ?? [];

            if (!is_array($images) || count($images) < 1) {
                throw ValidationException::withMessages([
                    'images' => 'Veuillez ajouter au moins une image.',
                ]);
            }

            // ✅ vérifier le nombre total d'images
            $existingImagesCount = $product->images->count();
            $newImagesCount = count($images);

            if (($existingImagesCount + $newImagesCount) > 6) {
                $remaining = max(0, 6 - $existingImagesCount);

                throw ValidationException::withMessages([
                'images' => "Limite 6 images. Il reste {$remaining} emplacement(s).",
                ]);
            }

            $destination = public_path('images/products');
            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $created = [];

            foreach ($images as $image) {
                if (!$image instanceof UploadedFile) {
                    continue;
                }

                $extension = $image->getClientOriginalExtension();
                $filename  = Str::slug($product->name) . '-' . time() . '-' . Str::random(6) . '.' . $extension;

                $image->move($destination, $filename);

                $created[] = $this->productImageRepository->create([
                    'product_id' => $product->id,
                    'url'        => 'images/products/' . $filename,
                ]);
            }

            if (count($created) < 1) {
                throw ValidationException::withMessages([
                    'images' => 'Aucune image valide n’a été envoyée.',
                ]);
            }

            return $created;
        });
    }

    public function deleteProductImage(ProductImage $productImage): void
    {

        // supprimer ancienne image si existe
        if (!empty($productImage->url)) {
            $oldPath = public_path($productImage->url);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $this->productImageRepository->delete($productImage);
    }
}
