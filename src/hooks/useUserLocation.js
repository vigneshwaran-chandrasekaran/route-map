import { useState, useEffect } from 'react';
import { DEFAULT_CENTER } from '../utils/geo';

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Showing default location.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable. Showing default location.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Showing default location.');
            break;
          default:
            setLocationError('Unable to get location. Showing default location.');
        }
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  return { userLocation, locationError, locationLoading, fallbackCenter: DEFAULT_CENTER };
}
