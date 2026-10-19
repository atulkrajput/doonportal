<?php

namespace Database\Seeders;

use App\Enums\CategoryType;
use App\Models\Category;
use Illuminate\Database\Seeder;

/**
 * Category taxonomy from the product blueprint. Idempotent (keyed by slug).
 */
class CategorySeeder extends Seeder
{
    /**
     * type => [parent name => [slug overrides allowed via "Name|slug"]]
     */
    public const TREE = [
        'business' => [
            'Food & Drink|food-drink' => ['Restaurants', 'Cafes', 'Bakeries', 'Street Food', 'Desserts', 'Cloud Kitchens', 'Bars & Pubs|bars-pubs'],
            'Shopping' => ['Fashion', 'Jewellery', 'Electronics', 'Furniture', 'Grocery', 'Local Brands', 'Gifts', 'Markets & Malls|markets-malls'],
            'Home Services' => ['Electricians', 'Plumbers', 'Carpenters', 'AC & RO Repair|ac-ro-repair', 'Cleaning & Pest Control|cleaning-pest-control'],
            'Professional Services' => ['Accountants', 'Lawyers', 'Architects', 'Interior Designers', 'Photographers', 'Digital Agencies', 'Consultants'],
            'Lifestyle & Fitness|lifestyle' => ['Salons', 'Spas', 'Gyms', 'Yoga', 'Dance'],
            'Automotive' => ['Car & Bike Dealers|car-bike-dealers', 'Service Centres', 'Tyres', 'Detailing & Car Wash|detailing-car-wash'],
            'Education' => ['Schools', 'Colleges', 'Coaching', 'Tuition', 'Training Centres'],
            'Healthcare' => ['Hospitals', 'Clinics', 'Doctors', 'Dentists', 'Diagnostic Centres', 'Pharmacies'],
            'Hotels & Stays|hotels-stays' => ['Hotels', 'Homestays'],
        ],
        'place' => [
            'Attractions|attractions' => [],
            'Nature|nature' => ['Parks & Gardens|parks-gardens', 'Waterfalls', 'Lakes', 'Viewpoints', 'Walking Trails'],
            'Spiritual|spiritual-places' => ['Temples', 'Monasteries'],
            'Heritage & Culture|heritage-culture' => ['Museums', 'Heritage Buildings'],
            'Leisure|leisure' => ['Photography Spots', 'Picnic Spots'],
        ],
        'event' => [
            'Music|music-events' => [], 'Comedy|comedy-events' => [], 'Theatre|theatre-events' => [],
            'Workshops|workshops' => [], 'Kids|kids-events' => [], 'Sports|sports-events' => [],
            'Food|food-events' => [], 'Exhibitions|exhibitions' => [], 'Networking|networking-events' => [],
            'Cultural|cultural-events' => [], 'Spiritual|spiritual-events' => [], 'Educational|educational-events' => [],
            'Community|community-events' => [],
        ],
        'story' => [
            'People of Doon|people-of-doon' => [], 'Local Entrepreneurs|local-entrepreneurs' => [],
            'Food & Local Brands|food-local-brands' => [], 'Artists & Creators|artists-creators' => [],
            'Startups|startups' => [], 'Schools & Sports|schools-sports' => [],
            'Culture & Environment|culture-environment' => [], 'Old Doon & Heritage|old-doon-heritage' => [],
        ],
    ];

    public function run(): void
    {
        foreach (self::TREE as $type => $parents) {
            $p = 0;
            foreach ($parents as $parentSpec => $children) {
                $parent = $this->upsert(CategoryType::from($type), $parentSpec, null, $p++);
                foreach ($children as $c => $childSpec) {
                    $this->upsert(CategoryType::from($type), $childSpec, $parent->id, $c);
                }
            }
        }
    }

    private function upsert(CategoryType $type, string $spec, ?string $parentId, int $order): Category
    {
        [$name, $slug] = array_pad(explode('|', $spec, 2), 2, null);
        $slug ??= str($name)->slug()->value();

        return Category::withTrashed()->updateOrCreate(
            ['slug' => $slug],
            ['name' => $name, 'type' => $type, 'parent_id' => $parentId, 'sort_order' => $order]
        );
    }
}
