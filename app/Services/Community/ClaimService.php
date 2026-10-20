<?php

namespace App\Services\Community;

use App\Enums\BusinessStatus;
use App\Enums\ClaimStatus;
use App\Enums\RoleName;
use App\Models\Admin;
use App\Models\Business;
use App\Models\BusinessClaim;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\StatusTransitionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Ownership claims. A member asks to own a listing; staff check the evidence
 * and approve. Ownership (businesses.owner_id) only ever comes from here or an
 * approved new-listing submission, never from client input.
 */
class ClaimService
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly StatusTransitionService $transitions,
    ) {}

    /**
     * @param  array<string, mixed>  $details  validated BusinessClaimRequest data
     */
    public function submit(User $user, Business $business, array $details): BusinessClaim
    {
        if ($business->owner_id === $user->id) {
            throw ValidationException::withMessages(['business' => ['You already manage this listing.']]);
        }
        if ($business->owner_id !== null) {
            throw ValidationException::withMessages(['business' => ['This listing has already been claimed. If you are the owner, contact us.']]);
        }
        if ($business->claims()->where('user_id', $user->id)->where('status', ClaimStatus::Pending->value)->exists()) {
            throw ValidationException::withMessages(['business' => ['Your claim for this listing is already being reviewed.']]);
        }

        return DB::transaction(function () use ($user, $business, $details) {
            $claim = new BusinessClaim([
                'claimant_role' => $details['claimant_role'],
                'contact_phone' => $details['contact_phone'],
                'contact_email' => $details['contact_email'],
                'evidence' => array_filter([
                    'message' => $details['message'] ?? null,
                    'links' => array_values(array_filter($details['evidence_links'] ?? [])),
                    'contact_phone_country' => $details['contact_phone_country'] ?? null,
                ]),
            ]);
            $claim->business()->associate($business);
            $claim->user()->associate($user);
            $claim->save();

            $this->audit->log('business_claim.submitted', $claim, null, ['business_id' => $business->id], $user);

            return $claim;
        });
    }

    public function approve(BusinessClaim $claim, Admin $reviewer, ?string $notes = null): BusinessClaim
    {
        $this->assertPending($claim);

        return DB::transaction(function () use ($claim, $reviewer, $notes) {
            /** @var Business $business */
            $business = Business::withTrashed()->lockForUpdate()->findOrFail($claim->business_id);

            if ($business->owner_id !== null && $business->owner_id !== $claim->user_id) {
                throw ValidationException::withMessages(['claim' => ['This listing already has an owner. Remove them first if this claim should replace them.']]);
            }

            $business->forceFill(['owner_id' => $claim->user_id])->save();
            $claim->user->assignRole(RoleName::BusinessOwner);

            // A verified listing with a confirmed owner shows as "Claimed" (still verified).
            if ($business->status === BusinessStatus::Verified) {
                $this->transitions->transitionBusiness($business, BusinessStatus::Claimed, $reviewer, 'Ownership claim approved');
            }

            $this->close($claim, ClaimStatus::Approved, $reviewer, $notes);
            $this->audit->log('business.owner_linked', $business, null, ['owner_id' => $claim->user_id, 'claim_id' => $claim->id], $reviewer);

            // Any other open claim for this listing is now moot.
            $business->claims()->whereKeyNot($claim->id)->where('status', ClaimStatus::Pending->value)->get()
                ->each(fn (BusinessClaim $other) => $this->close($other, ClaimStatus::Rejected, $reviewer, 'Another ownership claim for this listing was approved.'));

            return $claim;
        });
    }

    public function reject(BusinessClaim $claim, Admin $reviewer, string $notes): BusinessClaim
    {
        $this->assertPending($claim);

        return DB::transaction(fn () => $this->close($claim, ClaimStatus::Rejected, $reviewer, $notes));
    }

    public function cancel(BusinessClaim $claim, User $user): BusinessClaim
    {
        $this->assertPending($claim);

        return DB::transaction(fn () => $this->close($claim, ClaimStatus::Cancelled, $user, null));
    }

    private function close(BusinessClaim $claim, ClaimStatus $status, User|Admin $actor, ?string $notes): BusinessClaim
    {
        $claim->forceFill([
            'status' => $status,
            'reviewer_id' => $status === ClaimStatus::Cancelled ? null : $actor->id,
            'reviewed_at' => $status === ClaimStatus::Cancelled ? null : now(),
            'review_notes' => $notes,
        ])->save();

        $this->audit->log('business_claim.'.strtolower($status->value), $claim, ['status' => ClaimStatus::Pending->value],
            ['status' => $status->value, 'notes' => $notes], $actor);

        return $claim;
    }

    private function assertPending(BusinessClaim $claim): void
    {
        if ($claim->status !== ClaimStatus::Pending) {
            throw ValidationException::withMessages(['claim' => ['This claim has already been decided.']]);
        }
    }
}
