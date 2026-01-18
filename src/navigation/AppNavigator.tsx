// src/navigation/AppNavigator.tsx
import React from 'react';
import {NavigationContainer, RouteProp} from '@react-navigation/native';
import {createStackNavigator, StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp, createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {navigationRef} from '../utils/navigationHelper';

import RestaurantListScreen from '../screens/restaurants/RestaurantListScreen';
import RestaurantDetailScreen from '../screens/restaurants/RestaurantDetailScreen';
import BookingScreen from '../screens/booking/BookingScreen';
import BookingConfirmationScreen from '../screens/booking/BookingConfirmationScreen';
import BookingsScreen from '../screens/booking/BookingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ReviewScreen from '../screens/reviews/ReviewScreen';
import AllReviewsScreen from '../screens/reviews/AllReviewsScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen';
import UpdatesScreen from '../screens/updates/UpdatesScreen';
import SearchScreen from "../screens/restaurants/RestaurantSearchScreen";
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ProtectedScreenWithNavigation from '../components/ProtectedScreenWithNavigation';

import {Reservation, Restaurant} from '../types';
import DevicesScreen from "../screens/profile/DevicesScreen";
import CommunicationsScreen from "../screens/profile/CommunicationsScreen";
import YourDetailsScreen from "../screens/profile/YourDetailsScreen";
import AccountSettingsScreen from "../screens/profile/AccountSettings";
import ChangePasswordScreen from "../screens/profile/ChangePasswordScreen";
import DeleteAccountScreen from "../screens/profile/DeleteAccountScreen";
import CuisineRestaurantsScreen from '../screens/restaurants/CuisineRestaurantsScreen';
import NearbyRestaurantsScreen from "../screens/restaurants/NearbyRestaurantsScreen";

// Define the parameter lists for type safety
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  RestaurantDetail: { restaurant: Restaurant };
  BookingScreen: { restaurant: Restaurant; selectedDate: Date; partySize: number };
  BookingConfirmation: {
    booking: {
      restaurant: Restaurant;
      date: Date;
      time: string;
      partySize: number;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      specialRequests?: string;
      confirmationCode: string;
    };
  };
  ReviewScreen: { reservation: Reservation };
};

export type DiscoverStackParamList = {
  RestaurantList: undefined;
  CuisineRestaurants: {  // Add this
    cuisineType: string;
    latitude: number;
    longitude: number;
    radius?: number;
  };
  NearbyRestaurants: {
        latitude: number;
        longitude: number;
        radius?: number;
    };
    RestaurantDetail: { restaurant: Restaurant; partySize?: number; selectedDate?: Date; selectedTime?: string };
  BookingScreen: { restaurant: Restaurant; selectedDate: Date; partySize: number; selectedTime?: string };
  BookingConfirmation: {
    booking: {
      restaurant: Restaurant;
      date: Date;
      time: string;
      partySize: number;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      specialRequests?: string;
      confirmationCode: string;
    };
  };
  ReviewScreen: { reservation: Reservation };
};

export type SearchStackParamList = {
  SearchMap: undefined;
  RestaurantSearch: undefined;
  RestaurantDetail: { restaurant: Restaurant };
  BookingScreen: { restaurant: Restaurant; selectedDate: Date; partySize: number };
};

export type BookingsStackParamList = {
  BookingsList: undefined;
  BookingConfirmation: {
    booking: {
      restaurant: Restaurant;
      date: Date;
      time: string;
      partySize: number;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      specialRequests?: string;
      confirmationCode: string;
    };
  };
  ReviewScreen: { reservation: Reservation };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  AllReviews: undefined;
  Favorites: undefined;
  AccountSettings: undefined;
  YourDetails: undefined;
  Communications: undefined;
  Devices: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
};

export type UpdatesStackParamList = {
  UpdatesList: undefined;
};

export type TabParamList = {
  Discover: undefined;
  Search: undefined;
  Updates: undefined;
  Bookings: undefined;
  Profile: undefined;
};

