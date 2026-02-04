// src/screens/reviews/ReviewScreen.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {ReviewScreenProps} from '../../navigation/AppNavigator';
import {processingService, RatingCategory} from '../../services/api/processingService';

const ReviewScreen: React.FC<ReviewScreenProps> = ({route, navigation}) => {
    const {reservation} = route.params;

    const [overallRating, setOverallRating] = useState(5);
    const [categoryRatings, setCategoryRatings] = useState<Record<number, number>>({});
    const [categories, setCategories] = useState<RatingCategory[]>([]);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        processingService.getRatingCategories(reservation.restaurant.id)
            .then((cats) => {
                setCategories(cats);
                // Initialize all category ratings to 5
                const initial: Record<number, number> = {};
                cats.forEach(c => { initial[c.categoryId] = 5; });
                setCategoryRatings(initial);
            })
            .catch(() => {
                // Fallback: no dynamic categories, submit without them
                setCategories([]);
            });
    }, [reservation.restaurant.id]);

    const handleSubmitReview = async () => {
        if (reviewText.trim().length < 10) {
            Alert.alert('Review Too Short', 'Please write at least 10 characters for your review.');
            return;
        }

        setIsSubmitting(true);
        try {
            await processingService.submitReview({
                reservationId: reservation.id,
                restaurantId: reservation.restaurant.id,
                overallRating,
                reviewText: reviewText.trim(),
                categoryRatings: categories.map(c => ({
                    categoryId: c.categoryId,
                    score: categoryRatings[c.categoryId] || 5,
                })),
            });

            Alert.alert(
                'Review Submitted!',
                'Thank you for your feedback. Your review has been posted.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            reservation.canReview = false;
                            navigation.goBack();
                        }
                    }
                ]
            );
        } catch (error: any) {
            const message = error?.message || 'Failed to submit review. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const setCategoryRating = (categoryId: number, score: number) => {
        setCategoryRatings(prev => ({...prev, [categoryId]: score}));
    };

    const renderStarRating = (rating: number, setRating: (rating: number) => void, label: string) => (
        <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>{label}</Text>
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        style={styles.starButton}
                    >
                        <Text style={[
                            styles.star,
                            star <= rating ? styles.starFilled : styles.starEmpty
                        ]}>
                            ★
                        </Text>
                    </TouchableOpacity>
                ))}
                <Text style={styles.ratingValue}>({rating}/5)</Text>
            </View>
        </View>
    );

    const getCategoryDisplayName = (name: string): string => {
        switch (name) {
            case 'FOOD': return 'Food Quality';
            case 'SERVICE': return 'Service';
            case 'AMBIANCE': return 'Ambiance';
            default: return name.charAt(0) + name.slice(1).toLowerCase();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Write Review</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Restaurant Info */}
                <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName}>{reservation.restaurant.name}</Text>
                    <Text style={styles.visitDate}>
                        Visited on {reservation.date} at {reservation.time}
                    </Text>
                </View>

                {/* Overall Rating */}
                {renderStarRating(overallRating, setOverallRating, 'Overall Experience')}

                {/* Dynamic Category Ratings */}
                {categories.map(category => (
                    <View key={category.categoryId}>
                        {renderStarRating(
                            categoryRatings[category.categoryId] || 5,
                            (score) => setCategoryRating(category.categoryId, score),
                            getCategoryDisplayName(category.name)
                        )}
                    </View>
                ))}

                {/* Review Text */}
                <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Your Review</Text>
                    <TextInput
                        style={styles.reviewInput}
                        placeholder="Share your experience with other diners..."
                        value={reviewText}
                        onChangeText={setReviewText}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    <Text style={styles.characterCount}>{reviewText.length}/500</Text>
                </View>

                {/* Tips */}
                <View style={styles.tipsSection}>
                    <Text style={styles.tipsTitle}>Review Tips</Text>
                    <Text style={styles.tipsText}>
                        • Mention specific dishes you tried{'\n'}
                        • Comment on the service quality{'\n'}
                        • Describe the atmosphere{'\n'}
                        • Be honest and helpful for other diners
                    </Text>
                </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.submitButtonContainer}>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (reviewText.length < 10 || isSubmitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmitReview}
                    disabled={reviewText.length < 10 || isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Text>
                </TouchableOpacity>
            </View>
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
    restaurantInfo: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 10,
    },
    restaurantName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    visitDate: {
        fontSize: 14,
        color: '#666',
    },
    ratingSection: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 1,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starButton: {
        marginRight: 4,
    },
    star: {
        fontSize: 28,
    },
    starFilled: {
        color: '#FFD700',
    },
    starEmpty: {
        color: '#ddd',
    },
    ratingValue: {
        marginLeft: 12,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    reviewSection: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 10,
    },
    reviewLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    reviewInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        height: 120,
        backgroundColor: '#fafafa',
    },
    characterCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#999',
        marginTop: 8,
    },
    tipsSection: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 100,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    tipsText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    submitButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ReviewScreen;
