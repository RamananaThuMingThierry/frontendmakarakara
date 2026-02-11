<?php

namespace App\Services;

use App\Models\Brand;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use App\Repositories\BrandRepository;
use Illuminate\Validation\ValidationException;

class BrandService
{
    public function __construct(private BrandRepository $brandRepository) {}

    public function getAllBrands(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->brandRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getBrandById(int|string $id, array $fields = [], array $relations = [])
    {
        return $this->brandRepository->getById($id, $fields, $relations);
    }

    public function getBrandByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [])
    {
        return $this->brandRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createBrand(array $data)
    {
        $name = trim((string) ($data['name'] ?? ''));

        $payload = [
            'name' => $name,
            'slug' => !empty($data['slug']) ? $data['slug'] : Str::slug($name),
            'description' => $data['description'] ?? null,
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : true,
        ];

        // ✅ Gestion de l'image (logo)
        if (!empty($data['logo']) && $data['logo'] instanceof UploadedFile) {
            $extension = $data['logo']->getClientOriginalExtension();
            $filename = Str::slug($name) . '-' . time() . '.' . $extension;

            $destination = public_path('images/brands');

            // crée le dossier s'il n'existe pas
            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['logo']->move($destination, $filename);

            // chemin enregistré en DB
            $payload['logo'] = 'images/brands/' . $filename;
        }

        $brand = $this->brandRepository->create($payload);

        if (!$brand) {
            throw ValidationException::withMessages([
                'Brand' => 'Création échouée.',
            ]);
        }

        return $brand;
    }

    public function updateBrand(int|string $id, array $data)
    {
        $brand = $this->getBrandById($id, ['*']);

        $payload = [];

        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);
            if ($name === '') {
                throw ValidationException::withMessages([
                    'name' => 'Le nom ne peut pas être vide.',
                ]);
            }

            $payload['name'] = $name;

            // si slug non fourni, on peut régénérer (à toi de décider)
            if (!array_key_exists('slug', $data)) {
                $payload['slug'] = Str::slug($name);
            }
        }

        if (array_key_exists('slug', $data)) {
            $payload['slug'] = trim((string) $data['slug']);
        }

        // description
        if (array_key_exists('description', $data)) {
            $payload['description'] = $data['description'] !== null ? trim((string) $data['description']) : null;
        }

        // is_active
        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool) $data['is_active'];
        }

        // ✅ logo (upload dans public/images/brands)
        if (!empty($data['logo']) && $data['logo'] instanceof UploadedFile) {
            // supprimer ancien logo si existe
            if (!empty($brand->logo)) {
                $oldPath = public_path($brand->logo);
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $nameForFile = $payload['name'] ?? $brand->name;

            $extension = $data['logo']->getClientOriginalExtension();
            $filename = Str::slug($nameForFile) . '-' . time() . '.' . $extension;

            $destination = public_path('images/brands');
            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['logo']->move($destination, $filename);

            $payload['logo'] = 'images/brands/' . $filename;
        }

        // rien à update ?
        if (empty($payload)) {
            throw ValidationException::withMessages([
                'brand' => 'Aucune donnée à mettre à jour.',
            ]);
        }

        $updated = $this->brandRepository->update($brand, $payload);

        if (!$updated) {
            throw ValidationException::withMessages([
                'Brand' => 'Mise à jour échouée.',
            ]);
        }

        return $updated;
    }

    public function deleteBrand(Brand $brand): void
    {
        $brand = $this->getBrandById($brand->id, ['id','logo']);

        if (!$brand) {
            throw ValidationException::withMessages([
                'Brand' => 'Brand non trouvée.',
            ]);
        }

        // supprimer ancien logo si existe
        if (!empty($brand->logo)) {
            $oldPath = public_path($brand->logo);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $this->brandRepository->delete($brand);
    }
}
