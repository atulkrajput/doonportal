<?php

namespace Database\Seeders;

use App\Enums\EventStatus;
use App\Enums\PublicationStatus;
use App\Enums\StoryType;
use App\Models\Area;
use App\Models\Business;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Event;
use App\Models\Organizer;
use App\Models\Place;
use App\Models\Story;
use App\Models\Venue;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * FICTIONAL demo content for local development and UI review only.
 *
 * Every record is named "Demo …", flagged metadata.demo = true (the UI shows a
 * "Demo data" badge), left UNVERIFIED and given no phone numbers or real-world
 * claims. Refuses to run in production.
 *
 *   php artisan db:seed --class=DemoDataSeeder
 */
class DemoDataSeeder extends Seeder
{
    private const META = ['demo' => true];

    /** Approximate city centre; demo markers are scattered around it. */
    private const CENTER = [30.3165, 78.0322];

    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('DemoDataSeeder must never run in production.');
        }

        $this->call([RolePermissionSeeder::class, AreaSeeder::class, CategorySeeder::class]);

        if (Business::where('metadata->demo', true)->exists()) {
            $this->command?->info('Demo data already present; skipping.');

            return;
        }

        $areas = Area::orderBy('sort_order')->get()->values();
        $area = fn (int $i) => $areas[$i % $areas->count()];
        $cat = fn (string $slug) => Category::where('slug', $slug)->firstOrFail();

        $businessSpecs = [
            ['Demo Hillside Brew', 'cafes', 'A fictional cafe used to preview the DoonPortal layout.', 2],
            ['Demo Valley Kitchen', 'restaurants', 'A fictional family restaurant for demo purposes.', 3],
            ['Demo Morning Bakes', 'bakeries', 'A fictional bakery listing for UI testing.', 1],
            ['Demo Ridge Fitness', 'gyms', 'A fictional gym used to preview service listings.', 2],
            ['Demo Pine Books & Gifts', 'gifts', 'A fictional gift shop for demo purposes.', 2],
            ['Demo Clocktower Diner', 'restaurants', 'A fictional diner used to preview the Eat section.', 2],
            ['Demo Riverside Clinic', 'clinics', 'A fictional clinic listing. Not a real healthcare provider.', null],
            ['Demo Green Leaf Cafe', 'cafes', 'A fictional cafe used to preview filters.', 1],
        ];

        foreach ($businessSpecs as $i => [$name, $category, $description, $price]) {
            $business = Business::create([
                'name' => $name,
                'description' => $description,
                'tagline' => 'Demo listing — not a real business',
                'is_published' => true,
                'is_featured' => $i < 2,
                'primary_area_id' => $area($i)->id,
                'latitude' => self::CENTER[0] + (($i % 4) - 1.5) * 0.012,
                'longitude' => self::CENTER[1] + (intdiv($i, 4) - 0.5) * 0.02,
                'price_range' => $price,
                'opened_on' => $i % 3 === 0 ? now()->subDays(20 + $i)->toDateString() : null,
                'source_name' => 'Demo seed data',
                'metadata' => self::META,
            ]);
            $business->forceFill(['popularity_score' => 100 - $i * 7, 'rating_avg' => [4.5, 4.2, 3.9, 4.7, 4.0, 3.6, 0, 4.1][$i], 'rating_count' => $i === 6 ? 0 : 3 + $i])->save();
            $business->categories()->attach($cat($category), ['is_primary' => true]);
            $business->areas()->attach($area($i));

            foreach (range(0, 6) as $day) {
                $business->hours()->create($day === 1 && $i % 2
                    ? ['day_of_week' => $day, 'is_closed' => true]
                    : ['day_of_week' => $day, 'opens_at' => '09:00', 'closes_at' => $i === 5 ? '01:00' : '21:00']);
            }
            $business->services()->create(['name' => 'Demo service', 'description' => 'Placeholder service for layout testing.']);
        }

        $placeSpecs = [
            ['Demo Sunset Viewpoint', 'viewpoints', true],
            ['Demo Forest Trail', 'walking-trails', true],
            ['Demo Heritage House', 'heritage-buildings', false],
            ['Demo Riverside Park', 'parks-gardens', true],
        ];
        foreach ($placeSpecs as $i => [$name, $category, $free]) {
            $place = Place::create([
                'name' => $name,
                'summary' => 'A fictional place used to preview DoonPortal.',
                'description' => 'This is demo content. It does not describe a real location.',
                'status' => PublicationStatus::Published,
                'published_at' => now()->subDays(5),
                'primary_area_id' => $area($i + 3)->id,
                'latitude' => self::CENTER[0] + 0.03 + $i * 0.01,
                'longitude' => self::CENTER[1] + 0.02 - $i * 0.015,
                'is_free' => $free,
                'entry_fee_min_paise' => $free ? null : 5000,
                'metadata' => self::META,
            ]);
            $place->categories()->attach($cat($category));
            $place->areas()->attach($area($i + 3));
        }

        $venue = Venue::create(['name' => 'Demo Community Hall', 'area_id' => $area(0)->id]);
        $organizer = Organizer::create(['name' => 'Demo Events Collective', 'description' => 'Fictional organizer.']);
        $eventSpecs = [
            ['Demo Acoustic Evening', 'music-events', 3, true],
            ['Demo Pottery Workshop', 'workshops', 6, false],
            ['Demo Kids Science Fair', 'kids-events', 10, true],
            ['Demo Food Walk', 'food-events', 15, false],
        ];
        foreach ($eventSpecs as $i => [$title, $category, $inDays, $free]) {
            $start = now('Asia/Kolkata')->addDays($inDays)->setTime(18, 0)->utc();
            $event = Event::create([
                'title' => $title,
                'summary' => 'A fictional event used to preview the Events section.',
                'description' => 'Demo content only. This event is not real.',
                'starts_at' => $start,
                'ends_at' => $start->copy()->addHours(3),
                'venue_id' => $venue->id,
                'area_id' => $area($i)->id,
                'organizer_id' => $organizer->id,
                'is_free' => $free,
                'price_min_paise' => $free ? null : 49900,
                'metadata' => self::META,
            ]);
            $event->forceFill(['status' => EventStatus::Published, 'published_at' => now()])->save();
            $event->categories()->attach($cat($category));
        }

        $story = Story::create([
            'type' => StoryType::Guide,
            'title' => 'Demo Guide: A Weekend Around Doon',
            'excerpt' => 'Fictional guide used to preview the Stories section.',
            'body' => '<p>This is demo content. It links to demo listings only.</p>',
            'status' => PublicationStatus::Published,
            'published_at' => now()->subDay(),
            'reading_minutes' => 3,
            'metadata' => self::META,
        ]);
        $story->categories()->attach($cat('culture-environment'));
        $story->entityLinks()->create(['entity_type' => 'business', 'entity_id' => Business::where('name', 'Demo Hillside Brew')->value('id')]);
        $story->entityLinks()->create(['entity_type' => 'area', 'entity_id' => $area(0)->id]);

        $collection = Collection::create([
            'title' => 'Demo: Cafes to Preview',
            'description' => 'A fictional collection showing how Best of Doon lists render.',
            'selection_criteria' => 'Demo records only; no real ranking.',
            'status' => PublicationStatus::Published,
            'published_at' => now()->subDay(),
            'is_featured' => true,
            'metadata' => self::META,
        ]);
        Business::whereHas('categories', fn ($q) => $q->where('slug', 'cafes'))->get()
            ->each(fn ($b, $i) => $collection->items()->create(['item_type' => 'business', 'item_id' => $b->id, 'position' => $i + 1]));
    }
}
