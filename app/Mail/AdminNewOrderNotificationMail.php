<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminNewOrderNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order, public array $platform = []) {}

    public function build()
    {
        $order = $this->order->loadMissing(['user', 'items', 'address', 'paymentMethod']);

        return $this->subject('Nouvelle commande client - '.$order->order_number)
            ->view('emails.admin_new_order_notification')
            ->with([
                'order' => $order,
                'platform' => $this->platform,
            ]);
    }
}
