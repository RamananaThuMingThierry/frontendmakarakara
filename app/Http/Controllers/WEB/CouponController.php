<?php

namespace App\Http\Controllers\WEB;

use App\Http\Controllers\Controller;
use App\Http\Requests\CouponRequest;
use App\Services\ActivityLogService;
use App\Services\CouponService;
use Illuminate\Support\Facades\Auth;
use Throwable;

class CouponController extends Controller
{
    public function __construct(private CouponService $couponService, private ActivityLogService $activityLogService) {}

    public function index()
    {
        try {
            
        $coupons = $this->couponService->getAllCoupons(
                keys: [],
                values: [], 
                fields: ['id', 'code', 'value', 'type', 'min_subtotal', 'starts_at', 'ends_at', 'usage_limit', 'is_active'],
                paginate: 12
            );

            return response()->json(['data' => $coupons]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'index_coupon_failed',
                'entity_type' => 'Coupon',
                'route' => 'admin.coupons.index',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'status_code' => 500,
                'message' => 'Erreur lors du chargement des coupons.',
                'metadata' => ['error' => $e->getMessage()],
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement des coupons.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(CouponRequest $request)
    {
        try {
            $data = $request->validated();

            $coupon = $this->couponService->createCoupon($data);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_coupon',
                'entity_type' => 'Coupon',
                'entity_id' => $coupon->id,
                'color' => 'success',
                'route' => 'admin.coupons.store',
                'status_code' => 201,
                'method' => 'POST',
                'message' => 'Coupon créé avec succès.',
                'metadata' => ['code' => $coupon->code, 'value' => $coupon->value],
            ]);

            return response()->json(['message' => 'Coupon créé.', 'data' => $coupon], 201);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'create_coupon_failed',
                'entity_type' => 'Coupon',
                'entity_id' => null,
                'color' => 'danger',
                'route' => 'admin.coupons.store',
                'status_code' => 500,
                'method' => 'POST',
                'message' => 'Erreur lors de la création du coupon.',
                'metadata' => ['error' => $e->getMessage()],
            ]);

            return response()->json(['message' => 'Erreur lors de la création du coupon.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);
        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'view_coupon_failed',
                'entity_type' => 'Coupon',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.coupons.show',
                'status_code' => 400,
                'message' => 'ID de coupon invalide.',
                'metadata' => ['error' => "ID invalide: $encryptedId"],
            ]);
            return response()->json(['message' => 'ID de coupon invalide.'], 400);
        }

        try {
            $coupon = $this->couponService->getCouponById($id, ['*']);
            if (!$coupon) {
                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'view_coupon_failed',
                    'entity_type' => 'Coupon',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'GET',
                    'route' => 'admin.coupons.show',
                    'status_code' => 404,
                    'message' => 'Coupon non trouvé.',
                    'metadata' => ['error' => "Coupon not found: $id"],
                ]);
                return response()->json(['message' => 'Coupon non trouvé.'], 404);
            }

            return response()->json(['data' => $coupon]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'view_coupon_failed',
                'entity_type' => 'Coupon',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'GET',
                'route' => 'admin.coupons.show',
                'status_code' => 500,
                'message' => 'Erreur lors de la récupération du coupon.',
                'metadata' => ['error' => $e->getMessage()],
            ]);
            return response()->json(['message' => 'Erreur lors de la récupération du coupon.', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(CouponRequest $request, string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);
        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_coupon_failed',
                'entity_type' => 'Coupon',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.coupons.update',
                'status_code' => 400,
                'message' => 'ID de coupon invalide.',
                'metadata' => ['error' => "ID invalide: $encryptedId"],
            ]);
            return response()->json(['message' => 'ID de coupon invalide.'], 400);
        }

        try {
            $coupon = $this->couponService->getCouponById($id, ['*']);
            if (!$coupon) {
                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'update_coupon_failed',
                    'entity_type' => 'Coupon',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'PUT',
                    'route' => 'admin.coupons.update',
                    'status_code' => 404,
                    'message' => 'Coupon non trouvé.',
                    'metadata' => ['error' => "Coupon not found: $id"],
                ]);
                return response()->json(['message' => 'Coupon non trouvé.'], 404);
            }

            $data = $request->validated();
            $updated = $this->couponService->updateCoupon($coupon, $data);

            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_coupon',
                'entity_type' => 'Coupon',
                'entity_id' => $updated->id,
                'color' => 'success',
                'method' => 'PUT',
                'route' => 'admin.coupons.update',
                'status_code' => 200,
                'message' => 'Coupon mis à jour avec succès.',
                'metadata' => ['code' => $updated->code],
            ]);

            return response()->json(['message' => 'Coupon mis à jour.', 'data' => $updated]);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'update_coupon_failed',
                'entity_type' => 'Coupon',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'PUT',
                'route' => 'admin.coupons.update',
                'status_code' => 500,
                'message' => 'Erreur lors de la mise à jour du coupon.',
                'metadata' => ['error' => $e->getMessage()],
            ]);
            return response()->json(['message' => 'Erreur lors de la mise à jour du coupon.', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $encryptedId)
    {
        $id = decrypt_to_int_or_null($encryptedId);
        if (is_null($id)) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_coupon_failed',
                'entity_type' => 'Coupon',
                'entity_id' => null,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.coupons.destroy',
                'status_code' => 400,
                'message' => 'ID de coupon invalide.',
                'metadata' => ['error' => "ID invalide: $encryptedId"],
            ]);
            return response()->json(['message' => 'ID de coupon invalide.'], 400);
        }

        try {
            $coupon = $this->couponService->getCouponById($id, ['id']);
            if (!$coupon) {
                $this->activityLogService->createActivityLog([
                    'user_id' => Auth::id(),
                    'action' => 'delete_coupon_failed',
                    'entity_type' => 'Coupon',
                    'entity_id' => $id,
                    'color' => 'warning',
                    'method' => 'DELETE',
                    'route' => 'admin.coupons.destroy',
                    'status_code' => 404,
                    'message' => 'Coupon non trouvé.',
                    'metadata' => ['error' => "Coupon not found: $id"],
                ]);
                return response()->json(['message' => 'Coupon non trouvé.'], 404);
            }

            $this->couponService->deleteCoupon($coupon);
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_coupon',
                'entity_type' => 'Coupon',
                'entity_id' => $id,
                'color' => 'success',
                'method' => 'DELETE',
                'route' => 'admin.coupons.destroy',
                'status_code' => 200,
                'message' => 'Coupon supprimé.',
                'metadata' => ['coupon_id' => $id],
            ]);
            return response()->json(['message' => 'Coupon supprimé.']);
        } catch (Throwable $e) {
            $this->activityLogService->createActivityLog([
                'user_id' => Auth::id(),
                'action' => 'delete_coupon_failed',
                'entity_type' => 'Coupon',
                'entity_id' => $id,
                'color' => 'danger',
                'method' => 'DELETE',
                'route' => 'admin.coupons.destroy',
                'status_code' => 500,
                'message' => 'Erreur lors de la suppression du coupon.',
                'metadata' => ['error' => $e->getMessage()],
            ]);
            return response()->json(['message' => 'Erreur lors de la suppression du coupon.', 'error' => $e->getMessage()], 500);
        }
    }
}
