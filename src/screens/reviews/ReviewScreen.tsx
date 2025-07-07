// src/screens/reviews/ReviewScreen.tsx
import React, {useState} from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {Review} from '../../types';
import {dummyReviews} from '../../data/dummyData';
import {ReviewScreenProps} from '../../navigation/AppNavigator';

const ReviewScreen: React.FC<ReviewScreenProps> = ({route, navigation}) => {
    const {reservation} = route.params;

    const [overallRating, setOverallRating] = useState(5);
    const [foodRating, setFoodRating] = useState(5);
    const [serviceRating, setServiceRating] = useState(5);
    const [ambianceRating, setAmbianceRating] = useState(5);
    const [reviewText, setReviewText] = useState('');

    const handleSubmitReview = () => {
        if (reviewText.trim().length < 10) {
            Alert.alert('Review Too Short', 'Please write at least 10 characters for your review.');
            return;
        }

        const newReview: Review = {
            id: dummyReviews.length + 1,
            restaurantId: reservation.restaurant.id,
            restaurantName: reservation.restaurant.name,
            customerName: reservation.customerName.split(' ')[0] + ' ' + reservation.customerName.split(' ')[1]?.charAt(0) + '.',
            rating: overallRating,
            reviewText,
            foodRating,
            serviceRating,
            ambianceRating,
            date: new Date().toISOString().split('T')[0],
            reservationId: reservation.id,
            isVerified: true
        };

        dummyReviews.push(newReview);

        Alert.alert(
            'Review Submitted!',
            'Thank you for your feedback. Your review has been posted.',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        // Mark reservation as reviewed
                        reservation.canReview = false;
                        navigation.goBack();
                    }
                }
            ]
        );
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

                {/* Detailed Ratings */}
                {renderStarRating(foodRating, setFoodRating, 'Food Quality')}
                {renderStarRating(serviceRating, setServiceRating, 'Service')}
                {renderStarRating(ambianceRating, setAmbianceRating, 'Ambiance')}

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
                    <Text style={styles.tipsTitle}>💡 Review Tips</Text>
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
                        reviewText.length < 10 && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmitReview}
                    disabled={reviewText.length < 10}
                >
                    <Text style={styles.submitButtonText}>Submit Review</Text>
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