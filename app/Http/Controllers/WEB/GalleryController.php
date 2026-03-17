<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\GalleryRequest;
use App\Services\ActivityLogService;
use App\Services\GalleryService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Throwable;

class GalleryController extends Controller
{
    public function __construct(private GalleryService $galleryService, private ActivityLogService $activityLogService) {}

    public function publicIndex(Request $request)
    {
        try {
            $user = $request->user('sanctum');
            $galleries = $this->galleryService->getAllGalleries([], [], ['id', 'name', 'image_url', 'likes', 'created_at'])
                ->sortBy([
                    ['created_at', 'desc'],
                ])->values();

            $likedIds = $user
                ? $user->likedGalleries()->pluck('galleries.id')->all()
                : [];

            $galleries = $galleries->map(function ($gallery) use ($likedIds) {
                $gallery->liked_by_user = in_array($gallery->id, $likedIds, true);

                return $gallery;
            })->values();

            return response()->json([
                'data' => $galleries,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors du chargement de la galerie.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function index()
    {
        try {
            $galleries = $this->galleryService->getAllGalleries([], [], ['id', 'name', 'image_url', 'likes', 'created_at'], 12);

            return response()->json([
                'data' => $galleries,
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.galleries.index',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement de la galerie.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement de la galerie.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(GalleryRequest $request)
    {
        try {
            $gallery = $this->galleryService->createGallery($request->validated());

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_gallery',
                'entity_type' => 'Gallery',
                'entity_id' => $gallery->id,
                'color' => 'success',
                'method' => 'POST',
                'route' => 'admin.galleries.store',
                'status_code' => 201,
                'message' => 'Element de galerie cree avec succes.',
                'metadata' => [
                    'name' => $gallery->name,
                    'likes' => $gallery->likes,
                ],
            ]);

            return response()->json([
                'message' => 'Element de galerie cree avec succes.',
                'data' => $gallery,
            ], 201);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'POST',
                'route' => 'admin.galleries.store',
                'status_code' => 500,
                'message' => 'Erreur lors de la creation de l element de galerie.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la creation de l element de galerie.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'show_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.galleries.show',
                'status_code' => 400,
                'message' => 'ID de galerie invalide.',
                'metadata' => [
                    'error' => "ID de galerie invalide: $encryptedId",
                ],
            ]);

            return response()->json([
                'message' => 'ID de galerie invalide.',
            ], 400);
        }

        try {
            $gallery = $this->galleryService->getGalleryById($id, ['*']);

            if (!$gallery) {
                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'show_gallery_failed',
                    'entity_type' => 'Gallery',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'GET',
                    'route' => 'admin.galleries.show',
                    'status_code' => 404,
                    'message' => 'Element de galerie non trouve.',
                    'metadata' => [
                        'error' => "Element de galerie non trouve: $id",
                    ],
                ]);

                return response()->json([
                    'message' => 'Element de galerie non trouve.',
                ], 404);
            }

            return response()->json([
                'data' => $gallery,
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'show_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.galleries.show',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement de l element de galerie.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement de l element de galerie.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(GalleryRequest $request, string $encryptedId)
    {
        $data = $request->validated();

        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.galleries.update',
                'status_code' => 400,
                'message' => 'ID de galerie invalide.',
                'metadata' => [
                    'error' => "ID de galerie invalide: $encryptedId",
                ],
            ]);

            return response()->json([
                'message' => 'ID de galerie invalide.',
            ], 400);
        }

        $gallery = $this->galleryService->getGalleryById($id, ['*']);

        if (!$gallery) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => $id,
                'color' => 'warning',
                'method' => 'PUT',
                'route' => 'admin.galleries.update',
                'status_code' => 404,
                'message' => 'Element de galerie non trouve.',
                'metadata' => [
                    'error' => "Element de galerie non trouve: $id",
                ],
            ]);

            return response()->json([
                'message' => 'Element de galerie non trouve.',
            ], 404);
        }

        try {
            $gallery = $this->galleryService->updateGallery($gallery, $data);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_gallery',
                'entity_type' => 'Gallery',
                'entity_id' => $gallery->id,
                'color' => 'primary',
                'method' => 'PUT',
                'route' => 'admin.galleries.update',
                'status_code' => 200,
                'message' => 'Element de galerie mis a jour avec succes.',
                'metadata' => [
                    'name' => $gallery->name,
                    'likes' => $gallery->likes,
                ],
            ]);

            return response()->json([
                'message' => 'Element de galerie mis a jour avec succes.',
                'data' => $gallery,
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.galleries.update',
                'status_code' => 500,
                'message' => 'Erreur lors de la mise a jour de l element de galerie.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise a jour de l element de galerie.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.galleries.destroy',
                'status_code' => 400,
                'message' => 'ID de galerie invalide.',
                'metadata' => [
                    'error' => "ID de galerie invalide: $encryptedId",
                ],
            ]);

            return response()->json([
                'message' => 'ID de galerie invalide.',
            ], 400);
        }

        $gallery = $this->galleryService->getGalleryById($id, ['*']);

        if (!$gallery) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => $id,
                'color' => 'warning',
                'method' => 'DELETE',
                'route' => 'admin.galleries.destroy',
                'status_code' => 404,
                'message' => 'Element de galerie non trouve.',
                'metadata' => [
                    'error' => "Element de galerie non trouve: $id",
                ],
            ]);

            return response()->json([
                'message' => 'Element de galerie non trouve.',
            ], 404);
        }

        try {
            $this->galleryService->deleteGallery($gallery);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_gallery',
                'entity_type' => 'Gallery',
                'entity_id' => $id,
                'color' => 'success',
                'method' => 'DELETE',
                'route' => 'admin.galleries.destroy',
                'status_code' => 200,
                'message' => 'Element de galerie supprime avec succes.',
                'metadata' => [
                    'name' => $gallery->name,
                    'likes' => $gallery->likes,
                ],
            ]);

            return response()->json([
                'message' => 'Element de galerie supprime avec succes.',
            ]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_gallery_failed',
                'entity_type' => 'Gallery',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.galleries.destroy',
                'status_code' => 500,
                'message' => 'Erreur lors de la suppression de l element de galerie.',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression de l element de galerie.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggleLike(Request $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            return response()->json([
                'message' => 'ID de galerie invalide.',
            ], 400);
        }

        $gallery = $this->galleryService->getGalleryById($id, ['*']);

        if (!$gallery) {
            return response()->json([
                'message' => 'Element de galerie non trouve.',
            ], 404);
        }

        try {
            $result = $this->galleryService->toggleLike($gallery, $request->user());

            return response()->json([
                'message' => $result['liked']
                    ? 'Like ajoute avec succes.'
                    : 'Like retire avec succes.',
                'data' => $result,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise a jour du like.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
