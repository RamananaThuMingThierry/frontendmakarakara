<?php

namespace App\Services;

use App\Models\Gallery;
use App\Models\User;
use App\Repositories\GalleryRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class GalleryService
{
    public function __construct(private GalleryRepository $galleryRepository) {}

    public function getAllGalleries(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null)
    {
        return $this->galleryRepository->getAll($keys, $values, $fields, $paginate);
    }

    public function getGalleryById(int|string $id, array $fields = [])
    {
        return $this->galleryRepository->getById($id, $fields);
    }

    public function getGalleryByKeys(string|array $keys, mixed $values, array $fields = [])
    {
        return $this->galleryRepository->getByKeys($keys, $values, $fields);
    }

    public function createGallery(array $data)
    {
        $payload = [
            'name' => trim((string) ($data['name'] ?? '')),
            'likes' => isset($data['likes']) ? (int) $data['likes'] : 0,
        ];

        if (!empty($data['image_url']) && $data['image_url'] instanceof UploadedFile) {
            $payload['image_url'] = $this->storeImage($data['image_url']);
        }

        if (empty($payload['image_url'])) {
            throw ValidationException::withMessages([
                'image_url' => 'L image est obligatoire.',
            ]);
        }

        $gallery = $this->galleryRepository->create($payload);

        if (!$gallery) {
            throw ValidationException::withMessages([
                'gallery' => 'Creation echouee.',
            ]);
        }

        return $gallery;
    }

    public function updateGallery(Gallery $gallery, array $data)
    {
        $payload = [];

        if (array_key_exists('name', $data)) {
            $payload['name'] = trim((string) $data['name']);
        }

        if (array_key_exists('likes', $data)) {
            $payload['likes'] = (int) $data['likes'];
        }

        if (!empty($data['image_url']) && $data['image_url'] instanceof UploadedFile) {
            if (!empty($gallery->image_url)) {
                $oldPath = public_path($gallery->image_url);
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $payload['image_url'] = $this->storeImage($data['image_url']);
        }

        if (empty($payload)) {
            throw ValidationException::withMessages([
                'gallery' => 'Aucune donnee a mettre a jour.',
            ]);
        }

        $updated = $this->galleryRepository->update($gallery, $payload);

        if (!$updated) {
            throw ValidationException::withMessages([
                'gallery' => 'Mise a jour echouee.',
            ]);
        }

        return $updated;
    }

    public function deleteGallery(Gallery $gallery): void
    {
        if (!empty($gallery->image_url)) {
            $oldPath = public_path($gallery->image_url);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $this->galleryRepository->delete($gallery);
    }

    public function toggleLike(Gallery $gallery, User $user): array
    {
        return DB::transaction(function () use ($gallery, $user) {
            $gallery = Gallery::query()->lockForUpdate()->findOrFail($gallery->id);

            $alreadyLiked = $gallery->likedByUsers()
                ->where('user_id', $user->id)
                ->exists();

            if ($alreadyLiked) {
                $gallery->likedByUsers()->detach($user->id);
                $gallery->likes = max(0, (int) $gallery->likes - 1);
                $gallery->save();

                return [
                    'liked' => false,
                    'likes' => (int) $gallery->likes,
                ];
            }

            $gallery->likedByUsers()->attach($user->id);
            $gallery->likes = (int) $gallery->likes + 1;
            $gallery->save();

            return [
                'liked' => true,
                'likes' => (int) $gallery->likes,
            ];
        });
    }

    private function storeImage(UploadedFile $image): string
    {
        $extension = $image->getClientOriginalExtension();
        $filename = 'gallery-' . time() . '-' . uniqid() . '.' . $extension;
        $destination = public_path('images/gallery');

        if (!file_exists($destination)) {
            mkdir($destination, 0755, true);
        }

        $image->move($destination, $filename);

        return 'images/gallery/' . $filename;
    }
}
