<?php

namespace App\Services;

use App\Repositories\StockMovementRepository;
use Illuminate\Validation\ValidationException;

class StockMovementService
{
    public function __construct(
        private StockMovementRepository $stockMovementRepository
    ) {}

    public function getAllStockMovements(
        string|array $keys,
        mixed $values,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null
    ) {
        return $this->stockMovementRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getStockMovementById(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->stockMovementRepository->getById($id, $fields, $relations);
    }

    public function getStockMovementByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->stockMovementRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createStockMovement(array $data)
    {
        // Validations minimales (sans FormRequest)
        $errors = [];

        if (!array_key_exists('product_id', $data)) {
            $errors['product_id'][] = "Le champ 'product_id' est requis.";
        }

        if (!array_key_exists('type', $data)) {
            $errors['type'][] = "Le champ 'type' est requis.";
        }

        if (!array_key_exists('quantity', $data)) {
            $errors['quantity'][] = "Le champ 'quantity' est requis.";
        }

        // Comme ta table a city_from_id / city_to_id, on n'impose pas forcément les deux
        // (ex: "in" peut avoir juste city_to_id, "out" juste city_from_id, etc.)
        if (array_key_exists('city_id', $data)) {
            $errors['city_id'][] = "Le champ 'city_id' n'existe pas. Utilise 'city_from_id' et/ou 'city_to_id'.";
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        // Construire le payload proprement (aligné migration)
        $payload = [
            'product_id'      => $data['product_id'],
            'city_from_id'    => $data['city_from_id'] ?? null,
            'city_to_id'      => $data['city_to_id'] ?? null,
            'type'            => $data['type'],
            'quantity'        => $data['quantity'],
            'stock_before'    => $data['stock_before'],
            'stock_after'     => $data['stock_after'],
            'reason'          => $data['reason'] ?? null,
            'note'            => $data['note'] ?? null,
            'reference_type'  => $data['reference_type'] ?? null,
            'reference_id'    => $data['reference_id'] ?? null,
            'created_by'      => $data['created_by'] ?? null,
        ];

        return $this->stockMovementRepository->create($payload);
    }
}