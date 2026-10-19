<?php

namespace App\Policies;

use App\Enums\EventStatus;
use App\Enums\PermissionName;
use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Event $event): bool
    {
        return $event->isPublic()
            || ($user && ($user->hasPermission(PermissionName::ManageEvents) || $event->submitted_by === $user->id));
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(PermissionName::ManageEvents);
    }

    /**
     * Submitters may edit their own events until they are published.
     */
    public function update(User $user, Event $event): bool
    {
        if ($user->hasPermission(PermissionName::ManageEvents)) {
            return true;
        }

        return $event->submitted_by === $user->id
            && in_array($event->status, [EventStatus::Draft, EventStatus::Submitted], true);
    }

    public function changeStatus(User $user, Event $event): bool
    {
        return $user->hasPermission(PermissionName::ManageEvents);
    }

    public function delete(User $user, Event $event): bool
    {
        return $user->hasPermission(PermissionName::ManageEvents);
    }

    public function forceDelete(User $user, Event $event): bool
    {
        return false;
    }
}
