<?php

namespace App\Services;

use App\Models\Review;
use App\Repositories\ProductRepository;
use App\Repositories\ReviewRepository;
use Illuminate\Validation\ValidationException;

class ReviewService{

    public function __construct(private ReviewRepository $reviewRepository, private ProductRepository $productRepository){}

    public function getAllReviews(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [], ?int $paginate = null)
    {
        return $this->reviewRepository->getAll($keys, $values, $fields, $relations, $paginate);
    }

    public function getReviewById(int|string $id, array $fields = ['*'], array $relations = [])
    {
        return $this->reviewRepository->getById($id, $fields, $relations);
    }

    public function getReviewByKeys(string|array $keys, mixed $values, array $fields = ['*'], array $relations = [])
    {
        return $this->reviewRepository->getByKeys($keys, $values, $fields, $relations);
    }

    public function createReview(array $data)
    {
        if(array_key_exists('product_id', $data)){
            $productId = $data['product_id'];

            $product = $this->productRepository->getById($productId, ['id']);

            if(!$product){
                throw ValidationException::withMessages([
                    'product_id' => 'Produit non trouvée.'
                ]);
            }
        }else{
            throw ValidationException::withMessages([
                'product_id' => 'Le champ product_id est requis.'
            ]);
        }

        $rating = $data['rating'] ?? 0;

        if ($rating < 1 || $rating > 5) {
            throw new \InvalidArgumentException('rating must be between 1 and 5');
        }

        $payload = [
            'user_id' => (int) $data['user_id'],
            'product_id' => (int) $data['product_id'],
            'rating' => (int) $rating,
            'comment' => $data['comment'] ?? '',
            'is_approuved' => isset($data['is_approuved']) ? $data['is_approuved'] : false,
        ];

        return $this->reviewRepository->create($payload);
    }

    public function updateReview(Review $review, array $data)
    {
        
        if(array_key_exists('product_id', $data)){
            $productId = $data['product_id'];

            $product = $this->productRepository->getById($productId, ['id']);

            if(!$product){
                throw ValidationException::withMessages([
                    'product_id' => 'Produit non trouvée.'
                ]);
            }
        }

        if(array_key_exists('rating', $data)){
            $rating = $data['rating'];

            if ($rating < 1 || $rating > 5) {
                throw new \InvalidArgumentException('rating must be between 1 and 5');
            }
        }

        $payload = [];

        if(array_key_exists('user_id', $data)) $payload['user_id'] = (int) $data['user_id'];
        if(array_key_exists('product_id', $data)) $payload['product_id'] = (int) $data['product_id'];
        if(array_key_exists('rating', $data)) $payload['rating'] = (int) $data['rating'];
        if(array_key_exists('comment', $data)) $payload['comment'] = $data['comment'];
        if(array_key_exists('is_approuved', $data)) $payload['is_approuved'] = $data['is_approuved'];

        return $this->reviewRepository->update($review, $payload);
    }

    public function deleteReview(Review $review)
    {
        return $this->reviewRepository->delete($review);
    }
}