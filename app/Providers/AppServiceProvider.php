<?php

namespace App\Providers;

use App\Interface\ActivityLogInterface;
use App\Interface\AddressInterface;
use App\Interface\BrandInterface;
use App\Interface\CartInterface;
use App\Interface\CartItemInterface;
use App\Interface\CategoryInterface;
use App\Interface\CityInterface;
use App\Interface\CouponInterface;
use App\Interface\InventoryInterface;
use App\Interface\InventoryPriceHistoryInterface;
use App\Interface\OrderInterface;
use App\Interface\OrderItemInterface;
use App\Interface\PasswordResetCodeInterface;
use App\Interface\PaymentMethodInterface;
use App\Interface\ProductImageInterface;
use App\Interface\ProductInterface;
use App\Interface\ReviewInterface;
use App\Interface\SettingsInterface;
use App\Interface\SlideInterface;
use App\Interface\StockMovementInterface;
use App\Interface\StockReservationInterface;
use App\Interface\TestimonialInterface;
use App\Interface\UserInterface;
use App\Repositories\ActivityLogRepository;
use App\Repositories\AddressRepository;
use App\Repositories\BrandRepository;
use App\Repositories\CartItemRepository;
use App\Repositories\CartRepository;
use App\Repositories\CategoryRepository;
use App\Repositories\CityRepository;
use App\Repositories\CouponRepository;
use App\Repositories\InventoryPriceHistoryRepository;
use App\Repositories\InventoryRepository;
use App\Repositories\OrderItemRepository;
use App\Repositories\OrderRepository;
use App\Repositories\PasswordResetCodeRepository;
use App\Repositories\PaymentMethodRepository;
use App\Repositories\ProductImageRepository;
use App\Repositories\ProductRepository;
use App\Repositories\ReviewRepository;
use App\Repositories\SettingsRepository;
use App\Repositories\SlideRepository;
use App\Repositories\StockMovementRepository;
use App\Repositories\StockReservationRepository;
use App\Repositories\TestimonialRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ActivityLogInterface::class, ActivityLogRepository::class);
        $this->app->bind(BrandInterface::class, BrandRepository::class);
        $this->app->bind(CategoryInterface::class, CategoryRepository::class);
        $this->app->bind(CityInterface::class, CityRepository::class);
        $this->app->bind(PasswordResetCodeInterface::class, PasswordResetCodeRepository::class);
        $this->app->bind(UserInterface::class, UserRepository::class);
        $this->app->bind(SlideInterface::class, SlideRepository::class);
        $this->app->bind(ProductInterface::class, ProductRepository::class);
        $this->app->bind(ProductImageInterface::class, ProductImageRepository::class);
        $this->app->bind(UserInterface::class, UserRepository::class);
        $this->app->bind(InventoryInterface::class, InventoryRepository::class);
        $this->app->bind(InventoryPriceHistoryInterface::class, InventoryPriceHistoryRepository::class);
        $this->app->bind(TestimonialInterface::class, TestimonialRepository::class);
        $this->app->bind(AddressInterface::class, AddressRepository::class);
        $this->app->bind(CartInterface::class, CartRepository::class);
        $this->app->bind(CartItemInterface::class, CartItemRepository::class);
        $this->app->bind(PaymentMethodInterface::class, PaymentMethodRepository::class);
        $this->app->bind(ReviewInterface::class, ReviewRepository::class);
        $this->app->bind(CouponInterface::class, CouponRepository::class);
        $this->app->bind(OrderInterface::class, OrderRepository::class);
        $this->app->bind(OrderItemInterface::class, OrderItemRepository::class);
        $this->app->bind(SettingsInterface::class, SettingsRepository::class);
        $this->app->bind(StockMovementInterface::class, StockMovementRepository::class);
        $this->app->bind(StockReservationInterface::class, StockReservationRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
