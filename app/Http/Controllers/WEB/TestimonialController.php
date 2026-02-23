<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\TestimonialRequest;
use App\Services\ActivityLogService;
use App\Services\TestimonialService;
use Throwable;

class TestimonialController extends Controller
{
    public function __construct(private TestimonialService $testimonialService,private ActivityLogService $activityLogService) {}

    public function index(){
        try{
            $constraints = [];

            $testimonials = $this->testimonialService->getAllTestimonials(
                array_keys($constraints),
                array_values($constraints),
                ['id', 'name', 'photo_url', 'city', 'product_used', 'rating', 'message', 'position', 'is_active']
            );

            return response()->json([
                'data' => $testimonials
            ]);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_testimonial_failed',
                'entity_type' => 'Testimonial',
                'entity_id' => null,
                'level' => 'danger',
                'status_code' => 500,
                'message' => 'Erreur lors de la récupération des témoignages.',
                'method' => 'GET',
                'route' => 'admin.testimonials.index',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la récupération des témoignages.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(TestimonialRequest $request){
        try{
            $data = $request->validated();

            $testimonial = $this->testimonialService->createTestimonial($data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_testimonial_success',
                'entity_type' => 'Testimonial',
                'entity_id' => $testimonial->id,
                'level' => 'success',
                'status_code' => 201,
                'message' => 'Témoignage créé avec succès.',
                'method' => 'POST',
                'route' => 'admin.testimonials.store',
                'metadata' => [
                    'testimonial_id' => $testimonial->id,
                    'name' => $testimonial->name,
                    'city' => $testimonial->city,
                    'product_used' => $testimonial->product_used,
                    'rating' => $testimonial->rating,
                    'is_active' => $testimonial->is_active,
                ],
            ]);

            return response()->json([
                'message' => 'Témoignage créé avec succès.',
                'data' => $testimonial,
            ], 201);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_testimonial_failed',
                'entity_type' => 'Testimonial',
                'entity_id' => null,
                'level' => 'danger',
                'status_code' => 500,
                'message' => 'Erreur lors de la création du témoignage.',
                'method' => 'POST',
                'route' => 'admin.testimonials.store',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création du témoignage.',
                'error' => $e->getMessage(),
            ], 500);
        }

    }

    public function show(string $encryptedId){

        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_testimonial_failed',
                'entity_type' => 'Testimonial',
                'entity_id' => null,
                'level' => 'danger',
                'status_code' => 400,
                'message' => 'ID de témoignage invalide.',
                'method' => 'GET',
                'route' => 'admin.testimonials.show',
                'metadata' => [
                    'error' => 'ID de témoignage invalide.',
                ],
            ]);

            return response()->json([
                'message' => 'ID de témoignage invalide.',
            ], 400);
        }

        try{
            $testimonial = $this->testimonialService->getTestimonialById($id, ['*']);

            if(!$testimonial){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'show_testimonial_failed',
                    'entity_type' => 'Testimonial',
                    'entity_id' => $id,
                    'level' => 'danger',
                    'status_code' => 404,
                    'message' => 'Témoignage non trouvé.',
                    'method' => 'GET',
                    'route' => 'admin.testimonials.show',
                    'metadata' => [
                        'error' => 'Témoignage non trouvé.',
                    ],
                ]);

                return response()->json([
                    'message' => 'Témoignage non trouvé.',
                ], 404);
            }

            return response()->json($testimonial);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_testimonial_failed',
                'entity_type' => 'Testimonial',
                'entity_id' => $id,
                'level' => 'danger',
                'status_code' => 500,
                'message' => 'Erreur lors de la récupération du témoignage.',
                'method' => 'GET',
                'route' => 'admin.testimonials.show',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la récupération du témoignage.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(TestimonialRequest $request, string $encryptedId){

        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_testimonial_failed',
                'entity_type' => 'Testimonial',
                'entity_id' => null,
                'level' => 'danger',
                'status_code' => 400,
                'message' => 'ID de témoignage invalide.',
                'method' => 'PUT',
                'route' => 'admin.testimonials.update',
                'metadata' => [
                    'error' => 'ID de témoignage invalide.',
                ],
            ]);

            return response()->json([
                'message' => 'ID de témoignage invalide.',
            ], 400);
        }

        $testimonial = $this->testimonialService->getTestimonialById($id, ['*']);

        if(!$testimonial){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_testimonial_failed',
                'entity_type' => 'Testimonial',
                'entity_id' => $id,
                'level' => 'danger',
                'status_code' => 404,
                'message' => 'Témoignage non trouvé.',
                'method' => 'PUT',
                'route' => 'admin.testimonials.update',
                'metadata' => [
                    'error' => 'Témoignage non trouvé.',
                ],
            ]);

            return response()->json([
                'message' => 'Témoignage non trouvé.',
            ], 404);
        }

        try{
            $data = $request->validated();

            $testimonial = $this->testimonialService->updateTestimonial($testimonial, $data);

            return response()->json([
                'message' => 'Témoignage mis à jour avec succès.',
                'data' => $testimonial,
            ]);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_testimonial_failed',
                'entity_type' => 'Testimonial',
                'entity_id' => $id,
                'level' => 'danger',
                'status_code' => 500,
                'message' => 'Erreur lors de la mise à jour du témoignage.',
                'method' => 'PUT',
                'route' => 'admin.testimonials.update',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jour du témoignage.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

     public function destroy(string $encryptedId){

         $id = decrypt_to_int_or_null($encryptedId);

         if(is_null($id)){
             $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_testimonial_failed',
                'entity_type' => 'Testimonial',
                'entity_id' => null,
                'level' => 'danger',
                'status_code' => 400,
                'message' => 'ID de témoignage invalide.',
                'method' => 'DELETE',
                'route' => 'admin.testimonials.destroy',
                'metadata' => [
                    'error' => 'ID de témoignage invalide.',
                ],
             ]);

             return response()->json([
                 'message' => 'ID de témoignage invalide.',
             ], 400);
         }

        $testimonial = $this->testimonialService->getTestimonialById($id, ['*']);

        if(!$testimonial){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_testimonial_failed',
                'entity_type' => 'Testimonial',
                'entity_id' => $id,
                'level' => 'danger',
                'status_code' => 404,
                'message' => 'Témoignage non trouvé.',
                'method' => 'DELETE',
                'route' => 'admin.testimonials.destroy',
                'metadata' => [
                    'error' => 'Témoignage non trouvé.',
                ],
            ]);

            return response()->json([
                'message' => 'Témoignage non trouvé.',
            ], 404);
        }

         try{
             $this->testimonialService->deleteTestimonial($testimonial);

             return response()->json([
                 'message' => 'Témoignage supprimé avec succès.',
             ]);

         }catch(Throwable $e){

             $this->activityLogService->createActivityLog([
                 'user_id' => auth()->id(),
                 'action' => 'delete_testimonial_failed',
                 'entity_type' => 'Testimonial',
                 'entity_id' => $id,
                 'level' => 'danger',
                'status_code' => 500,
                'message' => 'Erreur lors de la suppression du témoignage.',
                'method' => 'DELETE',
                'route' => 'admin.testimonials.destroy',
                'metadata' => [
                     'error' => $e->getMessage(),
                 ],
             ]);

             return response()->json([
                 'message' => 'Erreur lors de la suppression du témoignage.',
                 'error' => $e->getMessage(),
             ], 500);
         }
     }
}
