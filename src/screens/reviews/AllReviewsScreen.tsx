// src/screens/reviews/AllReviewsScreen.tsx
import React from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {dummyReviews} from '../../data/dummyData';
import {Review} from '../../types';
import {AllReviewsScreenProps} from '../../navigation/AppNavigator';

const AllReviewsScreen: React.FC<AllReviewsScreenProps> = ({navigation}) => {
    const userReviews = dummyReviews; // In real app, filter by current user

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Text key={i} style={[styles.star, i <= rating ? styles.starFilled : styles.starEmpty]}>
                    ★
                </Text>
            );
        }
        return stars;
    };

    const renderReviewCard = (review: Review) => (
        <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Text style={styles.restaurantName}>{review.restaurantName}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
            </View>

            <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                    {renderStars(review.rating)}
                </View>
                <Text style={styles.ratingText}>Overall: {review.rating}/5</Text>
                {review.isVerified && (
                    <Text style={styles.verifiedBadge}>✓ Verified</Text>
                )}
            </View>

            <Text style={styles.reviewText}>{review.reviewText}</Text>

            <View style={styles.detailedRatings}>
                <View style={styles.ratingDetail}>
                    <Text style={styles.ratingDetailLabel}>Food:</Text>
                    <Text style={styles.ratingDetailValue}>{review.foodRating}/5</Text>
                </View>
                <View style={styles.ratingDetail}>
                    <Text style={styles.ratingDetailLabel}>Service:</Text>
                    <Text style={styles.ratingDetailValue}>{review.serviceRating}/5</Text>
                </View>
                <View style={styles.ratingDetail}>
                    <Text style={styles.ratingDetailLabel}>Ambiance:</Text>
                    <Text style={styles.ratingDetailValue}>{review.ambianceRating}/5</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>My Reviews</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {userReviews.length > 0 ? (
                    userReviews.map(renderReviewCard)
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No Reviews Yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Your reviews will appear here after you dine at restaurants and share your experience.
                        </Text>
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
        padding: 20,
    },
    reviewCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 8,
    },
    star: {
        fontSize: 16,
    },
    starFilled: {
        color: '#FFD700',
    },
    starEmpty: {
        color: '#ddd',
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
        marginRight: 12,
    },
    verifiedBadge: {
        fontSize: 12,
        color: '#27ae60',
        fontWeight: '500',
    },
    reviewText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 12,
    },
    detailedRatings: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    ratingDetail: {
        alignItems: 'center',
    },
    ratingDetailLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    ratingDetailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default AllReviewsScreen;