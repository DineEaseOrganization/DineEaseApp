// src/utils/reservationMapper.ts
import { ReservationDto, ReservationState } from '../types/api.types';
import { Reservation, Restaurant } from '../types';

/**
 * Maps backend ReservationDto to frontend Reservation type.
 *
 * Note: Since the backend doesn't include full restaurant details in the reservation,
 * we create a minimal Restaurant object. The full details should be fetched separately if needed.
 */
export function mapReservationDtoToReservation(
  dto: ReservationDto,
  restaurantData?: Partial<Restaurant>,
  reviewedReservationIds?: Set<number>
): Reservation {
  // Map backend state to frontend status
  const statusMap: Record<ReservationState, Reservation['status']> = {
    [ReservationState.CONFIRMED]: 'confirmed',
    [ReservationState.PENDING]: 'pending',
    [ReservationState.ON_HOLD]: 'on_hold',
    [ReservationState.CANCELLED]: 'cancelled_by_restaurant',
    [ReservationState.CANCELLED_BY_RESTAURANT]: 'cancelled_by_restaurant',
    [ReservationState.COMPLETED]: 'completed',
    [ReservationState.NO_SHOW]: 'no_show',
    [ReservationState.CHECKED_IN]: 'checked_in',
  };
  const rawState = dto.state as unknown as string;
  let mappedStatus = statusMap[dto.state as ReservationState];
  if (!mappedStatus && rawState) {
    if (rawState === 'CANCELLED_BY_RESTAURANT' || rawState === 'CANCELLED' || rawState === 'CANCELED') {
      mappedStatus = 'cancelled_by_restaurant';
    } else if (rawState === 'CANCELLED_BY_CUSTOMER' || rawState === 'CANCELLED_BY_USER') {
      mappedStatus = 'cancelled';
    }
  }

  // Create a minimal restaurant object (can be enhanced with full data if available)
  const restaurant: Restaurant = {
    id: dto.restaurantId,
    name: dto.restaurantName || restaurantData?.name || 'Restaurant', // Use name from DTO, fallback to restaurantData, then default
    cuisineType: restaurantData?.cuisineType || 'Unknown',
    address: restaurantData?.address || '',
    postCode: restaurantData?.postCode || '',
    country: restaurantData?.country || '',
    latitude: restaurantData?.latitude || 0,
    longitude: restaurantData?.longitude || 0,
    averageRating: restaurantData?.averageRating || 0,
    totalReviews: restaurantData?.totalReviews || 0,
    priceRange: restaurantData?.priceRange || '$$',
    coverImageUrl: restaurantData?.coverImageUrl || '',
    galleryImages: restaurantData?.galleryImages || [],
    description: restaurantData?.description || '',
    amenities: restaurantData?.amenities || [],
    phoneNumber: restaurantData?.phoneNumber || '',
    isActive: restaurantData?.isActive ?? true,
    acceptsReservations: restaurantData?.acceptsReservations ?? true,
  };

  return {
    id: dto.reservationId || 0,
    restaurant,
    date: dto.reservationDate, // Already in YYYY-MM-DD format
    time: dto.reservationStartTime, // Already in HH:mm format
    partySize: dto.partySize,
    customerName: dto.customer.name,
    customerPhone: dto.customer.phoneNumber,
    customerEmail: dto.customer.email,
    status: mappedStatus || 'pending',
    confirmationCode: `RES${dto.reservationId || '000000'}`, // Generate confirmation code from ID
    specialRequests: dto.comments,
    canReview: dto.state === ReservationState.COMPLETED
      && !(reviewedReservationIds?.has(dto.reservationId ?? 0) ?? false),
    tags: dto.tags,
    paymentAmount: dto.paymentAmount,
    paymentCurrency: dto.paymentCurrency,
    paymentTransactionType: dto.paymentTransactionType,
    paymentPolicyId: dto.paymentPolicyId,
  };
}

/**
 * Maps an array of ReservationDto to an array of Reservation.
 */
export function mapReservationDtosToReservations(
  dtos: ReservationDto[],
  restaurantDataMap?: Map<number, Partial<Restaurant>>,
  reviewedReservationIds?: Set<number>
): Reservation[] {
  return dtos.map(dto => {
    const restaurantData = restaurantDataMap?.get(dto.restaurantId);
    return mapReservationDtoToReservation(dto, restaurantData, reviewedReservationIds);
  });
}
