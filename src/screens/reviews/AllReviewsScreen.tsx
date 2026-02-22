// src/screens/reviews/AllReviewsScreen.tsx
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AllReviewsScreenProps } from '../../navigation/AppNavigator';
import { processingService, ReviewResponse } from '../../services/api/processingService';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';

const NAVY = Colors.primary;

const getCategoryEmoji = (name: string) => {
    switch (name) {
        case 'FOOD':     return '🍽️';
        case 'SERVICE':  return '🤝';
        case 'AMBIANCE': return '✨';
        default:         return '⭐';
    }
};

const getCategoryDisplayName = (name: string) => {
    switch (name) {
        case 'FOOD':     return 'Food';
        case 'SERVICE':  return 'Service';
        case 'AMBIANCE': return 'Ambiance';
        default:         return name.charAt(0) + name.slice(1).toLowerCase();
    }
};

const formatDate = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
};

const Stars = ({ rating, size = 15 }: { rating: number; size?: number }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <AppText key={i} style={{ fontSize: size, color: i <= rating ? '#F5A623' : Colors.cardBorder }}>★</AppText>
        ))}
    </View>
);

const AllReviewsScreen: React.FC<AllReviewsScreenProps> = ({ navigation }) => {
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

    const handleDelete = (reviewId: number) => {
        Alert.alert(
            'Delete Review',
            'Are you sure you want to delete this review? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
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

    const renderCard = ({ item: review }: { item: ReviewResponse }) => (
        <View style={styles.card}>

            {/* ── Header: name + date ── */}
            <View style={styles.cardHeader}>
                <AppText variant="cardTitle" color={NAVY} numberOfLines={1} style={styles.restaurantName}>
                    {review.restaurantName || 'Restaurant'}
                </AppText>
                <AppText variant="caption" color={Colors.textOnLightTertiary}>
                    {formatDate(review.createdAt)}
                </AppText>
            </View>

            {/* ── Overall rating row ── */}
            <View style={styles.overallRow}>
                <Stars rating={review.overallRating} size={18} />
                <AppText variant="captionMedium" color={Colors.textOnLightSecondary} style={{ marginLeft: Spacing['2'] }}>
                    {review.overallRating}/5
                </AppText>
                {review.isVerified && (
                    <View style={styles.verifiedPill}>
                        <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                        <AppText variant="captionMedium" color={Colors.success}>Verified</AppText>
                    </View>
                )}
            </View>

            {/* ── Review text ── */}
            {review.reviewText ? (
                <View style={styles.reviewTextBox}>
                    <AppText style={styles.quoteIcon}>❝</AppText>
                    <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ flex: 1, lineHeight: 18 }}>
                        {review.reviewText}
                    </AppText>
                </View>
            ) : null}

            {/* ── Category ratings ── */}
            {review.categoryRatings.length > 0 && (
                <View style={styles.categoryGrid}>
                    {review.categoryRatings.map(cr => (
                        <View key={cr.categoryId} style={styles.categoryItem}>
                            <AppText style={styles.categoryEmoji}>{getCategoryEmoji(cr.categoryName)}</AppText>
                            <View>
                                <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.categoryLabel}>
                                    {getCategoryDisplayName(cr.categoryName).toUpperCase()}
                                </AppText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Stars rating={cr.score} size={11} />
                                    <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                                        {cr.score}/5
                                    </AppText>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* ── Delete action ── */}
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(review.reviewId)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="trash-outline" size={13} color={Colors.error} />
                    <AppText variant="captionMedium" color={Colors.error}>Delete</AppText>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Navy header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>
                    My Reviews
                </AppText>
                {/* count badge */}
                {reviews.length > 0 && (
                    <View style={styles.countBadge}>
                        <AppText variant="captionMedium" color={Colors.white}>{reviews.length}</AppText>
                    </View>
                )}
                {reviews.length === 0 && <View style={{ width: 36 }} />}
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={NAVY} />
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['3'] }}>
                        Loading reviews...
                    </AppText>
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={r => r.reviewId.toString()}
                    renderItem={renderCard}
                    contentContainerStyle={reviews.length === 0 ? styles.emptyContainer : styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <AppText style={styles.emptyIcon}>⭐</AppText>
                            <AppText variant="sectionTitle" color={NAVY} style={{ marginBottom: Spacing['2'] }}>
                                No reviews yet
                            </AppText>
                            <AppText variant="body" color={Colors.textOnLightSecondary} style={{ textAlign: 'center' }}>
                                After dining, share your experience to help other diners.
                            </AppText>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.appBackground },

    // ── Header ─────────────────────────────────────────────────────────────────
    header: {
        backgroundColor: NAVY,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['3'],
    },
    backBtn: {
        width: 36, height: 36,
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: FontSize.lg, flex: 1, marginLeft: Spacing['3'] },
    countBadge: {
        backgroundColor: Colors.accent,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing['2'] + 2,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: 'center',
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['5'] },

    // ── List ───────────────────────────────────────────────────────────────────
    list: {
        paddingHorizontal: Spacing['4'],
        paddingTop: Spacing['4'],
        paddingBottom: Spacing['8'],
    },
    emptyContainer: { flex: 1 },

    // ── Card ───────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderLeftWidth: 3,
        borderLeftColor: '#F5A623',
        marginBottom: Spacing['3'],
        overflow: 'hidden',
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['4'],
        paddingTop: Spacing['3'],
        paddingBottom: Spacing['2'],
        gap: Spacing['2'],
    },
    restaurantName: { flex: 1, fontSize: FontSize.md },

    // Overall stars
    overallRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing['4'],
        marginBottom: Spacing['2'],
    },
    verifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginLeft: Spacing['2'],
        backgroundColor: Colors.successFaded,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing['2'],
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: Colors.success,
    },

    // Review text
    reviewTextBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing['2'],
        marginHorizontal: Spacing['4'],
        marginBottom: Spacing['2'],
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.md,
        padding: Spacing['3'],
    },
    quoteIcon: { fontSize: 16, color: Colors.cardBorder, marginTop: -2 },

    // Category grid
    categoryGrid: {
        flexDirection: 'row',
        gap: Spacing['2'],
        paddingHorizontal: Spacing['4'],
        paddingTop: Spacing['2'],
        paddingBottom: Spacing['2'],
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
        flexWrap: 'wrap',
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        flex: 1,
        minWidth: '30%',
    },
    categoryEmoji: { fontSize: 18 },
    categoryLabel: { letterSpacing: 0.5, fontSize: 10, marginBottom: 2 },

    // Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['2'],
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['1'] + 2,
        borderRadius: Radius.md,
        backgroundColor: Colors.errorFaded,
        borderWidth: 1,
        borderColor: Colors.error,
    },

    // Empty state
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['10'],
        paddingHorizontal: Spacing['5'],
    },
    emptyIcon: { fontSize: 48, marginBottom: Spacing['4'] },
});

export default AllReviewsScreen;
