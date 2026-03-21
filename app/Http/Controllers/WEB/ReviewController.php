<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewRequest;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use App\Services\ReviewService;
use Illuminate\Support\Facades\Auth;
use Throwable;

class ReviewController extends Controller
{
    public function __construct(
        private ReviewService $reviewService,
        private ActivityLogService $activityLogService,
        private NotificationService $NotificationService
    ){}
    
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $reviews = $this->reviewService->getAllReviews(
                keys:[],
                values: [],
                fields:['id', 'product_id', 'user_id', 'rating', 'comment', 'is_approved', 'created_at'],
                relations:['user','product']
            );

            return response()->json([
                'data' => $reviews
            ]);
        } catch (Throwable $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_review_failed',
                'entity_type' => 'Review',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des avis.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des avis.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ReviewRequest $request)
    {
        try{
            $data = $request->validated();
            
            $data['user_id'] = Auth::id();
            
            $review = $this->reviewService->createReview($data);
            $this->NotificationService->notifyNewReview($review);
            
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_review',
                'entity_type' => 'Review',
                'entity_id' => $review->id,
                'color' => 'success',
                'route' => 'admin.reviews.store',
                'status_code' => 201,
                'method' => 'POST',
                'message' => 'Avis créé avec succès.',
                'metadata' => [
                    'review_id' => $review->id,
                    'product_id' => $review->product_id,
                    'rating' => $review->rating,
                ],
            ]);
            
            return response()->json([
                'message' => 'Avis créé avec succès.',
                'data' => $review,
            ], 201);
            
        } catch (Throwable $e) {
            
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_review_failed',
                'entity_type' => 'Review',
                'entity_id' => null,
                'color' => 'danger',
                'route' => 'admin.reviews.store',
                'status_code' => 500,
                'method' => 'POST',
                'message' => 'Erreur lors de la création de l\'avis.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);
            
            return response()->json([
                'message' => 'Erreur lors de la création de l\'avis.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $encrypted)
    {
        $id = decrypt_to_int_or_null($encrypted);

        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'view_review_failed',
                'entity_type' => 'Review',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.reviews.show',
                'status_code' => 400,
                'message' => 'ID d\'avis invalide.',
                'metadata' => [
                    'error' => "ID invalide: $encrypted",
                ],
            ]);

            return response()->json([
                'message' => 'ID d\'avis invalide.'
            ], 400);
        }

        try {
            $review = $this->reviewService->getReviewById($id, ['*'], ['user', 'product']);

            if (!$review) {
                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'view_review_failed',
                    'entity_type' => 'Review',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'GET',
                    'route' => 'admin.reviews.show',
                    'status_code' => 404,
                    'message' => 'Avis non trouvé.',
                    'metadata' => [
                        'error' => "Review not found: $id",
                    ],
                ]);

                return response()->json([
                    'message' => 'Avis non trouvé.'
                ], 404);
            }

            return response()->json([
                'data' => $review
            ]);

        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'view_review_failed',
                'entity_type' => 'Review',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.reviews.show',
                'status_code' => 500,
                'message' => 'Erreur lors de la récupération de l\'avis.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la récupération de l\'avis.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ReviewRequest $request, string $encrypted)
    {
        $id = decrypt_to_int_or_null($encrypted);

        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_review_failed',
                'entity_type' => 'Review',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.reviews.update',
                'status_code' => 400,
                'message' => 'ID d\'avis invalide.',
                'metadata' => [
                    'error' => "ID invalide: $encrypted",
                ],
            ]);

            return response()->json([
                'message' => 'ID d\'avis invalide.'
            ], 400);
        }

        try {
            $review = $this->reviewService->getReviewById($id, ['*']);

            if (!$review) {
                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'update_review_failed',
                    'entity_type' => 'Review',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'PUT',
                    'route' => 'admin.reviews.update',
                    'status_code' => 404,
                    'message' => 'Avis non trouvé.',
                    'metadata' => [
                        'error' => "Review not found: $id",
                    ],
                ]);

                return response()->json([
                    'message' => 'Avis non trouvé.'
                ], 404);
            }

            $data = $request->validated();

            $updated = $this->reviewService->updateReview($review, $data);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_review',
                'entity_type' => 'Review',
                'entity_id' => $updated->id,
                'color' => 'success',
                'method' => 'PUT',
                'route' => 'admin.reviews.update',
                'status_code' => 200,
                'message' => 'Avis mis à jour avec succès.',
                'metadata' => [
                    'review_id' => $updated->id,
                    'rating' => $updated->rating,
                ],
            ]);

            return response()->json([
                'message' => 'Avis mis à jour avec succès.',
                'data' => $updated,
            ]);

        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_review_failed',
                'entity_type' => 'Review',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.reviews.update',
                'status_code' => 500,
                'message' => 'Erreur lors de la mise à jour de l\'avis.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jour de l\'avis.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $encrypted)
    {
        $id = decrypt_to_int_or_null($encrypted);

        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_review_failed',
                'entity_type' => 'Review',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.reviews.destroy',
                'status_code' => 400,
                'message' => 'ID d\'avis invalide.',
                'metadata' => [
                    'error' => "ID invalide: $encrypted",
                ],
            ]);

            return response()->json([
                'message' => 'ID d\'avis invalide.'
            ], 400);
        }

        try {
            $review = $this->reviewService->getReviewById($id, ['id', 'product_id', 'user_id']);

            if (!$review) {
                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'delete_review_failed',
                    'entity_type' => 'Review',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'DELETE',
                    'route' => 'admin.reviews.destroy',
                    'status_code' => 404,
                    'message' => 'Avis non trouvé.',
                    'metadata' => [
                        'error' => "Review not found: $id",
                    ],
                ]);

                return response()->json([
                    'message' => 'Avis non trouvé.'
                ], 404);
            }

            $this->reviewService->deleteReview($review);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_review',
                'entity_type' => 'Review',
                'entity_id' => $id,
                'color' => 'success',
                'method' => 'DELETE',
                'route' => 'admin.reviews.destroy',
                'status_code' => 200,
                'message' => 'Avis supprimé avec succès.',
                'metadata' => [
                    'review_id' => $id,
                ],
            ]);

            return response()->json([
                'message' => 'Avis supprimé avec succès.'
            ]);

        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_review_failed',
                'entity_type' => 'Review',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.reviews.destroy',
                'status_code' => 500,
                'message' => 'Erreur lors de la suppression de l\'avis.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'avis.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
