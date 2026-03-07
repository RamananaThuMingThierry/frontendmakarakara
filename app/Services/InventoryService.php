<?php

namespace App\Services;

use App\Models\Inventory;
use App\Repositories\InventoryRepository;
use Illuminate\Validation\ValidationException;

class InventoryService{

    public function __construct(private InventoryRepository $inventoryRepository){}

    public function getAllInventories(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null){
        return $this->inventoryRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getInventoryById(int|string $id, array $fields = ['*'], array $relations = []){
        return $this->inventoryRepository->getById($id, $fields, $relations);
    }

    public function getInventoryByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = []){
        return $this->inventoryRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createInventory(array $data){
    
        // 1) Validation minimale (sans Request FormRequest)
        $errors = [];

        if (empty($data['product_id'])) $errors['product_id'][] = "The 'product_id' field is required.";
        if (empty($data['city_id']))    $errors['city_id'][]    = "The 'city_id' field is required.";
        if (!array_key_exists('quantity', $data)) $errors['quantity'][] = "The 'quantity' field is required.";
        if (!array_key_exists('price', $data)) $errors['price'][] = "The 'price' field is required.";

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        // 2) Normalisation / payload (match fillable + casts)
        $payload = [
            'product_id'        => (int) $data['product_id'],
            'city_id'           => (int) $data['city_id'],
            'price'             => (float) $data['price'],
            'compare_price'     => array_key_exists('compare_price', $data) ? (float) $data['compare_price'] : 0,
            'quantity'          => (int) $data['quantity'],
            'reserved_quantity' => array_key_exists('reserved_quantity', $data) ? (int) $data['reserved_quantity'] : 0,
            'min_stock'         => array_key_exists('min_stock', $data) ? (int) $data['min_stock'] : 0,
            'is_available'      => array_key_exists('is_available', $data) ? (bool) $data['is_available'] : true,
        ];
        

        // 3) Empêcher le doublon (unique product_id+city_id)
        $constraintExists = [
            'product_id' => $payload['product_id'],
            'city_id'    => $payload['city_id']
        ];

        $exists = $this->getInventoryByKeys(
            array_keys($constraintExists),
            array_values($constraintExists),
            ['id']
        );

        if ($exists) {
            throw ValidationException::withMessages([
                'city_id' => ['Cette ville est déjà associée à ce produit.'],
            ]);
        }

        $qty = (int) $payload['quantity'];
        $min = (int) $payload['min_stock'];
        
        $payload['status'] = $qty <= 0
            ? 'out_of_stock'
            : ($min !== null && $qty <= $min ? 'low' : 'ok');

        // 5) Création
        $inventory = $this->inventoryRepository->create($payload);

        if (!$inventory) {
            throw ValidationException::withMessages([
                'inventory' => "Error while creating inventory.",
            ]);
        }

        return $inventory;
    }

public function updateInventory(int|string $id, array $data)
{
    $inventory = $this->getInventoryById($id);

    if (!$inventory) {
        throw ValidationException::withMessages([
            'inventory' => ['Inventaire non trouvé.'],
        ]);
    }

    // Construire le payload uniquement avec les champs autorisés/presents
    $payload = [];

    if (array_key_exists('product_id', $data)) {
        $payload['product_id'] = (int) $data['product_id'];
    }

    if (array_key_exists('city_id', $data)) {
        $payload['city_id'] = (int) $data['city_id'];
    }

    if (array_key_exists('price', $data)) {
        $payload['price'] = (float) $data['price'];
    }

    if (array_key_exists('compare_price', $data)) {
        $payload['compare_price'] = $data['compare_price'] !== null
            ? (float) $data['compare_price']
            : null;
    }

    if (array_key_exists('quantity', $data)) {
        $payload['quantity'] = (int) $data['quantity'];
    }

    if (array_key_exists('reserved_quantity', $data)) {
        $payload['reserved_quantity'] = (int) $data['reserved_quantity'];
    }

    if (array_key_exists('min_stock', $data)) {
        $payload['min_stock'] = (int) $data['min_stock'];
    }

    if (array_key_exists('is_available', $data)) {
        $payload['is_available'] = (bool) $data['is_available'];
    }

    if (array_key_exists('status', $data)) {
        $payload['status'] = $data['status'];
    }

    // Recalcul automatique du status si quantity ou min_stock changent
    $finalQuantity = $payload['quantity'] ?? (int) $inventory->quantity;
    $finalMinStock = $payload['min_stock'] ?? (int) $inventory->min_stock;

    if (array_key_exists('quantity', $payload) || array_key_exists('min_stock', $payload)) {
        $payload['status'] = $finalQuantity <= 0
            ? 'out_of_stock'
            : ($finalQuantity <= $finalMinStock ? 'low' : 'ok');
    }

    $updatedInventory = $this->inventoryRepository->update($inventory, $payload);

    if (!$updatedInventory) {
        throw ValidationException::withMessages([
            'inventory' => ['Erreur lors de la mise à jour de l\'inventaire.'],
        ]);
    }

    return $updatedInventory;
}

    public function deleteInventory(Inventory $inventory){
        $this->inventoryRepository->delete($inventory);
    }
}