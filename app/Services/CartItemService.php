<?php

namespace App\Services;

use App\Models\CartItem;
use App\Repositories\CartItemRepository;
use App\Repositories\CartRepository;
use App\Repositories\ProductRepository;
use Illuminate\Validation\ValidationException;

class CartItemService
{
    public function __construct(
        private CartItemRepository $cartItemRepository,
        
        private CartRepository $cartRepository,
        private ProductRepository $productRepository
    ) {}

    public function getALLCartItems(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->cartItemRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getCartItemById(int|string $id, array $fields = [], array $relations = [])
    {
        return $this->cartItemRepository->getById($id, $fields, $relations);
    }

    public function getCartItemByKeys(string|array $keys, mixed $values, array $fields = [], array $relations = [])
    {
        return $this->cartItemRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createCartItem(array $data)
    {
        $payload = [];

        if (!array_key_exists('cart_id', $data)) {
            throw ValidationException::withMessages([
                'cart_id' => 'Le champ cart_id est requis.',
            ]);
        }

        $cartId = (int) $data['cart_id'];
        $cart = $this->cartRepository->getById($cartId, ['id']);

        if (!$cart) {
            throw ValidationException::withMessages([
                'cart_id' => 'Panier non trouvé.',
            ]);
        }

        $payload['cart_id'] = $cartId;

        // product_id
        if (!array_key_exists('product_id', $data)) {
            throw ValidationException::withMessages([
                'product_id' => 'Le champ product_id est requis.',
            ]);
        }

        $productId = (int) $data['product_id'];
        $product = $this->productRepository->getById($productId, ['id']);

        if (!$product) {
            throw ValidationException::withMessages([
                'product_id' => 'Produit non trouvé.',
            ]);
        }

        $payload['product_id'] = $productId;

        // champs du model: quantity, unit_price
        $payload['quantity'] = isset($data['quantity']) ? (int) $data['quantity'] : 1;
        $payload['unit_price'] = isset($data['unit_price']) ? (float) $data['unit_price'] : 0;

        if ($payload['quantity'] < 1) {
            throw ValidationException::withMessages([
                'quantity' => 'La quantité doit être >= 1.',
            ]);
        }

        if ($payload['unit_price'] < 0) {
            throw ValidationException::withMessages([
                'unit_price' => 'Le prix unitaire doit être >= 0.',
            ]);
        }

        $cartItem = $this->cartItemRepository->create($payload);

        if (!$cartItem) {
            throw new \Exception("Création d'un item panier échouée.");
        }

        return $cartItem;
    }

    /**
     * UPDATE (mise à jour d'un item panier)
     * - tu peux modifier cart_id/product_id si tu veux, sinon retire ces blocs.
     */
    public function updateCartItem(CartItem $cartItem, array $data)
    {
        $payload = [];

        // cart_id (optionnel)
        if (array_key_exists('cart_id', $data)) {
            $cartId = (int) $data['cart_id'];
            $cart = $this->cartRepository->getById($cartId, ['id']);

            if (!$cart) {
                throw ValidationException::withMessages([
                    'cart_id' => 'Panier non trouvé.',
                ]);
            }

            $payload['cart_id'] = $cartId;
        }

        // product_id (optionnel)
        if (array_key_exists('product_id', $data)) {
            $productId = (int) $data['product_id'];
            $product = $this->productRepository->getById($productId, ['id']);

            if (!$product) {
                throw ValidationException::withMessages([
                    'product_id' => 'Produit non trouvé.',
                ]);
            }

            $payload['product_id'] = $productId;
        }

        // quantity (optionnel)
        if (array_key_exists('quantity', $data)) {
            $qty = (int) $data['quantity'];
            if ($qty < 1) {
                throw ValidationException::withMessages([
                    'quantity' => 'La quantité doit être >= 1.',
                ]);
            }
            $payload['quantity'] = $qty;
        }

        // unit_price (optionnel)
        if (array_key_exists('unit_price', $data)) {
            $price = (float) $data['unit_price'];
            if ($price < 0) {
                throw ValidationException::withMessages([
                    'unit_price' => 'Le prix unitaire doit être >= 0.',
                ]);
            }
            $payload['unit_price'] = $price;
        }

        if (empty($payload)) {
            throw ValidationException::withMessages([
                'data' => "Aucune donnée à mettre à jour.",
            ]);
        }

        // Selon ton repo: update($id, $payload) ou update($model, $payload)
        $updated = $this->cartItemRepository->update($cartItem, $payload);

        if (!$updated) {
            throw new \Exception("Mise à jour de l'item panier échouée.");
        }

        return $updated;
    }

    /**
     * DESTROY (suppression)
     */
    public function deleteCartItem(CartItem $cartItem): bool
    {
        $deleted = $this->cartItemRepository->delete($cartItem);

        if (!$deleted) {
            throw new \Exception("Suppression de l'item panier échouée.");
        }

        return true;
    }
}