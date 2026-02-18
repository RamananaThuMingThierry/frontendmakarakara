<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WEB\AuthController;
use App\Http\Controllers\WEB\CategoryController;
use App\Http\Controllers\WEB\ActivityLogController;
use App\Http\Controllers\WEB\BrandController;
use App\Http\Controllers\WEB\CityController;
use App\Http\Controllers\WEB\ProductController;
use App\Http\Controllers\WEB\UserController;

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

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgot']);
Route::post('/reset-password', [AuthController::class, 'rest']);

Route::middleware('auth:sanctum')->group(function(){
    
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', [AuthController::class, 'me']);    

    Route::middleware(['role:admin'])->prefix('admin')->group(function () {

        Route::get('admin/account', function(Request $request){
            return response()->json($request->user());
        });
        
        Route::apiResource('users', UserController::class);
        
        Route::post('users/{encryptedId}/restore', [UserController::class, 'restore'])->name('users.restore');

        Route::delete('users/{encryptedId}/force-delete', [UserController::class, 'forceDelete'])->name('users.forceDelete');
            
        Route::apiResource('categories', CategoryController::class);
        
        Route::apiResource('products', ProductController::class);

        Route::post('products/{encryptedId}/restore', [ProductController::class, 'restore'])->name('products.restore');

        Route::delete('products/{encryptedId}/force-delete', [ProductController::class, 'forceDelete'])->name('products.forceDelete');

        Route::apiResource('brand', BrandController::class);

        Route::apiResource('city', CityController::class);

        Route::apiResource('activity-logs', ActivityLogController::class)->only(['index','show','destroy']);

        Route::post('logout', [AuthController::class, 'logout']);
    });

    Route::middleware(['role:delivery'])->group(function () {
        // Route::get('/delivery/dashboard', ...);
    });

    Route::middleware(['role:customer'])->group(function () {
        // Route::get('/customer/account', ...);

        Route::get('/account', function(Request $request){
            return response()->json($request->user());
        });
    });
});
