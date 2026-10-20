<?php

namespace App\Enums;

enum SubmissionType: string
{
    case Business = 'BUSINESS';
    case Place = 'PLACE';
    case Event = 'EVENT';
    case Correction = 'CORRECTION';
    case Photo = 'PHOTO';
    /** An owner's proposed changes to their own listing; applied only when approved. */
    case OwnerEdit = 'OWNER_EDIT';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
