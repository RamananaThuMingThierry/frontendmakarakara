<?php

namespace App\Mail;

use App\Models\ContactUs;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactUsNotification extends Mailable
{
    use Queueable, SerializesModels;

    public ContactUs $contact;

    public function __construct(ContactUs $contact)
    {
        $this->contact = $contact;
    }

    public function build()
    {
        return $this->subject('Nouveau message de contact : ' . $this->contact->subject)
            ->view('emails.contact_us_admin_notification');
    }
}
