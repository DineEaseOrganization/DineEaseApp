// src/navigation/AppNavigator.tsx
import React from 'react';
import {NavigationContainer, RouteProp} from '@react-navigation/native';
import {createStackNavigator, StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp, createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';

// Import screens
import RestaurantListScreen from '../screens/restaurants/RestaurantListScreen';
import RestaurantDetailScreen from '../screens/restaurants/RestaurantDetailScreen';
import BookingScreen from '../screens/booking/BookingScreen';
import BookingConfirmationScreen from '../screens/booking/BookingConfirmationScreen';
import BookingsScreen from '../screens/booking/BookingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ReviewScreen from '../screens/reviews/ReviewScreen';
import AllReviewsScreen from '../screens/reviews/AllReviewsScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen';
import UpdatesScreen from '../screens/updates/UpdatesScreen'; // Add this import
// Import types
import {Reservation, Restaurant} from '../types';
import SearchScreen from "../screens/restaurants/RestaurantSearchScreen";

// Define the parameter lists for type safety
export type RootStackParamList = {
    RestaurantList: undefined;
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

export type SearchStackParamList = {
    SearchMap: undefined;
    RestaurantDetail: { restaurant: Restaurant };
    BookingScreen: { restaurant: Restaurant; selectedDate: Date; partySize: number };
};

export type BookingsStackParamList = {
    BookingsList: undefined;
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    AllReviews: undefined;
    Favorites: undefined;
};

// Add Updates stack
export type UpdatesStackParamList = {
    UpdatesList: undefined;
};

export type TabParamList = {
    Discover: {
        screen?: string;
        params?: any;
    } | undefined;
    Search: {
        screen?: string;
        params?: any;
    } | undefined;
    Updates: undefined; // Add this line
    Bookings: undefined;
    Profile: undefined;
};

// Navigation prop types for screens
export type RestaurantListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RestaurantList'>;
export type RestaurantDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RestaurantDetail'>;
export type BookingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookingScreen'>;
export type BookingConfirmationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookingConfirmation'>;
export type ReviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReviewScreen'>;

export type SearchScreenNavigationProp = StackNavigationProp<SearchStackParamList, 'SearchMap'>;
export type UpdatesScreenNavigationProp = BottomTabNavigationProp<TabParamList>; // Add this line
export type BookingsScreenNavigationProp = BottomTabNavigationProp<TabParamList>;

export type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;
export type AllReviewsScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'AllReviews'>;
export type FavoritesScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Favorites'>;

// Route prop types for screens
export type RestaurantDetailScreenRouteProp = RouteProp<RootStackParamList, 'RestaurantDetail'>;
export type BookingScreenRouteProp = RouteProp<RootStackParamList, 'BookingScreen'>;
export type BookingConfirmationScreenRouteProp = RouteProp<RootStackParamList, 'BookingConfirmation'>;
export type ReviewScreenRouteProp = RouteProp<RootStackParamList, 'ReviewScreen'>;

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

export interface UpdatesScreenProps { // Add this interface
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
const Stack = createStackNavigator<RootStackParamList>();
const SearchStack = createStackNavigator<SearchStackParamList>();
const BookingsStack = createStackNavigator<BookingsStackParamList>();
const ProfileStackNav = createStackNavigator<ProfileStackParamList>();
const UpdatesStack = createStackNavigator<UpdatesStackParamList>(); // Add this line
const Tab = createBottomTabNavigator<TabParamList>();

// Restaurant Stack Navigator
const RestaurantStackNavigator: React.FC = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="RestaurantList"
                component={RestaurantListScreen}
                options={{headerShown: false}}
            />
            <Stack.Screen
                name="RestaurantDetail"
                component={RestaurantDetailScreen}
                options={{headerShown: false}}
            />
            <Stack.Screen
                name="BookingScreen"
                component={BookingScreen}
                options={{headerShown: false}}
            />
            <Stack.Screen
                name="BookingConfirmation"
                component={BookingConfirmationScreen}
                options={{headerShown: false}}
            />
            <Stack.Screen
                name="ReviewScreen"
                component={ReviewScreen}
                options={{headerShown: false}}
            />
        </Stack.Navigator>
    );
};

// Search Stack Navigator
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

// Updates Stack Navigator - Add this entire section
const UpdatesStackNavigator: React.FC = () => {
    return (
        <UpdatesStack.Navigator>
            <UpdatesStack.Screen
                name="UpdatesList"
                component={UpdatesScreen}
                options={{headerShown: false}}
            />
        </UpdatesStack.Navigator>
    );
};

// Bookings Stack Navigator
const BookingsStackNavigator: React.FC = () => {
    return (
        <BookingsStack.Navigator>
            <BookingsStack.Screen
                name="BookingsList"
                component={BookingsScreen}
                options={{headerShown: false}}
            />
        </BookingsStack.Navigator>
    );
};

// Profile Stack Navigator
const ProfileStackNavigator: React.FC = () => {
    return (
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
        </ProfileStackNav.Navigator>
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
                component={RestaurantStackNavigator}
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
                component={UpdatesStackNavigator}
                options={{
                    tabBarIcon: ({color}) => (
                        <Text style={{color, fontSize: 20}}>🔔</Text>
                    ),
                    tabBarLabel: 'Updates',
                    // Optional: Add badge for unread notifications
                    // tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                }}
            />
            <Tab.Screen
                name="Bookings"
                component={BookingsStackNavigator}
                options={{
                    tabBarIcon: ({color}) => (
                        <Text style={{color, fontSize: 20}}>📅</Text>
                    ),
                    tabBarLabel: 'Bookings',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStackNavigator}
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

// Main App Navigator
const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <MainTabNavigator/>
        </NavigationContainer>
    );
};

export default AppNavigator;