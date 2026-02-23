<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\SlideRequest;
use App\Services\ActivityLogService;
use App\Services\SlideService;
use Illuminate\Support\Facades\Auth;
use Throwable;

class SlideController extends Controller
{
    public function __construct(private SlideService $slideService, private ActivityLogService $activityLogService) {}

    public function index()
    {
        try{
            $slides = $this->slideService->getAllSlides([], [], ['id', 'title', 'subtitle', 'image_url', 'position', 'is_active'], 10);

            return response()->json([
                'data' => $slides
            ]);
        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_slide_failed',
                'entity_type' => 'Slide',
                'entity_id' => null,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des produits.',
                'error' => $e->getMessage()
            ], 500);
        }

    }

    public function store(SlideRequest $request)
    {
        try{

            $data = $request->validated();

            $slide = $this->slideService->createSlide($data);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_slide',
                'entity_type' => 'Slide',
                'entity_id' => $slide->id,
                'metadata' => [
                    'title' => $slide->title,
                    'position' => $slide->position,
                    'is_active' => $slide->is_active
                ],
            ]);

            return response()->json([
                'message' => 'Slide créé avec succès.',
                'data' => $slide
            ], 201);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_slide_failed',
                'entity_type' => 'Slide',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création du slide.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'view_slide_failed',
                'entity_type' => 'Slide',
                'metadata' => [
                    'error' => "ID de slide invalide: $encryptedId",
                ],
            ]);

            return response()->json([
                'message' => 'ID de slide invalide.'
            ], 400);
        }

        try{
            $slide = $this->slideService->getSlideById($id, ['id', 'title', 'subtitle', 'image_url', 'position', 'is_active']);

            if(!$slide){
                return response()->json([
                    'message' => 'Slide non trouvé.'
                ], 404);
            }

            return response()->json([
                'data' => $slide
            ]);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'view_slide_failed',
                'entity_type' => 'Slide',
                'entity_id' => $id,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement du slide.',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function update(SlideRequest $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_slide_failed',
                'entity_type' => 'Slide',
                'metadata' => [
                    'error' => "ID de slide invalide: $encryptedId",
                ],
            ]);

            return response()->json([
                'message' => 'ID de slide invalide.'
            ], 400);
        }

        try{
            $data = $request->validated();

            $slide = $this->slideService->updateSlide($id, $data);

            if(!$slide){
                return response()->json([
                    'message' => 'Slide non trouvé.'
                ], 404);
            }

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_slide',
                'entity_type' => 'Slide',
                'entity_id' => $slide->id,
                'metadata' => [
                    'title' => $slide->title,
                    'position' => $slide->position,
                    'is_active' => $slide->is_active
                ],
            ]);

            return response()->json([
                'message' => 'Slide mis à jour avec succès.',
                'data' => $slide
            ]);
        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_slide_failed',
                'entity_type' => 'Slide',
                'entity_id' => $id,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jour du slide.',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function destroy(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_slide_failed',
                'entity_type' => 'Slide',
                'metadata' => [
                    'error' => "ID de slide invalide: $encryptedId",
                ],
            ]);

            return response()->json([
                'message' => 'ID de slide invalide.'
            ], 400);
        }

        $slide = $this->slideService->getSlideById($id, ['*']);

        if(!$slide){

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_slide_failed',
                'entity_type' => 'Slide',
                'entity_id' => $id,
                'metadata' => [
                    'error' => "Slide non trouvée: $id",
                ],
            ]);

            return response()->json([
                'message' => 'Slide non trouvé.'
            ], 404);
        }

        try{
            $this->slideService->deleteSlide($slide);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_slide',
                'entity_type' => 'Slide',
                'entity_id' => $id,
            ]);

            return response()->json([
                'message' => 'Slide supprimé avec succès.'
            ]);

        }catch(Throwable $e){

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_slide_failed',
                'entity_type' => 'Slide',
                'entity_id' => $id,
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression du slide.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
