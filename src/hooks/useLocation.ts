import { useState, useEffect } from "react";
import * as Location from "expo-location";

// Define the location type
interface LocationData {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

/**
 * Named export version – matches your previous usage:
 * import { useLocation } from "../../hooks/useLocation";
 */
export function useLocation() {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(true);

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
                    setLoading(false);
                    return;
                }

                // ⭐ Watcher keeps updating as emulator GPS changes
                watcher = await Location.watchPositionAsync(
                  {
                      accuracy: Location.Accuracy.Highest,
                      timeInterval: 1000, // every 1 sec
                      distanceInterval: 1, // update if moved 1 meter
                  },
                  (pos) => {
                      setLocation({
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                          latitudeDelta: 0.04,
                          longitudeDelta: 0.04,
                      });

                      setLoading(false);
                  }
                );
            } catch (err) {
                console.log("Location error → using fallback", err);
                setLocation(fallbackLocation);
                setLoading(false);
            }
        })();

        return () => {
            watcher?.remove();
        };
    }, []);

    return { location, loading };
}