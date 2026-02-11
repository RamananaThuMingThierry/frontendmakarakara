<?php

namespace App\Services;

use App\Models\Slide;
use App\Repositories\SlideRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class SlideService
{
    public function __construct(private SlideRepository $slideRepository) {}

    public function getAllSlides(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null)
    {
        return $this->slideRepository->getAll($keys, $values, $fields, $paginate);
    }

    public function getSlideById(int|string $id, array $fields = [])
    {
        return $this->slideRepository->getById($id, $fields);
    }

    public function getSlideByKeys(string|array $keys, mixed $values, array $fields = [])
    {
        return $this->slideRepository->getByKeys($keys, $values, $fields);
    }

    public function createSlide(array $data)
    {
        $title = trim((string) ($data['title'] ?? ''));

        $payload = [
            'title' => $title,
            'subtitle' => trim((string) ($data['subtitle'] ?? '')),
            'position' => $data['position'] ?? 0,
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : true,
        ];

        // ✅ Gestion de l'image (image_url)
        if (!empty($data['image_url']) && $data['image_url'] instanceof UploadedFile) {
            $extension = $data['image_url']->getClientOriginalExtension();
            $filename = 'slide-' . time() . '.' . $extension;

            $destination = public_path('images/slides');

            // crée le dossier s'il n'existe pas
            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['image_url']->move($destination, $filename);

            // chemin enregistré en DB
            $payload['image_url'] = 'images/slides/' . $filename;
        }

        $slide = $this->slideRepository->create($payload);

        if (!$slide) {
            throw ValidationException::withMessages([
                'Slide' => 'Création échouée.',
            ]);
        }

        return $slide;
    }

    public function updateSlide(int|string $id, array $data)
    {
        $slide = $this->getSlideById($id, ['*']);

        $payload = [
            'title' => trim((string) ($data['title'] ?? $slide->title)),
            'subtitle' => trim((string) ($data['subtitle'] ?? $slide->subtitle)),
            'position' => $data['position'] ?? $slide->position,
        ];

        // is_active
        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool) $data['is_active'];
        }

        // ✅ image_url (upload dans public/images/slides)
        if (!empty($data['image_url']) && $data['image_url'] instanceof UploadedFile) {
            // supprimer ancienne image si existe
            if (!empty($slide->image_url)) {
                $oldPath = public_path($slide->image_url);
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }
            if (!empty($brand->logo)) {
                $oldPath = public_path($brand->logo);
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $nameForFile = $payload['title'] ?? $slide->title;

            $extension = $data['image_url']->getClientOriginalExtension();
            $filename = 'slide-' . time() . '.' . $extension;

            $destination = public_path('images/slides');
            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['image_url']->move($destination, $filename);

            $payload['image_url'] = 'images/slides/' . $filename;
        }

        // rien à update ?
        if (empty($payload)) {
            throw ValidationException::withMessages([
                'slide' => 'Aucune donnée à mettre à jour.',
            ]);
        }

        $updated = $this->slideRepository->update($slide, $payload);

        if (!$updated) {
            throw ValidationException::withMessages([
                'Slide' => 'Mise à jour échouée.',
            ]);
        }

        return $updated;
    }

    public function deleteSlide(Slide $slide): void
    {
        $slide = $this->getSlideById($slide->id, ['id','image_url']);

        if (!$slide) {
            throw ValidationException::withMessages([
                'Slide' => 'Slide non trouvée.',
            ]);
        }

        // supprimer ancienne image si existe
        if (!empty($slide->image_url)) {
            $oldPath = public_path($slide->image_url);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $this->slideRepository->delete($slide);
    }
}
