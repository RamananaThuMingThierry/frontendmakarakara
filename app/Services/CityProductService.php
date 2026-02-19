<?php

namespace App\Services;

use App\Repositories\CityProductRepository;
use Illuminate\Validation\ValidationException;

class CityProductService{

    public function __construct(protected CityProductRepository $cityProductRepository){}

    public function getAll(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->cityProductRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getById(int|string $id, array $fields = [], array $relations = [])
    {
        return $this->cityProductRepository->getById($id, $fields, $relations);
    }

    public function getByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [])
    {
        return $this->cityProductRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function create(array $data)
    {
        $payload = [];
        
        if(array_key_exists('city_id', $data) && is_numeric($data['city_id'])) {
            $payload['city_id'] = $data['city_id'];
        }else{
            throw new ValidationException('city_id est requis et doit être un nombre.');
        }

        if(array_key_exists('product_id', $data) && is_numeric($data['product_id'])) {
            $payload['product_id'] = $data['product_id'];
        }else{
            throw new ValidationException('product_id est requis et doit être un nombre.');
        }

        $payload['is_available'] = array_key_exists('is_available', $data) ? (bool) $data['is_available'] : true;

        $cityProduct = $this->cityProductRepository->create($payload);

        if(!$cityProduct){
            throw ValidationException::withMessages([
                'city_product' => 'Création du CityProduct échouée.'
            ]);
        }

        return $cityProduct;
    }

    public function update(int|string $id, array $data)
    {
        $cityProduct = $this->getById($id, ['*']);

        if(!$cityProduct){
            throw new ValidationException('CityProduct non trouvé.');
        }

        $payload = [];

        if(array_key_exists('is_available', $data)){
            $payload['is_available'] = (bool) $data['is_available'];
        }

        return $this->cityProductRepository->update($cityProduct, $payload);
    }

    public function delete(int|string $id)
    {
        $cityProduct = $this->getById($id, ['*']);

        if(!$cityProduct){
            throw new ValidationException('CityProduct non trouvé.');
        }

        $this->cityProductRepository->delete($cityProduct);
    }
}