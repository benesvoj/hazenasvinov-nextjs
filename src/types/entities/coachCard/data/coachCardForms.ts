/**
 * Form data for creating/editing coach card
 */
export interface CoachCardFormData {
  name: string;
  surname: string;
  email: string;
  phone: string;
  note: string;
  /**
   * Array of category UUIDs to publish the card to.
   * Empty array = card is not published anywhere (private).
   */
  published_categories: string[];
}
