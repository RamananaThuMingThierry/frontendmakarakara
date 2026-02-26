<?php

namespace App\Services;

use App\Models\Cart;
use App\Repositories\CartRepository;
use App\Repositories\UserRepository;
use Illuminate\Validation\ValidationException;

class CartService{

    public function __construct(private CartRepository $cartRepository, private UserRepository $userRepository){}

    public function getAllCarts(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null){
        return $this->cartRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getCartById(int|string $id, array $fields = ['*'], array $relations = []){
        return $this->cartRepository->getById($id, $fields, $relations);
    }

    public function getCartByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = []){
        return $this->cartRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createCart(array $data){

        $payload = [];
        if(array_key_exists('user_id', $data)){
            $userId = $data['user_id'];

            // Vérifions que cet user_id existe bien dans la base de données
            $user = $this->userRepository->getById($userId, ['id']);

            if(!$user){
                throw new \Exception("Utilateur non trouvée.");          
            }

            $payload['user_id'] = $userId;

        }else{
            throw ValidationException::withMessages([
                'user_id' => "Le champ user_id est requise."
            ]);
        }

        $payload['status'] = isset($data['status']) ? $data['status'] : 'active';
        
        $cart = $this->cartRepository->create($payload);

        if(!$cart){
            throw new \Exception("Création d'une panier échouée.");
        }

        return $cart;
    }

    public function updateCart(Cart $cart, array $data){
 
        $payload = [];

        if(array_key_exists('user_id', $data)){
            $userId = $data['user_id'];

            // Vérifions que cet user_id existe bien dans la base de données
            $user = $this->userRepository->getById($userId, ['id']);

            if(!$user){
                throw new \Exception("Utilateur non trouvée.");          
            }

            $payload['user_id'] = $userId;

        }

        $payload['status'] = isset($data['status']) ? $data['status'] : $cart->status;

        $cart = $this->cartRepository->update($cart, $payload);

        if(!$cart){
            throw new \Exception("Mise à jour de la panier échouée.");
        }

        return $cart;
    }

    public function deleteCart(Cart $cart): void
    {
        $cart = $this->getCartById($cart->id, ['id']);

        if (!$cart) {
            throw new ValidationException("Panier non trouvée.");
        }

        $this->cartRepository->delete($cart);
    }
}
