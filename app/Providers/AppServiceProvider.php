<?php

namespace App\Providers;

use App\Interface\ActivityLogInterface;
use App\Interface\BrandInterface;
use App\Interface\CategoryInterface;
use App\Interface\CityInterface;
use App\Interface\CityProductInterface;
use App\Interface\InventoryInterface;
use App\Interface\PasswordResetCodeInterface;
use App\Interface\ProductImageInterface;
use App\Interface\ProductInterface;
use App\Interface\SlideInterface;
use App\Interface\UserInterface;
use App\Repositories\ActivityLogRepository;
use App\Repositories\BrandRepository;
use App\Repositories\CategoryRepository;
use App\Repositories\CityProductRepository;
use App\Repositories\CityRepository;
use App\Repositories\InventoryRepository;
use App\Repositories\PasswordResetCodeRepository;
use App\Repositories\ProductImageRepository;
use App\Repositories\ProductRepository;
use App\Repositories\SlideRepository;
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
        $this->app->bind(CityProductInterface::class, CityProductRepository::class);
        $this->app->bind(InventoryInterface::class, InventoryRepository::class);

    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
