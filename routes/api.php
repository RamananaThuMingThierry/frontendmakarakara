<?php

use App\Http\Controllers\WEB\AccountAdminController;
use App\Http\Controllers\WEB\ActivityLogController;
use App\Http\Controllers\WEB\AddressController;
use App\Http\Controllers\WEB\AuthController;
use App\Http\Controllers\WEB\BrandController;
use App\Http\Controllers\WEB\CartController;
use App\Http\Controllers\WEB\CartItemController;
use App\Http\Controllers\WEB\CategoryController;
use App\Http\Controllers\WEB\CityController;
use App\Http\Controllers\WEB\ContactUsController;
use App\Http\Controllers\WEB\CouponController;
use App\Http\Controllers\WEB\GalleryController;
use App\Http\Controllers\WEB\InventoryController;
use App\Http\Controllers\WEB\InventoryPriceHistoryController;
use App\Http\Controllers\WEB\PaymentMethodController;
use App\Http\Controllers\WEB\ProductController;
use App\Http\Controllers\WEB\ProductImageController;
use App\Http\Controllers\WEB\ReviewController;
use App\Http\Controllers\WEB\SettingsController;
use App\Http\Controllers\WEB\SlideController;
use App\Http\Controllers\WEB\StockMovementController;
use App\Http\Controllers\WEB\TestimonialController;
use App\Http\Controllers\WEB\UserController;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [AuthController::class, 'forgot'])->name('forgot-password');
Route::post('/reset-password', [AuthController::class, 'reset'])->name('reset');
Route::post('/contact', [ContactUsController::class, 'store'])->name('contact.store');
Route::get('/galleries', [GalleryController::class, 'publicIndex'])->name('galleries.public.index');
Route::get('/testimonials', [TestimonialController::class, 'publicIndex'])->name('testimonials.public.index');
Route::post('/testimonials', [TestimonialController::class, 'publicStore'])->name('testimonials.public.store');
Route::get('/shop/inventories', [InventoryController::class, 'shopIndex'])->name('shop.inventories');
Route::get('/shop/products/{encryptedId}', [ProductController::class, 'shopShow'])->name('shop.products.show');

Route::get('/email/verify/{id}/{hash}', function (Request $request, string $id, string $hash) {
    if (! $request->hasValidSignature()) {
        return response()->json([
            'message' => 'Lien de vérification invalide ou expiré.',
        ], 403);
    }

    try {
        $userId = Crypt::decryptString($id);
    } catch (\Throwable $e) {
        return response()->json([
            'message' => 'Identifiant invalide.',
        ], 400);
    }

    $user = User::find($userId);

    if (! $user) {
        return response()->json([
            'message' => 'Utilisateur introuvable.',
        ], 404);
    }

    if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
        return response()->json([
            'message' => 'Lien de vérification invalide.',
        ], 403);
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    return response()->json([
        'message' => 'Votre email a bien été vérifié.',
        'verified' => true,
    ]);
})->name('verification.verify.api');

Route::middleware('auth:sanctum')->group(function(){

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])
        ->name('verification.send.api');

    Route::middleware(['role:admin'])->prefix('admin')->group(function () {

        Route::get('admin/account', function(Request $request){
            return response()->json($request->user());
        });

        Route::apiResource('users', UserController::class);

        Route::post('users/{encryptedId}/restore', [UserController::class, 'restore'])->name('users.restore');

        Route::delete('users/{encryptedId}/force-delete', [UserController::class, 'forceDelete'])->name('users.forceDelete');

        Route::apiResource('slides', SlideController::class);

        Route::apiResource('addresses', AddressController::class);

        Route::apiResource('testimonials', TestimonialController::class);

        Route::apiResource('categories', CategoryController::class);

        Route::apiResource('categories.products', ProductController::class);

        Route::post('categories/{category}/products/{encryptedId}/restore', [ProductController::class, 'restore'])->name('products.restore');

        Route::delete('categories/{category}/products/{encryptedId}/force-delete', [ProductController::class, 'forceDelete'])->name('products.forceDelete');

        Route::apiResource('product_images', ProductImageController::class)->only(['index','store','destroy']);

        Route::apiResource('inventories', InventoryController::class);
        Route::put('inventories/{encryptedId}/adjust', [InventoryController::class, 'adjust'])->name('inventories.adjust');
        Route::put('inventories/{encryptedId}/transfert', [InventoryController::class, 'transfert'])->name('inventories.adjust');

        Route::apiResource('inventory_price_histories', InventoryPriceHistoryController::class);

        Route::apiResource('stock_movements', StockMovementController::class);

        Route::apiResource('brands', BrandController::class);

        Route::apiResource('city', CityController::class);

        Route::apiResource('carts', CartController::class);

        Route::apiResource('cart_items', CartItemController::class);

        Route::apiResource('payment_methods', PaymentMethodController::class);

        Route::apiResource('reviews', ReviewController::class);

        Route::apiResource('coupons', CouponController::class);

        Route::apiResource('galleries', GalleryController::class);

        Route::apiResource('contacts', ContactUsController::class)->only(['index', 'show', 'destroy']);

        Route::get('settings', [SettingsController::class, 'show'])->name('settings.show');
        Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');

        Route::apiResource('activity-logs', ActivityLogController::class)->only(['index','show','destroy']);

        Route::get('account', [AccountAdminController::class, 'show'])->name('account.show');
        Route::put('account', [AccountAdminController::class, 'update'])->name('account.update');
        Route::put('account/password', [AccountAdminController::class, 'changePassword'])->name('account.password.update');

        Route::post('logout', [AuthController::class, 'logout']);
    });

    Route::middleware(['role:delivery'])->group(function () {
        // Route::get('/delivery/dashboard', ...);
    });

    Route::middleware(['role:customer'])->group(function () {
    });
});
