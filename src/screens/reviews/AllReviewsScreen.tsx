// src/screens/reviews/AllReviewsScreen.tsx
import React, {useCallback, useState} from 'react';
import {ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {AllReviewsScreenProps} from '../../navigation/AppNavigator';
import {processingService, ReviewResponse} from '../../services/api/processingService';

const AllReviewsScreen: React.FC<AllReviewsScreenProps> = ({navigation}) => {
    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReviews = useCallback(() => {
        setIsLoading(true);
        processingService.getCustomerReviews()
            .then(setReviews)
            .catch(() => setReviews([]))
            .finally(() => setIsLoading(false));
    }, []);

    useFocusEffect(fetchReviews);

    const handleDeleteReview = (reviewId: number) => {
        Alert.alert(
            'Delete Review',
            'Are you sure you want to delete this review? This cannot be undone.',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await processingService.deleteReview(reviewId);
                            setReviews(prev => prev.filter(r => r.reviewId !== reviewId));
                        } catch {
                            Alert.alert('Error', 'Failed to delete review. Please try again.');
                        }
                    },
                },
            ]
        );
    };

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

    const getCategoryDisplayName = (name: string): string => {
        switch (name) {
            case 'FOOD': return 'Food';
            case 'SERVICE': return 'Service';
            case 'AMBIANCE': return 'Ambiance';
            default: return name.charAt(0) + name.slice(1).toLowerCase();
        }
    };

    const formatDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
        } catch {
            return dateStr;
        }
    };

    const renderReviewCard = (review: ReviewResponse) => (
        <View key={review.reviewId} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Text style={styles.restaurantName}>{review.restaurantName || 'Restaurant'}</Text>
                <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
            </View>

            <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                    {renderStars(review.overallRating)}
                </View>
                <Text style={styles.ratingText}>Overall: {review.overallRating}/5</Text>
                {review.isVerified && (
                    <Text style={styles.verifiedBadge}>✓ Verified</Text>
                )}
            </View>

            {review.reviewText && (
                <Text style={styles.reviewText}>{review.reviewText}</Text>
            )}

            {review.categoryRatings.length > 0 && (
                <View style={styles.detailedRatings}>
                    {review.categoryRatings.map(cr => (
                        <View key={cr.categoryId} style={styles.ratingDetail}>
                            <Text style={styles.ratingDetailLabel}>
                                {getCategoryDisplayName(cr.categoryName)}:
                            </Text>
                            <Text style={styles.ratingDetailValue}>{cr.score}/5</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteReview(review.reviewId)}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
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

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {reviews.length > 0 ? (
                        reviews.map(renderReviewCard)
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No Reviews Yet</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Your reviews will appear here after you dine at restaurants and share your experience.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    deleteButton: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    deleteButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#DC2626',
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
