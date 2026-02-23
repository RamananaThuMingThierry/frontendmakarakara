<?php

namespace App\Services;

use App\Models\Testimonial;
use App\Repositories\TestimonialRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class TestimonialService
{
    public function __construct(private TestimonialRepository $testimonialRepository) {}

    public function getAllTestimonials(string|array $keys, mixed $values, array $fields = ['*'], ?int $paginate = null)
    {
        return $this->testimonialRepository->getAll($keys, $values, $fields, $paginate);
    }

    public function getTestimonialById(int|string $id, array $fields = [])
    {
        return $this->testimonialRepository->getById($id, $fields);
    }

    public function getTestimonialByKeys(string|array $keys, mixed $values, array $fields = [])
    {
        return $this->testimonialRepository->getByKeys($keys, $values, $fields);
    }

    public function createTestimonial(array $data)
    {
        $payload = [
            'name'         => trim((string)($data['name'] ?? '')),
            'city'         => trim((string)($data['city'] ?? '')),
            'product_used' => trim((string)($data['product_used'] ?? '')),
            'rating'       => isset($data['rating']) ? (int)$data['rating'] : null,
            'message'      => trim((string)($data['message'] ?? '')),
            'position'     => isset($data['position']) ? (int)$data['position'] : 0,
            'is_active'    => array_key_exists('is_active', $data) ? (bool)$data['is_active'] : true,
        ];

        // ✅ Gestion de profil (photo_url)
        if (!empty($data['photo_url']) && $data['photo_url'] instanceof UploadedFile) {
            $extension = $data['photo_url']->getClientOriginalExtension();
            $filename = 'testimonial-' . time() . '.' . $extension;

            $destination = public_path('images/testimonials');

            // crée le dossier s'il n'existe pas
            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['photo_url']->move($destination, $filename);

            // chemin enregistré en DB
            $payload['photo_url'] = 'images/testimonials/' . $filename;
        }


        if (empty($payload['name'])) {
            throw ValidationException::withMessages([
                'name' => 'Le nom est obligatoire.',
            ]);
        }

        $testimonial = $this->testimonialRepository->create($payload);

        if (!$testimonial) {
            throw ValidationException::withMessages([
                'testimonial' => 'Création échouée.',
            ]);
        }

        return $testimonial;
    }

    public function updateTestimonial(Testimonial $testimonial, array $data)
    {

        $payload = [];

        if (array_key_exists('name', $data)) {
            $payload['name'] = trim((string)$data['name']);
        }
        if (array_key_exists('city', $data)) {
            $payload['city'] = trim((string)$data['city']);
        }
        if (array_key_exists('product_used', $data)) {
            $payload['product_used'] = trim((string)$data['product_used']);
        }
        if (array_key_exists('rating', $data)) {
            $payload['rating'] = $data['rating'] === null ? null : (int)$data['rating'];
        }
        if (array_key_exists('message', $data)) {
            $payload['message'] = trim((string)$data['message']);
        }
        if (array_key_exists('position', $data)) {
            $payload['position'] = (int)$data['position'];
        }
        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool)$data['is_active'];
        }

        // ✅ photo_url (upload dans public/images/testimonials)
        if (!empty($data['photo_url']) && $data['photo_url'] instanceof UploadedFile) {
            // supprimer ancienne image si existe
            if (!empty($testimonial->photo_url)) {
                $oldPath = public_path($testimonial->photo_url);
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $extension = $data['photo_url']->getClientOriginalExtension();

            $filename =  'testimonial-' . time() . '.' . $extension;

            $destination = public_path('images/testimonials');

            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['photo_url']->move($destination, $filename);

            $payload['photo_url'] = 'images/testimonials/' . $filename;
        }

        // rien à update ?
        if (empty($payload)) {
            throw ValidationException::withMessages([
                'testimonial' => 'Aucune donnée à mettre à jour.',
            ]);
        }

        $updated = $this->testimonialRepository->update($testimonial, $payload);

        if (!$updated) {
            throw ValidationException::withMessages([
                'testimonial' => 'Mise à jour échouée.',
            ]);
        }

        return $updated;
    }

    public function deleteTestimonial(Testimonial $testimonial): void
    {
        // supprimer ancienne image si existe
        if (!empty($testimonial->photo_url)) {
            $oldPath = public_path($testimonial->photo_url);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $this->testimonialRepository->delete($testimonial);
    }
}
