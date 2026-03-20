<?php

namespace App\Services;

use App\Models\Product;
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
        $payload = $this->buildPayload($data);

        if (empty($payload['name'])) {
            throw ValidationException::withMessages([
                'name' => 'Le nom est obligatoire.',
            ]);
        }

        $testimonial = $this->testimonialRepository->create($payload);

        if (!$testimonial) {
            throw ValidationException::withMessages([
                'testimonial' => 'Creation echouee.',
            ]);
        }

        return $testimonial;
    }

    public function updateTestimonial(Testimonial $testimonial, array $data)
    {
        $payload = $this->buildPayload($data, $testimonial);

        if (empty($payload)) {
          throw ValidationException::withMessages([
              'testimonial' => 'Aucune donnee a mettre a jour.',
          ]);
        }

        $updated = $this->testimonialRepository->update($testimonial, $payload);

        if (!$updated) {
            throw ValidationException::withMessages([
                'testimonial' => 'Mise a jour echouee.',
            ]);
        }

        return $updated;
    }

    public function deleteTestimonial(Testimonial $testimonial): void
    {
        if (!empty($testimonial->photo_url)) {
            $oldPath = public_path($testimonial->photo_url);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $this->testimonialRepository->delete($testimonial);
    }

    private function buildPayload(array $data, ?Testimonial $testimonial = null): array
    {
        $payload = [];

        if (array_key_exists('name', $data) || !$testimonial) {
            $payload['name'] = trim((string) ($data['name'] ?? $testimonial?->name ?? ''));
        }

        if (array_key_exists('city', $data) || !$testimonial) {
            $payload['city'] = trim((string) ($data['city'] ?? $testimonial?->city ?? ''));
        }

        $resolvedTargetType = $this->resolveTargetType($data, $testimonial);
        if ($resolvedTargetType !== null) {
            $payload['target_type'] = $resolvedTargetType;
        }

        $resolvedProductId = $this->resolveProductId($data, $testimonial, $resolvedTargetType);
        $resolvedProductName = $this->resolveProductName($data, $testimonial, $resolvedTargetType, $resolvedProductId);

        if ($resolvedProductId !== null || array_key_exists('product_id', $data) || $resolvedTargetType === 'platform') {
            $payload['product_id'] = $resolvedProductId;
        }

        if ($resolvedProductName !== null || array_key_exists('product_used', $data) || $resolvedTargetType === 'platform') {
            $payload['product_used'] = $resolvedProductName;
        }

        if (array_key_exists('rating', $data) || !$testimonial) {
            $payload['rating'] = array_key_exists('rating', $data)
                ? ($data['rating'] === null || $data['rating'] === '' ? null : (int) $data['rating'])
                : $testimonial?->rating;
        }

        if (array_key_exists('message', $data) || !$testimonial) {
            $payload['message'] = trim((string) ($data['message'] ?? $testimonial?->message ?? ''));
        }

        if (array_key_exists('is_active', $data) || !$testimonial) {
            $payload['is_active'] = array_key_exists('is_active', $data)
                ? (bool) $data['is_active']
                : (bool) ($testimonial?->is_active ?? true);
        }

        if (!empty($data['photo_url']) && $data['photo_url'] instanceof UploadedFile) {
            if (!empty($testimonial?->photo_url)) {
                $oldPath = public_path($testimonial->photo_url);
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $extension = $data['photo_url']->getClientOriginalExtension();
            $filename = 'testimonial-' . time() . '.' . $extension;
            $destination = public_path('images/testimonials');

            if (!file_exists($destination)) {
                mkdir($destination, 0755, true);
            }

            $data['photo_url']->move($destination, $filename);
            $payload['photo_url'] = 'images/testimonials/' . $filename;
        }

        return $payload;
    }

    private function resolveTargetType(array $data, ?Testimonial $testimonial = null): ?string
    {
        if (array_key_exists('target_type', $data) && !empty($data['target_type'])) {
            return (string) $data['target_type'];
        }

        if (array_key_exists('product_id', $data) && !empty($data['product_id'])) {
            return 'product';
        }

        if (array_key_exists('product_used', $data) && trim((string) $data['product_used']) !== '') {
            return 'product';
        }

        return $testimonial?->target_type ?? 'platform';
    }

    private function resolveProductId(array $data, ?Testimonial $testimonial, string $targetType): ?int
    {
        if ($targetType !== 'product') {
            return null;
        }

        $productId = array_key_exists('product_id', $data)
            ? ($data['product_id'] === null || $data['product_id'] === '' ? null : (int) $data['product_id'])
            : $testimonial?->product_id;

        if ($productId === null) {
            return null;
        }

        $product = Product::query()->find($productId, ['id']);
        if (!$product) {
            throw ValidationException::withMessages([
                'product_id' => 'Le produit selectionne est introuvable.',
            ]);
        }

        return $product->id;
    }

    private function resolveProductName(array $data, ?Testimonial $testimonial, string $targetType, ?int $productId): ?string
    {
        if ($targetType !== 'product') {
            return null;
        }

        if ($productId) {
            $product = Product::query()->find($productId, ['id', 'name']);
            if (!$product) {
                throw ValidationException::withMessages([
                    'product_id' => 'Le produit selectionne est introuvable.',
                ]);
            }

            return trim((string) $product->name);
        }

        $fallbackName = array_key_exists('product_used', $data)
            ? trim((string) $data['product_used'])
            : trim((string) ($testimonial?->product_used ?? ''));

        return $fallbackName !== '' ? $fallbackName : null;
    }
}
