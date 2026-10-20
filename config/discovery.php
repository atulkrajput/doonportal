<?php

/*
|--------------------------------------------------------------------------
| Daily business discovery (AI data engine)
|--------------------------------------------------------------------------
|
| Every night the discovery run looks for businesses in Dehradun that are
| not on DoonPortal yet, a few per category, and queues them for staff
| review (Admin > AI discoveries). Limits and keys are set in Admin > AI
| settings; these are the fixed parts.
|
*/

return [

    // Dehradun city and its edges (south, west, north, east).
    'bbox' => [30.24, 77.92, 30.43, 78.14],

    // OpenStreetMap (Overpass API) servers, tried in order when one is busy.
    'overpass_urls' => array_values(array_filter([
        env('OVERPASS_URL'),
        'https://overpass-api.de/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
    ])),
    'tavily_url' => 'https://api.tavily.com/search',

    // Identifies us to OpenStreetMap's servers, as their usage policy asks.
    'user_agent' => 'DoonPortal/1.0 (+'.rtrim((string) env('APP_URL', 'https://doonportal.com'), '/').')',

    // Base pause when an OpenStreetMap server is busy (fair use of a free, shared service).
    'pause_ms' => (int) env('DISCOVERY_PAUSE_MS', 1500),

    // Hard ceiling regardless of the admin setting.
    'max_per_category' => 20,

    /*
     * Business category slug => where to look.
     *   osm:    OpenStreetMap tags (key=value) that mean this kind of place
     *   search: words for the web search ("<search> in Dehradun")
     * Categories without OSM tags are found by web search only.
     */
    'categories' => [
        'restaurants' => ['osm' => ['amenity=restaurant'], 'search' => 'restaurants'],
        'cafes' => ['osm' => ['amenity=cafe'], 'search' => 'cafes'],
        'bakeries' => ['osm' => ['shop=bakery', 'shop=pastry'], 'search' => 'bakeries'],
        'street-food' => ['osm' => ['amenity=fast_food', 'amenity=food_court'], 'search' => 'street food stalls'],
        'desserts' => ['osm' => ['amenity=ice_cream', 'shop=confectionery'], 'search' => 'dessert and sweet shops'],
        'cloud-kitchens' => ['osm' => [], 'search' => 'cloud kitchens'],
        'bars-pubs' => ['osm' => ['amenity=bar', 'amenity=pub', 'amenity=biergarten'], 'search' => 'bars and pubs'],
        'fashion' => ['osm' => ['shop=clothes', 'shop=shoes', 'shop=boutique', 'shop=fashion_accessories'], 'search' => 'clothing boutiques'],
        'jewellery' => ['osm' => ['shop=jewelry'], 'search' => 'jewellery shops'],
        'electronics' => ['osm' => ['shop=electronics', 'shop=mobile_phone', 'shop=computer'], 'search' => 'electronics and mobile shops'],
        'furniture' => ['osm' => ['shop=furniture'], 'search' => 'furniture shops'],
        'grocery' => ['osm' => ['shop=supermarket', 'shop=convenience', 'shop=greengrocer'], 'search' => 'grocery stores and supermarkets'],
        'local-brands' => ['osm' => [], 'search' => 'local brands and handicraft stores'],
        'gifts' => ['osm' => ['shop=gift', 'shop=craft'], 'search' => 'gift shops'],
        'markets-malls' => ['osm' => ['shop=mall', 'amenity=marketplace', 'shop=department_store'], 'search' => 'shopping malls and markets'],
        'electricians' => ['osm' => ['craft=electrician', 'shop=electrical'], 'search' => 'electricians'],
        'plumbers' => ['osm' => ['craft=plumber'], 'search' => 'plumbers'],
        'carpenters' => ['osm' => ['craft=carpenter'], 'search' => 'carpenters'],
        'ac-ro-repair' => ['osm' => ['craft=hvac'], 'search' => 'AC and RO repair services'],
        'cleaning-pest-control' => ['osm' => [], 'search' => 'cleaning and pest control services'],
        'accountants' => ['osm' => ['office=accountant', 'office=tax_advisor'], 'search' => 'chartered accountants'],
        'lawyers' => ['osm' => ['office=lawyer'], 'search' => 'lawyers and law firms'],
        'architects' => ['osm' => ['office=architect'], 'search' => 'architects'],
        'interior-designers' => ['osm' => ['shop=interior_decoration'], 'search' => 'interior designers'],
        'photographers' => ['osm' => ['craft=photographer', 'shop=photo'], 'search' => 'photographers and photo studios'],
        'digital-agencies' => ['osm' => ['office=advertising_agency', 'office=it'], 'search' => 'digital marketing and web design agencies'],
        'consultants' => ['osm' => ['office=consulting'], 'search' => 'business consultants'],
        'salons' => ['osm' => ['shop=hairdresser', 'shop=beauty'], 'search' => 'salons and beauty parlours'],
        'spas' => ['osm' => ['shop=massage', 'leisure=spa', 'amenity=spa'], 'search' => 'spas'],
        'gyms' => ['osm' => ['leisure=fitness_centre'], 'search' => 'gyms and fitness centres'],
        'yoga' => ['osm' => ['sport=yoga'], 'search' => 'yoga studios and centres'],
        'dance' => ['osm' => ['leisure=dance', 'amenity=dancing_school'], 'search' => 'dance classes and academies'],
        'car-bike-dealers' => ['osm' => ['shop=car', 'shop=motorcycle'], 'search' => 'car and bike showrooms'],
        'service-centres' => ['osm' => ['shop=car_repair', 'shop=motorcycle_repair'], 'search' => 'car and bike service centres'],
        'tyres' => ['osm' => ['shop=tyres'], 'search' => 'tyre shops'],
        'detailing-car-wash' => ['osm' => ['amenity=car_wash'], 'search' => 'car wash and detailing'],
        'schools' => ['osm' => ['amenity=school'], 'search' => 'schools'],
        'colleges' => ['osm' => ['amenity=college', 'amenity=university'], 'search' => 'colleges and universities'],
        'coaching' => ['osm' => ['amenity=prep_school'], 'search' => 'coaching institutes'],
        'tuition' => ['osm' => [], 'search' => 'tuition centres'],
        'training-centres' => ['osm' => ['amenity=training'], 'search' => 'skill training centres'],
        'hospitals' => ['osm' => ['amenity=hospital'], 'search' => 'hospitals'],
        'clinics' => ['osm' => ['amenity=clinic', 'healthcare=clinic'], 'search' => 'clinics'],
        'doctors' => ['osm' => ['amenity=doctors'], 'search' => 'doctors clinics'],
        'dentists' => ['osm' => ['amenity=dentist'], 'search' => 'dental clinics'],
        'diagnostic-centres' => ['osm' => ['healthcare=laboratory', 'healthcare=sample_collection'], 'search' => 'diagnostic centres and pathology labs'],
        'pharmacies' => ['osm' => ['amenity=pharmacy', 'healthcare=pharmacy'], 'search' => 'pharmacies and chemists'],
        'hotels' => ['osm' => ['tourism=hotel', 'tourism=motel'], 'search' => 'hotels'],
        'homestays' => ['osm' => ['tourism=guest_house', 'tourism=hostel'], 'search' => 'homestays and guest houses'],
    ],

    // Healthcare listings get a "check carefully" flag in the review queue.
    'sensitive_categories' => ['hospitals', 'clinics', 'doctors', 'dentists', 'diagnostic-centres', 'pharmacies'],

    // Directories and aggregators: never a business's own page, so not used as evidence.
    'ignored_domains' => [
        'justdial.com', 'sulekha.com', 'indiamart.com', 'tripadvisor.com', 'tripadvisor.in', 'zomato.com', 'swiggy.com',
        'magicpin.in', 'google.com', 'facebook.com', 'instagram.com', 'youtube.com', 'wikipedia.org', 'quora.com',
        'reddit.com', 'yelp.com', 'makemytrip.com', 'booking.com', 'goibibo.com', 'practo.com', 'lybrate.com',
    ],

];
