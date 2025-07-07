import React, {useState} from 'react';
import {Alert, Image, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Restaurant} from '../types';
import {dummyUser} from '../data/dummyData';

interface RestaurantCardProps {
    restaurant: Restaurant;
    onPress: (restaurant: Restaurant) => void;
    showFavoriteButton?: boolean;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
                                                           restaurant,
                                                           onPress,
                                                           showFavoriteButton = true
                                                       }) => {
    const [isFavorite, setIsFavorite] = useState(
        dummyUser.favoriteRestaurants.includes(restaurant.id)
    );

    const handleFavoritePress = () => {
        setIsFavorite(!isFavorite);
        if (!isFavorite) {
            dummyUser.favoriteRestaurants.push(restaurant.id);
            Alert.alert('Added to Favorites', `${restaurant.name} has been added to your favorites.`);
        } else {
            const index = dummyUser.favoriteRestaurants.indexOf(restaurant.id);
            if (index > -1) {
                dummyUser.favoriteRestaurants.splice(index, 1);
            }
            Alert.alert('Removed from Favorites', `${restaurant.name} has been removed from your favorites.`);
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push('★');
        }
        if (hasHalfStar) {
            stars.push('☆');
        }

        return stars.join('');
    };

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(restaurant)}>
            <View style={styles.imageContainer}>
                <Image source={{uri: restaurant.coverImageUrl}} style={styles.image}/>
                <View style={styles.overlay}>
                    <Text style={styles.priceRange}>{restaurant.priceRange}</Text>
                </View>

                {showFavoriteButton && (
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={handleFavoritePress}
                    >
                        <Text style={[styles.favoriteIcon, {color: isFavorite ? '#e74c3c' : '#fff'}]}>
                            {isFavorite ? '❤️' : '🤍'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
                <Text style={styles.cuisine}>{restaurant.cuisineType}</Text>

                <View style={styles.ratingContainer}>
                    <Text style={styles.stars}>{renderStars(restaurant.averageRating)}</Text>
                    <Text style={styles.rating}>
                        {restaurant.averageRating} ({restaurant.totalReviews} reviews)
                    </Text>
                </View>

                <Text style={styles.address} numberOfLines={1}>{restaurant.address}</Text>

                <View style={styles.amenitiesContainer}>
                    {restaurant.amenities.slice(0, 3).map((amenity, index) => (
                        <View key={index} style={styles.amenityTag}>
                            <Text style={styles.amenityText}>{amenity}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 200,
    },
    overlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priceRange: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    favoriteButton: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteIcon: {
        fontSize: 20,
    },
    content: {
        padding: 16,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    cuisine: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    stars: {
        fontSize: 16,
        color: '#FFD700',
        marginRight: 6,
    },
    rating: {
        fontSize: 14,
        color: '#666',
    },
    address: {
        fontSize: 12,
        color: '#999',
        marginBottom: 12,
    },
    amenitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    amenityTag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 4,
    },
    amenityText: {
        fontSize: 11,
        color: '#666',
    },
});

export default RestaurantCard;
