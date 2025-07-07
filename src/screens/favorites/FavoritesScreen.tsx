// src/screens/favorites/FavoritesScreen.tsx
import React from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {dummyRestaurants, dummyUser} from '../../data/dummyData';
import RestaurantCard from '../../components/RestaurantCard';
import {Restaurant} from '../../types';
import {FavoritesScreenProps} from '../../navigation/AppNavigator';

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({navigation}) => {
    const favoriteRestaurants = dummyRestaurants.filter(restaurant =>
        dummyUser.favoriteRestaurants.includes(restaurant.id)
    );

    const handleRestaurantPress = (restaurant: Restaurant) => {
        // Navigate back to the main tab and then to restaurant detail
        // This requires specific navigation structure setup
        navigation.goBack();
        // You might need to adjust this based on your navigation structure
    };

    const handleExplorePress = () => {
        // Navigate to the main discover tab
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Favorite Restaurants</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {favoriteRestaurants.length > 0 ? (
                    favoriteRestaurants.map((restaurant) => (
                        <RestaurantCard
                            key={restaurant.id}
                            restaurant={restaurant}
                            onPress={handleRestaurantPress}
                            showFavoriteButton={true}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateIcon}>💔</Text>
                        <Text style={styles.emptyStateText}>No Favorites Yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Start exploring restaurants and tap the heart icon to add them to your favorites!
                        </Text>
                        <TouchableOpacity
                            style={styles.exploreButton}
                            onPress={handleExplorePress}
                        >
                            <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        fontSize: 16,
        color: '#007AFF',
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyStateIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    exploreButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    exploreButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FavoritesScreen;