// Navigation prop types for screens
export type RestaurantListScreenNavigationProp = StackNavigationProp<DiscoverStackParamList, 'RestaurantList'>;
export type RestaurantDetailScreenNavigationProp = StackNavigationProp<DiscoverStackParamList, 'RestaurantDetail'>;
export type BookingScreenNavigationProp = StackNavigationProp<DiscoverStackParamList, 'BookingScreen'>;
export type BookingConfirmationScreenNavigationProp = StackNavigationProp<DiscoverStackParamList, 'BookingConfirmation'>;
export type ReviewScreenNavigationProp = StackNavigationProp<DiscoverStackParamList, 'ReviewScreen'>;

export type SearchScreenNavigationProp = StackNavigationProp<SearchStackParamList, 'SearchMap'>;
export type UpdatesScreenNavigationProp = BottomTabNavigationProp<TabParamList>;
export type BookingsScreenNavigationProp = StackNavigationProp<BookingsStackParamList, 'BookingsList'>;

export type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;
export type AllReviewsScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'AllReviews'>;
export type FavoritesScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Favorites'>;

// Route prop types for screens
export type RestaurantDetailScreenRouteProp = RouteProp<DiscoverStackParamList, 'RestaurantDetail'>;
export type BookingScreenRouteProp = RouteProp<DiscoverStackParamList, 'BookingScreen'>;
export type BookingConfirmationScreenRouteProp = RouteProp<DiscoverStackParamList, 'BookingConfirmation'>;
export type ReviewScreenRouteProp = RouteProp<DiscoverStackParamList, 'ReviewScreen'>;

// Combined props types for screens
export interface RestaurantListScreenProps {
  navigation: RestaurantListScreenNavigationProp;
}

export interface RestaurantDetailScreenProps {
  navigation: RestaurantDetailScreenNavigationProp;
  route: RestaurantDetailScreenRouteProp;
}

export interface BookingScreenProps {
  navigation: BookingScreenNavigationProp;
  route: BookingScreenRouteProp;
}

export interface BookingConfirmationScreenProps {
  navigation: BookingConfirmationScreenNavigationProp;
  route: BookingConfirmationScreenRouteProp;
}

export interface ReviewScreenProps {
  navigation: ReviewScreenNavigationProp;
  route: ReviewScreenRouteProp;
}

export interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
}

export interface UpdatesScreenProps {
  navigation: UpdatesScreenNavigationProp;
}

export interface BookingsScreenProps {
  navigation: BookingsScreenNavigationProp;
}

export interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

export interface AllReviewsScreenProps {
  navigation: AllReviewsScreenNavigationProp;
}

export interface FavoritesScreenProps {
  navigation: FavoritesScreenNavigationProp;
}

// Create navigators
const RootStack = createStackNavigator<RootStackParamList>();
const DiscoverStack = createStackNavigator<DiscoverStackParamList>();
const SearchStack = createStackNavigator<SearchStackParamList>();
const BookingsStack = createStackNavigator<BookingsStackParamList>();
const ProfileStackNav = createStackNavigator<ProfileStackParamList>();
const UpdatesStack = createStackNavigator<UpdatesStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Discover Stack Navigator (Public)
const DiscoverStackNavigator: React.FC = () => {
  return (
    <DiscoverStack.Navigator>
      <DiscoverStack.Screen
        name="RestaurantList"
        component={RestaurantListScreen}
        options={{headerShown: false}}
      />
      <DiscoverStack.Screen
        name="CuisineRestaurants"
        component={CuisineRestaurantsScreen}
        options={({route}) => ({
            title: `${route.params.cuisineType} Restaurants`,
        })}
      />
        <DiscoverStack.Screen
            name="NearbyRestaurants"
            component={NearbyRestaurantsScreen}
            options={{ title: "Nearby Restaurants" }}
        />

        <DiscoverStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{headerShown: false}}
      />
      <DiscoverStack.Screen
        name="BookingScreen"
        component={BookingScreen}
        options={{headerShown: false}}
      />
      <DiscoverStack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{headerShown: false}}
      />
      <DiscoverStack.Screen
        name="ReviewScreen"
        component={ReviewScreen}
        options={{headerShown: false}}
      />
    </DiscoverStack.Navigator>
  );
};

// Search Stack Navigator (Public)
const SearchStackNavigator: React.FC = () => {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="SearchMap"
        component={SearchScreen}
        options={{headerShown: false}}
      />
      <SearchStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{headerShown: false}}
      />
      <SearchStack.Screen
        name="BookingScreen"
        component={BookingScreen}
        options={{headerShown: false}}
      />
    </SearchStack.Navigator>
  );
};

