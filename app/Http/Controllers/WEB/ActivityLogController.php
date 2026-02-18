<?php

namespace App\Http\Controllers\WEB;

use Exception;
use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;

class ActivityLogController extends Controller
{

    public function __construct(private ActivityLogService $activityLogService){}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $constraints = [];

        $logs = $this->activityLogService->getAllActivityLogs(
            array_keys($constraints),
            array_values($constraints),
            fields: ['*'], relations:['user'], paginate: 10, orderBy: ['created_at' => 'desc']);

        return response()->json([
            'success' => true,
            'data' => $logs
        ], 200);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            return response()->json(['message' => 'ID de log d\'activité invalide.'], 400);
        }

        $log = $this->activityLogService->getByIdActivityLog($id, ['*'], ['user']);

        if(!$log){
            return response()->json(['message' => 'Log d\'activité non trouvé.'], 404);
        }

        return response()->json([
            'data' => $log
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if(is_null($id)){
            return response()->json(['message' => 'ID de log d\'activité invalide.'], 400);
        }

        try {
            $this->activityLogService->deleteActivityLog($id);
            return response()->json(['message' => 'Log d\'activité supprimé avec succès.'], 200);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }
    }
}
