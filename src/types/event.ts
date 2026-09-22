export type ContestType = 'GOLD' | 'SILVER' | 'BRONZE';

export interface EventCard {
  id: number;
  title: string;
  contestType: ContestType;
  gameName: string;
  countdownTime: string;
  coins: number;
  imageUrl: string;
  gameImageUrl: string;
}

export interface EventCarouselState {
  activeIndex: number;
  cards: EventCard[];
}