// Protected Updates Stack Navigator
const ProtectedUpdatesStackNavigator: React.FC = () => {
  return (
    <ProtectedScreenWithNavigation
      title="Stay Updated"
      description="Sign in to receive personalized notifications about your reservations, restaurant updates, and special offers."
      icon="🔔"
    >
      <UpdatesStack.Navigator>
        <UpdatesStack.Screen
          name="UpdatesList"
          component={UpdatesScreen}
          options={{headerShown: false}}
        />
      </UpdatesStack.Navigator>
    </ProtectedScreenWithNavigation>
  );
};

// Protected Bookings Stack Navigator
const ProtectedBookingsStackNavigator: React.FC = () => {
  return (
    <ProtectedScreenWithNavigation
      title="Your Reservations"
      description="Sign in to view and manage your restaurant reservations, past visits, and booking history."
      icon="📅"
    >
      <BookingsStack.Navigator>
        <BookingsStack.Screen
          name="BookingsList"
          component={BookingsScreen}
          options={{headerShown: false}}
        />
      </BookingsStack.Navigator>
    </ProtectedScreenWithNavigation>
  );
};

// Protected Profile Stack Navigator
const ProtectedProfileStackNavigator: React.FC = () => {
  return (
    <ProtectedScreenWithNavigation
      title="Your Profile"
      description="Sign in to access your personal profile, reviews, favorite restaurants, and account settings."
      icon="👤"
    >
      <ProfileStackNav.Navigator>
        <ProfileStackNav.Screen
          name="ProfileMain"
          component={ProfileScreen}
          options={{headerShown: false}}
        />
        <ProfileStackNav.Screen
          name="AllReviews"
          component={AllReviewsScreen}
          options={{headerShown: false}}
        />
        <ProfileStackNav.Screen
          name="Favorites"
          component={FavoritesScreen}
          options={{headerShown: false}}
        />
        <ProfileStackNav.Screen
          name="AccountSettings"
          component={AccountSettingsScreen}
          options={{headerShown: false}}
        />
        <ProfileStackNav.Screen
          name="YourDetails"
          component={YourDetailsScreen}
          options={{headerShown: false}}
        />
        <ProfileStackNav.Screen
          name="Communications"
          component={CommunicationsScreen}
          options={{headerShown: false}}
        />
        <ProfileStackNav.Screen
          name="Devices"
          component={DevicesScreen}
          options={{headerShown: false}}
        />
        <ProfileStackNav.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{headerShown: false}}
        />
        <ProfileStackNav.Screen
          name="DeleteAccount"
          component={DeleteAccountScreen}
          options={{headerShown: false}}
        />
      </ProfileStackNav.Navigator>
    </ProtectedScreenWithNavigation>
  );
};

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverStackNavigator}
        options={{
          tabBarIcon: ({color}) => (
            <Text style={{color, fontSize: 20}}>🍽️</Text>
          ),
          tabBarLabel: 'Discover',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarIcon: ({color}) => (
            <Text style={{color, fontSize: 20}}>🗺️</Text>
          ),
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="Updates"
        component={ProtectedUpdatesStackNavigator}
        options={{
          tabBarIcon: ({color}) => (
            <Text style={{color, fontSize: 20}}>🔔</Text>
          ),
          tabBarLabel: 'Updates',
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={ProtectedBookingsStackNavigator}
        options={{
          tabBarIcon: ({color}) => (
            <Text style={{color, fontSize: 20}}>📅</Text>
          ),
          tabBarLabel: 'Bookings',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProtectedProfileStackNavigator}
        options={{
          tabBarIcon: ({color}) => (
            <Text style={{color, fontSize: 20}}>👤</Text>
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator with Auth Screens
const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        <RootStack.Screen
          name="MainTabs"
          component={MainTabNavigator}
        />
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <RootStack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <RootStack.Screen
          name="EmailVerification"
          component={EmailVerificationScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <RootStack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <RootStack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </RootStack.Navigator>

    </NavigationContainer>
  );
};

export default AppNavigator;