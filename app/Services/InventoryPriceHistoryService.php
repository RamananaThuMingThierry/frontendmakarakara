<?php

namespace App\Services;

use App\Repositories\InventoryPriceHistoryRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class InventoryPriceHistoryService{

    public function __construct(private InventoryPriceHistoryRepository $inventoryPriceHistoryRepository){}

    public function getAllInventoryPriceHistories(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null){
        return $this->inventoryPriceHistoryRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getInventoryPriceHistoryById(int|string $id, array $fields = ['*'], array $relations = []){
        return $this->inventoryPriceHistoryRepository->getById($id, $fields, $relations);
    }

    public function getInventoryPriceHistoryByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = []){
        return $this->inventoryPriceHistoryRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createInventoryPriceHistory(array $data){

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

        if(array_key_exists('old_price', $data)){
            $payload['old_price'] = $data['old_price'];
        }

        if(array_key_exists('new_price', $data)){
            $payload['new_price'] = $data['new_price'];
        }

        $payload['changed_by'] = Auth::id() ?? null;
    

        $inventoryPriceHistory = $this->inventoryPriceHistoryRepository->create($payload);

        if(!$inventoryPriceHistory){
            throw ValidationException::withMessages([
                'inventory_price_history' => 'Erreur lors de la création de l\'historique des prix.',
            ]);
        }

        return $inventoryPriceHistory;
    }

    public function updateInventoryPriceHistory(int|string $id, array $data){

        $inventoryPriceHistory = $this->getInventoryPriceHistoryById($id);

        if(!$inventoryPriceHistory){
            throw ValidationException::withMessages([
                'inventory_price_history' => 'Historique des prix non trouvé.',
            ]);
        }

        return $this->inventoryPriceHistoryRepository->update($inventoryPriceHistory, $data);
    }

    public function deleteInventoryPriceHistory(int|string $id){

        $inventoryPriceHistory = $this->getInventoryPriceHistoryById($id);
        if(!$inventoryPriceHistory){
            throw ValidationException::withMessages([
                'inventory_price_history' => 'Historique des prix non trouvé.',
            ]);
        }

        $this->inventoryPriceHistoryRepository->delete($inventoryPriceHistory);
    }
}