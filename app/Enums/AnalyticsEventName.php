<?php

namespace App\Enums;

enum AnalyticsEventName: string
{
    case SearchPerformed = 'search_performed';
    case BusinessViewed = 'business_viewed';
    case BusinessPhoneClicked = 'business_phone_clicked';
    case BusinessWhatsappClicked = 'business_whatsapp_clicked';
    case DirectionsClicked = 'directions_clicked';
    case BusinessWebsiteClicked = 'business_website_clicked';
    case EventViewed = 'event_viewed';
    case EventTicketClicked = 'event_ticket_clicked';
    case PlaceViewed = 'place_viewed';
    case StoryRead = 'story_read';
    case BusinessSaved = 'business_saved';
    case EventSaved = 'event_saved';
    case ReviewSubmitted = 'review_submitted';
    case BusinessClaimed = 'business_claimed';
    case OfferClicked = 'offer_clicked';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
