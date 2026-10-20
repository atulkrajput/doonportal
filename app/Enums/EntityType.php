<?php

namespace App\Enums;

use App\Models\Admin;
use App\Models\AiDiscovery;
use App\Models\AiRun;
use App\Models\Area;
use App\Models\Business;
use App\Models\BusinessClaim;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Event;
use App\Models\Media;
use App\Models\Organizer;
use App\Models\Page;
use App\Models\Place;
use App\Models\Plan;
use App\Models\Review;
use App\Models\SeoMeta;
use App\Models\Setting;
use App\Models\Story;
use App\Models\Submission;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Database\Eloquent\Model;

/**
 * The fixed allowlist of polymorphic entity types. The value is the morph alias
 * stored in *_type columns and accepted from API clients.
 */
enum EntityType: string
{
    case Business = 'business';
    case Place = 'place';
    case Event = 'event';
    case Story = 'story';
    case Collection = 'collection';
    case Area = 'area';
    case Category = 'category';
    case Venue = 'venue';
    case Organizer = 'organizer';
    case Review = 'review';
    case User = 'user';
    case Admin = 'admin';
    case Media = 'media';
    case Plan = 'plan';
    case Subscription = 'subscription';
    case Setting = 'setting';
    case SeoMeta = 'seo_meta';
    case Page = 'page';
    case Submission = 'submission';
    case BusinessClaim = 'business_claim';
    case AiRun = 'ai_run';
    case AiDiscovery = 'ai_discovery';

    /**
     * @return class-string<Model>
     */
    public function modelClass(): string
    {
        return match ($this) {
            self::Business => Business::class,
            self::Place => Place::class,
            self::Event => Event::class,
            self::Story => Story::class,
            self::Collection => Collection::class,
            self::Area => Area::class,
            self::Category => Category::class,
            self::Venue => Venue::class,
            self::Organizer => Organizer::class,
            self::Review => Review::class,
            self::User => User::class,
            self::Admin => Admin::class,
            self::Media => Media::class,
            self::Plan => Plan::class,
            self::Subscription => Subscription::class,
            self::Setting => Setting::class,
            self::SeoMeta => SeoMeta::class,
            self::Page => Page::class,
            self::Submission => Submission::class,
            self::BusinessClaim => BusinessClaim::class,
            self::AiRun => AiRun::class,
            self::AiDiscovery => AiDiscovery::class,
        };
    }

    /**
     * @return array<string, class-string>
     */
    public static function morphMap(): array
    {
        return collect(self::cases())->mapWithKeys(fn (self $t) => [$t->value => $t->modelClass()])->all();
    }

    /** @return list<self> */
    public static function reviewable(): array
    {
        return [self::Business, self::Place, self::Event];
    }

    /** @return list<self> */
    public static function favoritable(): array
    {
        return [self::Business, self::Place, self::Event, self::Story];
    }

    /** @return list<self> */
    public static function collectable(): array
    {
        return [self::Business, self::Place, self::Event, self::Story];
    }

    /** @return list<self> */
    public static function storyLinkable(): array
    {
        return [self::Business, self::Place, self::Event, self::Area];
    }

    /**
     * @param  list<self>  $types
     * @return list<string>
     */
    public static function values(array $types): array
    {
        return array_map(fn (self $t) => $t->value, $types);
    }
}
