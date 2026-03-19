<?php

namespace App\Mail;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order, public array $platform = []) {}

    public function build()
    {
        $order = $this->order->loadMissing(['user', 'items', 'address', 'invoice']);
        $platform = $this->platform;
        $logoPath = null;

        if (! empty($platform['logo'])) {
            $candidate = public_path(ltrim((string) $platform['logo'], '/'));
            if (file_exists($candidate)) {
                $logoPath = $candidate;
            }
        }

        $pdf = Pdf::loadView('pdf.invoice', [
            'order' => $order,
            'platform' => $platform,
            'logoPath' => $logoPath,
        ])->setPaper('a4');

        $filename = sprintf(
            'facture-%s.pdf',
            $order->invoice?->number ?? $order->order_number
        );

        return $this->subject('Votre facture - '.$order->order_number)
            ->view('emails.order_invoice')
            ->with([
                'order' => $order,
                'platform' => $platform,
            ])
            ->attachData($pdf->output(), $filename, [
                'mime' => 'application/pdf',
            ]);
    }
}
