import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  INITIAL_USER_LOCATION_STATE,
  type UserLocationState,
} from "#/lib/user-location";

interface UserLocationContextValue {
  setUserLocation: Dispatch<SetStateAction<UserLocationState>>;
  userLocation: UserLocationState;
}

const UserLocationContext = createContext<UserLocationContextValue | null>(
  null,
);

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<UserLocationState>(
    INITIAL_USER_LOCATION_STATE,
  );

  const value = useMemo(
    () => ({
      setUserLocation,
      userLocation,
    }),
    [userLocation],
  );

  return (
    <UserLocationContext.Provider value={value}>
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocation() {
  const context = useContext(UserLocationContext);

  if (!context) {
    throw new Error("useUserLocation must be used within UserLocationProvider");
  }

  return context;
}
