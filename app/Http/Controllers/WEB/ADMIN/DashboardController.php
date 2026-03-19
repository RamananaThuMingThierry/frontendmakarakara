<?php

namespace App\Http\Controllers\WEB\ADMIN;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $mode = $request->string('mode')->toString() === 'monthly' ? 'monthly' : 'daily';
        $timezone = config('app.timezone', 'UTC');
        $selectedMonth = $request->string('month')->toString();

        if ($mode === 'monthly' && $selectedMonth) {
            $monthDate = Carbon::createFromFormat('Y-m', $selectedMonth, $timezone);
            $startDate = $monthDate->copy()->startOfMonth();
            $endDate = $monthDate->copy()->endOfMonth();
        } else {
            $startDate = $request->date('start_date')
                ? Carbon::parse($request->string('start_date')->toString(), $timezone)->startOfDay()
                : ($mode === 'monthly' ? now()->subMonths(5)->startOfMonth() : now()->subDays(6)->startOfDay());

            $endDate = $request->date('end_date')
                ? Carbon::parse($request->string('end_date')->toString(), $timezone)->endOfDay()
                : now()->endOfDay();
        }

        if ($startDate->greaterThan($endDate)) {
            [$startDate, $endDate] = [$endDate->copy()->startOfDay(), $startDate->copy()->endOfDay()];
        }

        $ordersQuery = Order::query()->whereBetween('created_at', [$startDate, $endDate]);
        $completedOrdersQuery = Order::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', OrderStatus::CANCELLED->value);

        $paidOrdersQuery = Order::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_status', PaymentStatus::PAID->value);

        $summary = [
            'orders_count' => (clone $ordersQuery)->count(),
            'completed_orders_count' => (clone $completedOrdersQuery)->count(),
            'cancelled_orders_count' => (clone $ordersQuery)->where('status', OrderStatus::CANCELLED->value)->count(),
            'paid_orders_count' => (clone $paidOrdersQuery)->count(),
            'revenue_total' => (float) ((clone $paidOrdersQuery)->sum('total') ?: 0),
            'average_order_value' => (float) ((clone $completedOrdersQuery)->avg('total') ?: 0),
            'new_customers_count' => User::role('customer')->whereBetween('created_at', [$startDate, $endDate])->count(),
            'customers_total' => User::role('customer')->count(),
            'products_total' => Product::query()->count(),
            'active_products_count' => Product::query()->where('is_active', true)->count(),
            'active_reservations_count' => Reservation::query()->where('status', 'active')->count(),
            'pending_orders_count' => Order::query()->where('status', OrderStatus::PENDING->value)->count(),
            'pending_payments_count' => Order::query()->where('payment_status', PaymentStatus::PENDING_VERIFICATION->value)->count(),
        ];

        $isHourly = $mode === 'daily' && $startDate->isSameDay($endDate);
        $series = $isHourly
            ? $this->hourlySeries($startDate, $endDate)
            : $this->dailySeries($startDate, $endDate);

        $statusBreakdown = Order::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('status', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(fn ($row) => [
                'key' => $row->status,
                'count' => (int) $row->aggregate,
            ])
            ->values();

        $paymentBreakdown = Order::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('payment_status', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('payment_status')
            ->orderBy('payment_status')
            ->get()
            ->map(fn ($row) => [
                'key' => $row->payment_status,
                'count' => (int) $row->aggregate,
            ])
            ->values();

        $topProducts = OrderItem::query()
            ->select(
                'product_id',
                'product_name',
                'sku',
                DB::raw('SUM(quantity) as quantity_sold'),
                DB::raw('SUM(line_total) as revenue_total')
            )
            ->whereHas('order', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', '!=', OrderStatus::CANCELLED->value);
            })
            ->groupBy('product_id', 'product_name', 'sku')
            ->orderByDesc('quantity_sold')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'sku' => $item->sku,
                'quantity_sold' => (int) $item->quantity_sold,
                'revenue_total' => (float) $item->revenue_total,
            ])
            ->values();

        $recentOrders = Order::query()
            ->with(['user:id,name,email'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'encrypted_id' => $order->encrypted_id,
                'order_number' => $order->order_number,
                'status' => $order->status?->value ?? $order->status,
                'payment_status' => $order->payment_status?->value ?? $order->payment_status,
                'total' => (float) $order->total,
                'customer_name' => $order->user?->name,
                'customer_email' => $order->user?->email,
                'created_at' => optional($order->created_at)->toIso8601String(),
            ])
            ->values();

        $recentActivity = ActivityLog::query()
            ->with(['user:id,name'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'message' => $log->message,
                'color' => $log->color,
                'user_name' => $log->user?->name,
                'created_at' => optional($log->created_at)->toIso8601String(),
            ])
            ->values();

        return response()->json([
            'data' => [
                'filters' => [
                    'mode' => $mode,
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                    'month' => $endDate->format('Y-m'),
                    'series_granularity' => $isHourly ? 'hourly' : 'daily',
                ],
                'summary' => $summary,
                'series' => $series,
                'status_breakdown' => $statusBreakdown,
                'payment_breakdown' => $paymentBreakdown,
                'top_products' => $topProducts,
                'recent_orders' => $recentOrders,
                'recent_activity' => $recentActivity,
            ],
        ]);
    }

    private function dailySeries(Carbon $startDate, Carbon $endDate): array
    {
        $rows = Order::query()
            ->selectRaw('DATE(created_at) as bucket')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw("SUM(CASE WHEN payment_status = ? THEN total ELSE 0 END) as revenue_total", [PaymentStatus::PAID->value])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy(DB::raw('DATE(created_at)'))
            ->get()
            ->keyBy('bucket');

        $series = [];
        $cursor = $startDate->copy()->startOfDay();

        while ($cursor->lessThanOrEqualTo($endDate)) {
            $key = $cursor->toDateString();
            $row = $rows->get($key);

            $series[] = [
                'bucket' => $key,
                'label' => $cursor->format('d/m'),
                'orders_count' => (int) ($row->orders_count ?? 0),
                'revenue_total' => (float) ($row->revenue_total ?? 0),
            ];

            $cursor->addDay();
        }

        return $series;
    }

    private function hourlySeries(Carbon $startDate, Carbon $endDate): array
    {
        $rows = Order::query()
            ->selectRaw('HOUR(created_at) as bucket')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw("SUM(CASE WHEN payment_status = ? THEN total ELSE 0 END) as revenue_total", [PaymentStatus::PAID->value])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->orderBy(DB::raw('HOUR(created_at)'))
            ->get()
            ->keyBy('bucket');

        $series = [];

        for ($hour = 0; $hour < 24; $hour++) {
            $row = $rows->get($hour);

            $series[] = [
                'bucket' => sprintf('%02d:00', $hour),
                'label' => sprintf('%02dh', $hour),
                'orders_count' => (int) ($row->orders_count ?? 0),
                'revenue_total' => (float) ($row->revenue_total ?? 0),
            ];
        }

        return $series;
    }

}
