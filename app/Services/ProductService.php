<?php

namespace App\Services;

use App\Models\Product;
use App\Repositories\ProductImageRepository;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use App\Repositories\ProductRepository;
use Illuminate\Validation\ValidationException;

class ProductService
{
    public function __construct(private ProductRepository $productRepository, private ProductImageRepository $productImageRepository) {}

    public function getAllProducts(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->productRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getProductById(int|string $id, array $fields = [], array $relations = [])
    {
        return $this->productRepository->getById($id, $fields, $relations);
    }

    public function getProductByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [])
    {
        return $this->productRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createProduct(array $data)
    {
        $name = trim((string) ($data['name'] ?? ''));

        $payload = [
            'name' => $name,
            'slug' => !empty($data['slug']) ? $data['slug'] : Str::slug($name),
            'description' => $data['description'] ?? '',
            'price' => $data['price'] ?? 0,
            'compare_price' => $data['compare_price'] ?? null,
            'sku' => $data['sku'] ?? null,
            'barcode' => $data['barcode'] ?? null,
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : true,
        ];

        if (isset($data['category_id'])) {
            $payload['category_id'] = $data['category_id'];
        }else {
            throw ValidationException::withMessages([
                'category_id' => 'Le champ category_id est requis.',
            ]);
        }

        if(isset($data['brand_id'])) {
            $payload['brand_id'] = $data['brand_id'];
        }

        $product = $this->productRepository->create($payload);

        if(isset($data['images']) && is_array($data['images'])) {
            $i = 0;
            foreach($data['images'] as $image) {
                if ($image instanceof UploadedFile) {
                    $extension = $image->getClientOriginalExtension();
                    $filename = Str::slug($name) . '-' . time() . '-' . Str::random(5) . '.' . $extension;

                    $destination = public_path('images/products');

                    // crée le dossier s'il n'existe pas
                    if (!file_exists($destination)) {
                        mkdir($destination, 0755, true);
                    }

                    $image->move($destination, $filename);

                    // chemin enregistré en DB
                    $payload['image_url'] = 'images/products/' . $filename;

                    $this->productImageRepository->create([
                        'product_id' => $product->id,
                        'image_url' => $payload['image_url'],
                        'position' => $i++,
                    ]);
                }
            }
        }

        if (!$product) {
            throw ValidationException::withMessages([
                'Product' => 'Création échouée.',
            ]);
        }

        return $product;
    }

    public function updateProduct(int|string $id, array $data)
    {
        $product = $this->getProductById($id, ['*']);
        
        $payload = [
            'name' => trim((string) ($data['name'] ?? $product->name)),
            'slug' => !empty($data['slug']) ? $data['slug'] : Str::slug(trim((string) ($data['name'] ?? $product->name))),
            'description' => $data['description'] ?? $product->description,
            'price' => $data['price'] ?? $product->price,
            'compare_price' => $data['compare_price'] ?? $product->compare_price,
            'sku' => $data['sku'] ?? $product->sku,
            'barcode' => $data['barcode'] ?? $product->barcode,
        ];

        if(isset($data['category_id'])) {
            $payload['category_id'] = $data['category_id'];
        }else{
            $payload['category_id'] = $product->category_id ?? null;

            if(empty($payload['category_id'])) {
                throw ValidationException::withMessages([
                    'category_id' => 'Le champ category_id est requis.',
                ]);
            }
        }
        
        // brand_id
        $payload['brand_id'] = $data['brand_id'] ?? ($product->brand_id ?? null);

        // is_active
        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool) $data['is_active'];
        }

        // rien à update ?
        if (empty($payload)) {
            throw ValidationException::withMessages([
                'product' => 'Aucune donnée à mettre à jour.',
            ]);
        }

        $updated = $this->productRepository->update($product, $payload);
        
        if (!$updated) {
            throw ValidationException::withMessages([
                'product' => 'Mise à jour échouée.',
            ]);
        }

        // --- IMAGES ---
        // 1) Charger les images actuelles
        $constraints = [
            'product_id' => $product->id,
        ];

        $currentImages = $this->productImageRepository->getAll(
            array_keys($constraints),
            array_values($constraints),
            ['*']
        );

        $currentCount  = count($currentImages);

        // 2) Supprimer celles demandées
        $deletedIds = $data['deleted_image_ids'] ?? [];
        if (!is_array($deletedIds)) {
            $deletedIds = [];
        }

        if (!empty($deletedIds)) {
        
            // contraintes pour récupérer les images à supprimer
            $constraints = [
                'product_id' => $product->id,
                'id' => $deletedIds
            ];

            // récupérer les images à supprimer
            $toDelete = $this->productImageRepository->getAll(
                array_keys($constraints),
                array_values($constraints),
                ['*']
            );

            // suppression physique des fichiers + suppression en DB    
            foreach ($toDelete as $img) {
                if (!empty($img->image_url)) {
                    $path = public_path($img->image_url);
                    if (file_exists($path)) {
                        $this->productImageRepository->delete($img);
                        @unlink($path);
                    
                    }
                }
            }
        }

            // 3) Ajouter nouvelles images (si fournies)
    $newFiles = $data['images'] ?? [];
    $newCount = 0;

        if (is_array($newFiles)) {
        $destination = public_path('images/products');
        if (!file_exists($destination)) {
            mkdir($destination, 0755, true);
        }

        foreach ($newFiles as $file) {
            if (!($file instanceof UploadedFile)) {
                continue;
            }

            $extension = $file->getClientOriginalExtension();
            $filename = Str::slug($payload['name']) . '-' . time() . '-' . Str::random(5) . '.' . $extension;

            $file->move($destination, $filename);

            $imageUrl = 'images/products/' . $filename;

            $this->productImageRepository->create([
                'product_id' => $product->id,
                'image_url'  => $imageUrl,
                'position'   => 0, // option: recalculer positions après
            ]);

            $newCount++;
  
        }
        }

            // 4) Validation finale: il doit rester au moins 1 image
    if (($currentCount + $newCount) < 1) {
        throw ValidationException::withMessages([
            'images' => 'Le produit doit avoir au moins une image.',
        ]);
    }

        $this->productImageRepository->reorderPositions($product->id);

            return $updated;
        }

    public function deleteProduct(Product $product): void
    {
        $product = $this->getProductById($product->id, ['id','image_url']);

        if (!$product) {
            throw ValidationException::withMessages([
                'Product' => 'Product non trouvée.',
            ]);
        }

        $this->productRepository->delete($product);
    }
}
