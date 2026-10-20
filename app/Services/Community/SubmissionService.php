<?php

namespace App\Services\Community;

use App\Enums\RoleName;
use App\Enums\SubmissionStatus;
use App\Enums\SubmissionType;
use App\Models\Business;
use App\Models\Submission;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\BusinessWriter;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Member submissions that staff approve or reject: new business listings
 * (the submitter becomes the owner) and owners' edits to their listing.
 */
class SubmissionService
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly BusinessWriter $businesses,
    ) {}

    /**
     * @param  array<string, mixed>  $listing  validated BusinessSubmissionRequest data
     */
    public function submitBusiness(User $user, array $listing): Submission
    {
        return DB::transaction(function () use ($user, $listing) {
            $submission = new Submission(['type' => SubmissionType::Business, 'payload' => $listing]);
            $submission->user()->associate($user);
            $submission->save();

            $this->audit->log('submission.created', $submission, null, ['type' => SubmissionType::Business->value, 'name' => $listing['name']], $user);

            return $submission;
        });
    }

    public function approve(Submission $submission, User $reviewer, ?string $notes = null): Submission
    {
        $this->assertPending($submission);

        return DB::transaction(function () use ($submission, $reviewer, $notes) {
            match ($submission->type) {
                SubmissionType::Business => $this->createListing($submission),
                SubmissionType::OwnerEdit => $this->applyOwnerEdit($submission),
                default => throw ValidationException::withMessages(['submission' => ['This kind of submission is reviewed elsewhere.']]),
            };

            return $this->close($submission, SubmissionStatus::Approved, $reviewer, $notes);
        });
    }

    public function reject(Submission $submission, User $reviewer, string $notes): Submission
    {
        $this->assertPending($submission);

        return DB::transaction(fn () => $this->close($submission, SubmissionStatus::Rejected, $reviewer, $notes));
    }

    /**
     * The submitter takes back a submission nobody has reviewed yet.
     */
    public function withdraw(Submission $submission, User $user): void
    {
        $this->assertPending($submission);

        DB::transaction(function () use ($submission, $user) {
            $this->audit->log('submission.withdrawn', $submission, null, ['type' => $submission->type->value], $user);
            $submission->delete();
        });
    }

    private function createListing(Submission $submission): void
    {
        $p = $submission->payload;
        $owner = $submission->user;

        if ($owner === null) {
            throw ValidationException::withMessages(['submission' => ['The member who submitted this listing no longer has an account.']]);
        }

        $business = $this->businesses->save(new Business, [
            'name' => $p['name'],
            'tagline' => $p['tagline'] ?? null,
            'description' => $p['description'] ?? null,
            'address_line' => $p['address_line'] ?? null,
            'locality' => $p['locality'] ?? null,
            'pincode' => $p['pincode'] ?? null,
            'primary_area_id' => $p['area_id'] ?? null,
            'phone' => $p['phone'] ?? null,
            'whatsapp' => $p['whatsapp'] ?? null,
            'email' => $p['email'] ?? null,
            'website' => $p['website'] ?? null,
            'is_published' => true,
            'source_name' => 'Submitted by the owner',
            'category_ids' => [$p['category_id']],
            'primary_category_id' => $p['category_id'],
            'area_ids' => array_filter([$p['area_id'] ?? null]),
        ], 'business.created_from_submission');

        $business->forceFill(['owner_id' => $owner->id])->save();
        $owner->assignRole(RoleName::BusinessOwner);

        $submission->entity()->associate($business);
        $this->audit->log('business.owner_linked', $business, null, ['owner_id' => $owner->id, 'submission_id' => $submission->id]);
    }

    private function applyOwnerEdit(Submission $submission): void
    {
        $business = $submission->entity;

        if (! $business instanceof Business) {
            throw ValidationException::withMessages(['submission' => ['This listing no longer exists.']]);
        }
        if ($business->owner_id === null || $business->owner_id !== $submission->user_id) {
            throw ValidationException::withMessages(['submission' => ['The member who proposed these changes no longer owns this listing.']]);
        }

        $this->businesses->save($business, $submission->payload, 'business.owner_edit_applied');
    }

    private function close(Submission $submission, SubmissionStatus $status, User $reviewer, ?string $notes): Submission
    {
        $submission->forceFill([
            'status' => $status,
            'reviewer_id' => $reviewer->id,
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ])->save();

        $this->audit->log('submission.'.strtolower($status->value), $submission, ['status' => SubmissionStatus::Pending->value],
            ['status' => $status->value, 'notes' => $notes], $reviewer);

        return $submission;
    }

    private function assertPending(Submission $submission): void
    {
        if ($submission->status !== SubmissionStatus::Pending) {
            throw ValidationException::withMessages(['submission' => ['This submission has already been reviewed.']]);
        }
    }
}
