<?php

namespace App\Services;

use App\Models\Coupon;
use App\Repositories\CouponRepository;
use Illuminate\Validation\ValidationException;

class CouponService
{
    public function __construct(private CouponRepository $couponRepository) {}

    public function getAllCoupons(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->couponRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getCouponById(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->couponRepository->getById($id, $fields, $relations);
    }

    public function getCouponByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->couponRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createCoupon(array $data)
    {
        $code = trim((string) ($data['code'] ?? ''));
        if ($code === '') {
            throw ValidationException::withMessages(['code' => 'Le code est obligatoire.']);
        }

        // s'assurer que le code n'existe pas déjà
        $existing = $this->couponRepository->getByKeys('code', $code, ['id']);
        if ($existing) {
            throw ValidationException::withMessages(['code' => 'Un coupon avec ce code existe déjà.']);
        }

        $payload = [
            'code' => $code,
            'value' => $data['value'] ?? 0,
            'type' => $data['type'] ?? 'fixed', // fixed|percent
            'min_subtotal' => $data['min_subtotal'] ?? 0,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'usage_limit' => $data['usage_limit'] ?? null,
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : true,
        ];

        $coupon = $this->couponRepository->create($payload);

        if (!$coupon) {
            throw ValidationException::withMessages(['coupon' => 'Création du coupon échouée.']);
        }

        return $coupon;
    }

    public function updateCoupon(Coupon $coupon, array $data)
    {
        $payload = [];

        if (array_key_exists('code', $data)) {
            $code = trim((string) $data['code']);
            if ($code === '') {
                throw ValidationException::withMessages(['code' => 'Le code ne peut pas être vide.']);
            }

            // unique check excluding current
            $existing = $this->couponRepository->getByKeys('code', $code, ['id']);
            if ($existing && $existing->id !== $coupon->id) {
                throw ValidationException::withMessages(['code' => 'Un autre coupon utilise ce code.']);
            }

            $payload['code'] = $code;
        }

        if (array_key_exists('value', $data)) {
            $payload['value'] = $data['value'];
        }

        if (array_key_exists('type', $data)) {
            $payload['type'] = $data['type'];
        }

        if (array_key_exists('min_subtotal', $data)) {
            $payload['min_subtotal'] = $data['min_subtotal'];
        }

        if (array_key_exists('starts_at', $data)) {
            $payload['starts_at'] = $data['starts_at'];
        }

        if (array_key_exists('ends_at', $data)) {
            $payload['ends_at'] = $data['ends_at'];
        }

        if (array_key_exists('usage_limit', $data)) {
            $payload['usage_limit'] = $data['usage_limit'];
        }

        if (array_key_exists('is_active', $data)) {
            $payload['is_active'] = (bool) $data['is_active'];
        }

        if (empty($payload)) {
            throw ValidationException::withMessages(['coupon' => 'Aucune donnée à mettre à jour.']);
        }

        $updated = $this->couponRepository->update($coupon, $payload);

        if (!$updated) {
            throw ValidationException::withMessages(['coupon' => 'Mise à jour du coupon échouée.']);
        }

        return $updated;
    }

    public function deleteCoupon(Coupon $coupon): void
    {
        $this->couponRepository->delete($coupon);
    }
}
