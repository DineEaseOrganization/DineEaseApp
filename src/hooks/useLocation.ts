import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";

// Define the location type
export interface LocationData {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

export interface UseLocationReturn {
    location: LocationData | null;
    loading: boolean;
    refreshLocation: () => Promise<void>;
    isUsingDefault: boolean;
}

// ~50 m at typical latitudes. iOS GPS jitter sits well below this, so the
// emitted location object stays referentially stable until the user actually moves.
const MOVEMENT_THRESHOLD_DEGREES = 0.00045;

/**
 * Named export version – matches your previous usage:
 * import { useLocation } from "../../hooks/useLocation";
 */
export function useLocation(): UseLocationReturn {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUsingDefault, setIsUsingDefault] = useState(false);
    const lastEmittedRef = useRef<{ lat: number; lng: number } | null>(null);

    // Used ONLY when GPS fails completely
    const fallbackLocation: LocationData = {
        latitude: 35.1856,
        longitude: 33.3823,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
    };

    useEffect(() => {
        let watcher: Location.LocationSubscription | null = null;

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();

                if (status !== "granted") {
                    console.warn("Location denied → using fallback");
                    setLocation(fallbackLocation);
                    setIsUsingDefault(true);
                    setLoading(false);
                    return;
                }

                watcher = await Location.watchPositionAsync(
                  {
                      accuracy: Location.Accuracy.Balanced,
                      timeInterval: 10000,
                      distanceInterval: 50,
                  },
                  (pos) => {
                      const lat = pos.coords.latitude;
                      const lng = pos.coords.longitude;
                      const last = lastEmittedRef.current;
                      const moved =
                          !last ||
                          Math.abs(last.lat - lat) > MOVEMENT_THRESHOLD_DEGREES ||
                          Math.abs(last.lng - lng) > MOVEMENT_THRESHOLD_DEGREES;

                      if (moved) {
                          lastEmittedRef.current = { lat, lng };
                          setLocation({
                              latitude: lat,
                              longitude: lng,
                              latitudeDelta: 0.04,
                              longitudeDelta: 0.04,
                          });
                      }

                      setLoading(false);
                  }
                );
            } catch (err) {
                console.log("Location error → using fallback", err);
                setLocation(fallbackLocation);
                setIsUsingDefault(true);
                setLoading(false);
            }
        })();

        return () => {
            watcher?.remove();
        };
    }, []);

    const refreshLocation = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const pos = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                lastEmittedRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04,
                });
                setIsUsingDefault(false);
            } else {
                setLocation(fallbackLocation);
                setIsUsingDefault(true);
            }
        } catch (err) {
            console.log("Refresh location error", err);
            setLocation(fallbackLocation);
            setIsUsingDefault(true);
        } finally {
            setLoading(false);
        }
    };

    return { location, loading, refreshLocation, isUsingDefault };
}