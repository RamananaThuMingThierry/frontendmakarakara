<?php

namespace App\Services;

use App\Models\City;
use App\Repositories\CityRepository;
use Illuminate\Validation\ValidationException;

class CityService{

    public function __construct(private CityRepository $cityRepository){}

    public function getAllCities(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null){
        return $this->cityRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getCityById(int|string $id, array $fields = ['*'], array $relations = []){
        return $this->cityRepository->getById($id, $fields, $relations);
    }

    public function getCityByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = []){
        return $this->cityRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createCity(array $data){
        $name = trim((string) ($data['name']));
        $region = trim((string) ($data['region']));
    
        $payload = [
            'name' => $name,
            'region' => $region,
            'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : true
        ];

        $city = $this->cityRepository->create($payload);

        if(!$city){
            throw new \Exception("Création de la ville échouée.");
        }

        return $city;
    }

    public function updateCity(int|string $id, array $data){
        $city = $this->getCityById($id, ['*']);

        if(!$city){
            throw new \Exception("Ville non trouvée.");
        }

        $payload = [];

        if(array_key_exists('name', $data)){
            $name = trim((string) ($data['name']));

            if(empty($name)){
                throw new \Exception("Le nom de la ville ne peut pas être vide.");
            }

            $payload['name'] = $name;
        }
        
        if(array_key_exists('region', $data)){
            $region = trim((string) ($data['region']));

            $payload['region'] = $region;
        }


        if(array_key_exists('is_active', $data)){
            $payload['is_active'] = (bool) $data['is_active'];
        }

        if(empty($payload)){
            throw new \Exception("Aucune donnée à mettre à jour.");
        }


        $city = $this->cityRepository->update($city, $payload);

        if(!$city){
            throw new \Exception("Mise à jour de la ville échouée.");
        }

        return $city;
    }

    public function deleteCity(City $city): void
    {
        $city = $this->getCityById($city->id, ['id']);

        if (!$city) {
            throw new ValidationException("Ville non trouvée.");
        }

        $this->cityRepository->delete($city);
    }
}