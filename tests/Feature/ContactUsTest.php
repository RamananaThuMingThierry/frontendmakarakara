<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactUsTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_message_can_be_created(): void
    {
        $payload = [
            'name' => 'Jean Test',
            'email' => 'jean@example.com',
            'phone' => '+261340000000',
            'subject' => 'Demande d information',
            'message' => 'Bonjour, je souhaite avoir plus de details.',
        ];

        $response = $this->postJson('/api/contact', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.name', $payload['name'])
            ->assertJsonPath('data.email', $payload['email'])
            ->assertJsonPath('data.subject', $payload['subject']);

        $this->assertDatabaseHas('contact_us', [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'subject' => $payload['subject'],
        ]);
    }
}
