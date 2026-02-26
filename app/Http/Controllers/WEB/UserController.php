<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Services\ActivityLogService;
use App\Services\UserService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Throwable;

class UserController extends Controller
{
    public function __construct(private UserService $userService, private ActivityLogService $activityLogService){}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try{
            $constraints = [];
            $users = $this->userService->getAllUsers(
                array_keys($constraints),
                array_values($constraints),
                ['*'],
                ['roles.permissions']
            );
            return response()->json([
                'data' => $users
            ]);
        }catch(Throwable $e){
            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'index_user_failed',
                'entity_type' => 'User',
                'entity_id' => null,
                'color' => 'danger',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des utilisateurs.',
                'method' => 'GET',
                'route' => 'admin.users.index',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des utilisateurs.',
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
    public function store(UserRequest $request)
    {
        $data = $request->validated();

        try{
            $user = $this->userService->createUser($data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_user',
                'entity_type' => 'User',
                'color' => 'success',
                'status_code' => 201,
                'method' => 'POST',
                'message' => 'Utilisateur créée avec succès.',
                'route' => 'admin.users.store',
                'entity_id' => $user->id,
                'metadata' => [
                    "name" => $user->name,
                    "email" => $user->email,
                    "is_active" => $user->is_active,
                    "phone" => $user->phone
                ],
            ]);

            return response()->json([
                'message' => 'Utilisateur créée avec succès.',
                'data' => $user
            ], 201);
        }catch(Throwable $e){
            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'create_user_failed',
                'entity_type' => 'User',
                'entity_id' => null,
                'color' => 'danger',
                'status_code' => 500,
                'method' => 'POST',
                'message' => 'Erreur lors de la création de l\'utilisateur.',
                'route' => 'admin.users.store',
                'metadata' => [
                    'payload' => $data,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création de l\'utilisateur.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);
 
        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_user_failed',
                'entity_type' => 'User',
                'entity_id' => null,
                'color' => 'warning',
                'status_code' => 400,
                'method' => 'GET',
                'message' => 'ID de l\'utilisateur invalide.',
                'route' => 'admin.users.show',
                'metadata' => [
                    'encrypted_id' => $encryptedId,
                ],
            ]);

            return response()->json([
                'message' => 'ID de l\'utilisateur invalide.'
            ], 400);
        }

        try {
            
            $user = $this->userService->getUserById(
                id: $id,
                relations: ['roles'],
            );

            if(!$user){
                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'show_user_failed',
                    'entity_type' => 'User',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'status_code' => 404,
                    'method' => 'GET',
                    'message' => 'Utilisateur non trouvé.',
                    'route' => 'admin.users.show',
                    'metadata' => [
                        'id' => $id,
                    ],
                ]);

                return response()->json([
                    'message' => 'Utilisateur non trouvé.',
                ], 404);
            }

            return response()->json([
                'data' => $user
            ]);
        } catch (ModelNotFoundException $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'show_user_failed',
                'entity_type' => 'User',
                'entity_id' => $id,
                'color' => 'warning',
                'status_code' => 404,
                'method' => 'GET',
                'message' => 'Utilisateur non trouvé.',
                'route' => 'admin.users.show',
                'metadata' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => "Utilisateur non trouvé."
            ], 404);
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
    public function update(UserRequest $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_user_failed',
                'entity_type' => 'User',
                'entity_id' => null,
                'color' => 'warning',
                'status_code' => 400,
                'method' => 'PUT',
                'message' => 'ID de l\'utilisateur invalide.',
                'route' => 'admin.users.update',
                'metadata' => [
                    'encrypted_id' => $encryptedId,
                ],
            ]);

            return response()->json([
                'message' => 'ID de l\'utilisateur invalide.'
            ], 400);
        }

        $data = $request->validated();
     
        try{
            
            $user = $this->userService->getUserById($id);

            if(!$user){

                $this->activityLogService->createActivityLog([
                    'user_id' => auth()->id(),
                    'action' => 'update_user_failed',
                    'entity_type' => 'User',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'status_code' => 404,
                    'method' => 'PUT',
                    'message' => 'Utilisateur non trouvée.',
                    'route' => 'admin.users.update',
                    'metadata' => [
                        'encrypted_id' => $encryptedId,
                    ],
                ]);

                return response()->json(['message' => 'Utilisateur non trouvée.'], 404);
            }

            $user = $this->userService->updateUser($user, $data);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_user',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'color' => 'success',
                'status_code' => 200,
                'method' => 'PUT',
                'message' => 'Utilisateur mise à jour avec succès.',
                'route' => 'admin.users.update',
                'metadata' => [
                    "name" => $user->name,
                    "email" => $user->email,
                    "is_active" => $user->is_active,
                    "phone" => $user->phone
                ],
            ]);

            return response()->json([
                'message' => 'Utilisateur mise à jour avec succès.',
                'data' => $user
            ]);

        }catch(Throwable $e){
            // Log échec (entity_id peut être null)
            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'update_user_failed',
                'entity_type' => 'User',
                'entity_id' => $id,
                'color' => 'PUT',
                'status_code' => 500,
                'message' => 'Erreur lors de la mise à jours de la catégorie.',
                'route' => 'admin.users.update',
                'method' => 'PUT',
                'metadata' => [
                    'payload' => $data,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jours de la catégorie.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        $user = $this->userService->getUserById($id, ['id']);

        if(!$user){

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_user_failed',
                'entity_type' => 'User',
                'entity_id' => $id,
                'color' => 'warning',
                'status_code' => 404,
                'method' => 'DELETE',
                'message' => 'Utilisateur non trouvée.',
                'route' => 'admin.users.destroy',
                'metadata' => [
                    'encrypted_id' => $encryptedId,
                ],
            ]);

            return response()->json([
                'message' => 'Utilisateur non trouvée.'
            ], 404);
        }

        try {
            $this->userService->deleteUser($user);

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_user',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'color' => 'success',
                'status_code' => 200,
                'method' => 'DELETE',
                'message' => 'Utilisateur supprimée avec succès.',
                'route' => 'admin.users.destroy',
                'metadata' => [
                    "name" => $user->name,
                    "email" => $user->email,
                    "is_active" => $user->is_active,
                    "phone" => $user->phone
                ],
            ]);

            return response()->json(['message' => 'Utilisateur supprimée avec succès.']);

        } catch (\Exception $e) {

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'delete_user_failed',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'metadata' => [
                   'payload' => $user,
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function restore(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {

            $this->activityLogService->createActivityLog([
                'user_id' => auth()->id(),
                'action' => 'restore_user_failed',
                'entity_type' => 'User',
                'entity_id' => null,
                'color' => 'warning',
                'status_code' => 400,
                'method' => 'POST',
                'route' => 'admin.users.restore',
                'message' => 'ID de l\'utilisateur invalide.',
                'metadata' => [
                    'encrypted_id' => $encryptedId,
                ],
            ]);

            return response()->json(['message' => "ID de l'utilisateur invalide."], 400);
        }

        try {
            // restore dans service / repo (withTrashed)
            $user = $this->userService->restoreUser($id);

            return response()->json([
                'message' => "Utilisateur restauré.",
                'data' => $user,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => "Utilisateur non trouvé."], 404);
        }
    }

    public function forceDelete(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            return response()->json(['message' => "ID de l'utilisateur invalide."], 400);
        }

        try {
            $this->userService->forceDeleteUser($id);

            return response()->json([
                'message' => "Utilisateur supprimé définitivement.",
            ]);

        } catch (ValidationException $e) {
            
        return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);

        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => "Utilisateur non trouvé."], 404);
        }
    }
}
