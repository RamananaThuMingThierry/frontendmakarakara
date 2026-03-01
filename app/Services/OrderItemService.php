<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Repositories\OrderItemRepository;
use App\Repositories\OrderRepository;
use App\Repositories\ProductRepository;
use Illuminate\Validation\ValidationException;

class OrderItemService
{
    public function __construct(
        private OrderItemRepository $orderItemRepository,
        private OrderRepository $orderRepository,
        private ProductRepository $productRepository,
    ) {}

    public function getAllOrderItems(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->orderItemRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getOrderItemById(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->orderItemRepository->getById($id, $fields, $relations);
    }

    public function getOrderItemByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->orderItemRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createOrderItem(array $data)
    {
        $requiredFields = ['order_id', 'product_id'];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $data)) {
                throw ValidationException::withMessages([$field => "Le $field est requis."]);
            }
        }

        // check related records
        $order = $this->orderRepository->getById((int) $data['order_id'], ['id']);
        if (! $order) {
            throw ValidationException::withMessages(['order_id' => 'Commande non trouvée.']);
        }

        $product = $this->productRepository->getById((int) $data['product_id'], ['id', 'name', 'sku', 'price']);
        if (! $product) {
            throw ValidationException::withMessages(['product_id' => 'Produit non trouvé.']);
        }

        $quantity = isset($data['quantity']) ? (int) $data['quantity'] : 0;
        $unitPrice = isset($data['unit_price']) ? (int) $data['unit_price'] : ($product->price ?? 0);

        $payload = [
            'order_id'     => $order->id,
            'product_id'   => $product->id,
            'product_name' => trim((string) ($data['product_name'] ?? $product->name)),
            'sku'          => $data['sku'] ?? $product->sku,
            'quantity'     => $quantity,
            'unit_price'   => $unitPrice,
            'line_total'   => $quantity * $unitPrice,
        ];

        return $this->orderItemRepository->create($payload);
    }

public function updateOrderItem(OrderItem $orderItem, array $data)
    {
        $payload = [];

        $fields = ['product_id','product_name','sku','quantity','unit_price'];
        
        foreach ($fields as $f) {
            if (array_key_exists($f, $data)) {
                $payload[$f] = $data[$f];
            }
        }

        if (array_key_exists('product_id', $payload)) {
            $product = $this->productRepository->getById((int) $payload['product_id'], ['id','name','sku','price']);
            if (! $product) {
                throw ValidationException::withMessages(['product_id' => 'Produit non trouvé.']);
            }
            if (! array_key_exists('product_name', $payload)) {
                $payload['product_name'] = $product->name;
            }
            if (! array_key_exists('sku', $payload)) {
                $payload['sku'] = $product->sku;
            }
            if (! array_key_exists('unit_price', $payload)) {
                $payload['unit_price'] = $product->price;
            }
        }

        if (array_key_exists('quantity', $payload)) {
            $payload['quantity'] = (int) $payload['quantity'];
        }
        if (array_key_exists('unit_price', $payload)) {
            $payload['unit_price'] = (int) $payload['unit_price'];
        }

        if (array_key_exists('quantity', $payload) || array_key_exists('unit_price', $payload)) {
            $quantity = $payload['quantity'] ?? $orderItem->quantity;
            $unitPrice = $payload['unit_price'] ?? $orderItem->unit_price;
            $payload['line_total'] = $quantity * $unitPrice;
        }

        if (empty($payload)) {
            throw ValidationException::withMessages(['order_item' => 'Aucune donnée à mettre à jour.']);
        }

        $updated = $this->orderItemRepository->update($orderItem, $payload);
        if (! $updated) {
            throw ValidationException::withMessages(['order_item' => 'Mise à jour échouée.']);
        }

        return $updated;
    }

    public function deleteOrderItem(OrderItem $orderItem): void
    {
        $this->orderItemRepository->delete($orderItem);
    }
}
