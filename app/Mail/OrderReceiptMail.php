<?php

namespace App\Mail;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function build()
    {
        $order = $this->order->loadMissing(['user', 'items', 'invoice', 'receipt']);
        $pdf = Pdf::loadView('pdf.receipt', [
            'order' => $order,
        ])->setPaper('a4');

        $filename = sprintf(
            'recu-%s.pdf',
            $order->receipt?->number ?? $order->order_number
        );

        return $this->subject('Votre recu de paiement - '.$this->order->order_number)
            ->view('emails.order_receipt')
            ->with(['order' => $order])
            ->attachData($pdf->output(), $filename, [
                'mime' => 'application/pdf',
            ]);
    }
}
