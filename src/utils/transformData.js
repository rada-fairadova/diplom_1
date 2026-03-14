export const transformRouteData = (apiRoute) => {
  if (!apiRoute) return null;

  return {
    id: apiRoute.departure?._id || apiRoute._id,
    trainNumber: apiRoute.departure?.train?._id || apiRoute.train?.name,
    routeName: `${apiRoute.departure?.from?.city?.name} → ${apiRoute.departure?.to?.city?.name}`,
    from: {
      city: apiRoute.departure?.from?.city?.name,
      station: apiRoute.departure?.from?.railway_station_name,
      date: apiRoute.departure?.from?.datetime,
    },
    to: {
      city: apiRoute.departure?.to?.city?.name,
      station: apiRoute.departure?.to?.railway_station_name,
      date: apiRoute.departure?.to?.datetime,
    },
    duration: apiRoute.departure?.duration,
    minPrice: getMinPriceFromRoute(apiRoute),
    availableClasses: {
      first: apiRoute.departure?.have_first_class,
      second: apiRoute.departure?.have_second_class,
      third: apiRoute.departure?.have_third_class,
      fourth: apiRoute.departure?.have_fourth_class,
    },
    amenities: {
      wifi: apiRoute.departure?.have_wifi,
      conditioner: apiRoute.departure?.have_air_conditioning,
      linens: apiRoute.departure?.have_linens_included,
      express: apiRoute.departure?.have_express,
    },
    priceInfo: apiRoute.departure?.price_info,
    seatsInfo: apiRoute.departure?.available_seats_info,
  };
};

export const transformSeatsData = (apiSeats) => {
  if (!apiSeats) return null;

  return {
    totalSeats: apiSeats.total_seats,
    availableSeats: apiSeats.available_seats,
    coaches: apiSeats.coaches?.map(coach => ({
      id: coach._id,
      number: coach.coach.number,
      classType: coach.coach.class_type,
      seats: coach.seats.map(seat => ({
        number: seat.seat_number,
        available: seat.available,
        price: seat.price,
      })),
    })) || [],
  };
};

export const getMinPriceFromRoute = (apiRoute) => {
  const priceInfo = apiRoute.departure?.price_info || apiRoute.price_info;
  if (!priceInfo) return 0;

  const prices = [
    priceInfo.first?.bottom_price,
    priceInfo.second?.bottom_price,
    priceInfo.third?.bottom_price,
    priceInfo.fourth?.bottom_price,
  ].filter(price => price !== undefined && price !== null && price > 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} ч ${mins} мин`;
};

export const formatDateTime = (dateTimeString) => {
  const date = new Date(dateTimeString);
  return {
    date: date.toLocaleDateString('ru-RU'),
    time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleString('ru-RU'),
  };
};
