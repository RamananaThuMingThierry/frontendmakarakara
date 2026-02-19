<?php

namespace App\Services;

use App\Repositories\StockMouvementRepository;
use Illuminate\Validation\ValidationException;

class StockMouvementService{

    public function __construct(private StockMouvementRepository $stockMouvementRepository){}

    public function getAllStockMouvements(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null){
        return $this->stockMouvementRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getStockMouvementById(int|string $id, array $fields = ['*'], array $relations = []){
        return $this->stockMouvementRepository->getById($id, $fields, $relations);
    }

    public function getStockMouvementByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = []){
        return $this->stockMouvementRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createStockMouvement(array $data){

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

        if(array_key_exists('type', $data)){
            $payload['type'] = $data['type'];
        }else{
            throw new ValidationException("Le champ 'type' est requis.");
        }

        if(array_key_exists('quantity', $data)){
            $payload['quantity'] = $data['quantity'];
        }else{
            throw new ValidationException("Le champ 'quantity' est requis.");
        }

        if(array_key_exists('reason', $data)){
            $payload['reason'] = $data['reason'] ?? null;
        }else{
            $payload['reason'] = null;
        
        }

        if(array_key_exists('reference_type', $data)){
            $payload['reference_type'] = $data['reference_type'] ?? null;
        }else{
            $payload['reference_type'] = null;
        
        }

        if(array_key_exists('reference_id', $data)){
            $payload['reference_id'] = $data['reference_id'] ?? null;
        }else{
            $payload['reference_id'] = null;
        
        }

        if(array_key_exists('created_by', $data)){
            $payload['created_by'] = $data['created_by'] ?? null;
        }else{
            $payload['created_by'] = null;
        
        }

        return $this->stockMouvementRepository->create($payload);
    }
}