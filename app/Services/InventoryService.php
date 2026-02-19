<?php

namespace App\Services;

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

        $payload = [];

        if(array_key_exists('product_id', $data)){
            $payload['product_id'] = $data['product_id'];
        }else{
            throw new ValidationException("Le champ 'product_id' est requis.");
        }

        if(array_key_exists('city_id', $data)){
            $payload['city_id'] = $data['city_id'];
        }else{
            throw new ValidationException("Le champ 'city_id' est requis.");
        }

        if(array_key_exists('quantity', $data)){
            $payload['quantity'] = $data['quantity'];
        }else{
            throw new ValidationException("Le champ 'quantity' est requis.");
        }

        if(array_key_exists('low_stock_threshold', $data)){
            $payload['low_stock_threshold'] = $data['low_stock_threshold'] ?? 0;
        }else{
            $payload['low_stock_threshold'] = 0;
        
        }

        $inventory = $this->inventoryRepository->create($payload);

        if(!$inventory){
            throw ValidationException::withMessages([
                'inventory' => 'Erreur lors de la création de l\'inventaire.',
            ]);
        }

        return $inventory;
    }

    public function updateInventory(int|string $id, array $data){

        $inventory = $this->getInventoryById($id);

        if(!$inventory){
            throw ValidationException::withMessages([
                'inventory' => 'Inventaire non trouvé.',
            ]);
        }

        return $this->inventoryRepository->update($inventory, $data);
    }

    public function deleteInventory(int|string $id){

        $inventory = $this->getInventoryById($id);

        if(!$inventory){
            throw ValidationException::withMessages([
                'inventory' => 'Inventaire non trouvé.',
            ]);
        }

        $this->inventoryRepository->delete($inventory);
    }
}