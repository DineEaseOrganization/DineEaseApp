// src/screens/reviews/ReviewScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { ReviewScreenProps } from '../../navigation/AppNavigator';
import { processingService, RatingCategory } from '../../services/api/processingService';
import { updatesService } from '../../services/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

const ReviewScreen: React.FC<ReviewScreenProps> = ({ route, navigation }) => {
    const { reservation, updateId } = route.params;

    const [overallRating, setOverallRating] = useState(5);
    const [categoryRatings, setCategoryRatings] = useState<Record<number, number>>({});
    const [categories, setCategories] = useState<RatingCategory[]>([]);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        processingService.getRatingCategories(reservation.restaurant.id)
            .then((cats) => {
                setCategories(cats);
                const initial: Record<number, number> = {};
                cats.forEach(c => { initial[c.categoryId] = 5; });
                setCategoryRatings(initial);
            })
            .catch(() => setCategories([]));
    }, [reservation.restaurant.id]);

    const handleSubmitReview = async () => {
        setIsSubmitting(true);
        try {
            await processingService.submitReview({
                reservationId: reservation.id,
                restaurantId: reservation.restaurant.id,
                overallRating,
                reviewText: reviewText.trim() || undefined,
                categoryRatings: categories.map(c => ({
                    categoryId: c.categoryId,
                    score: categoryRatings[c.categoryId] || 5,
                })),
            });

            if (updateId) {
                updatesService.deleteUpdate(updateId).catch(() => {});
            }

            Alert.alert(
                'Review Submitted!',
                'Thank you for your feedback. Your review has been posted.',
                [{
                    text: 'Done',
                    onPress: () => {
                        reservation.canReview = false;
                        navigation.goBack();
                    },
                }]
            );
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const setCategoryRating = (categoryId: number, score: number) =>
        setCategoryRatings(prev => ({ ...prev, [categoryId]: score }));

    const getCategoryDisplayName = (name: string): string => {
        switch (name) {
            case 'FOOD':     return 'Food Quality';
            case 'SERVICE':  return 'Service';
            case 'AMBIANCE': return 'Ambiance';
            default:         return name.charAt(0) + name.slice(1).toLowerCase();
        }
    };

    const getCategoryEmoji = (name: string): string => {
        switch (name) {
            case 'FOOD':     return '🍽️';
            case 'SERVICE':  return '🤝';
            case 'AMBIANCE': return '✨';
            default:         return '⭐';
        }
    };

    const renderStarRating = (
        rating: number,
        setRating: (r: number) => void,
        label: string,
        emoji?: string,
        isOverall = false,
    ) => (
        <View style={[styles.ratingRow, isOverall && styles.ratingRowOverall]}>
            <View style={styles.ratingMeta}>
                {emoji && <AppText style={styles.ratingEmoji}>{emoji}</AppText>}
                <AppText
                    variant={isOverall ? 'sectionTitle' : 'bodyMedium'}
                    color={isOverall ? NAVY : Colors.textOnLight}
                >
                    {label}
                </AppText>
            </View>
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                        <AppText style={[
                            styles.star,
                            isOverall && styles.starLarge,
                            { color: star <= rating ? '#F5A623' : Colors.cardBorder },
                        ]}>
                            ★
                        </AppText>
                    </TouchableOpacity>
                ))}
                <AppText variant="caption" color={Colors.textOnLightTertiary} style={styles.ratingNum}>
                    {rating}/5
                </AppText>
            </View>
        </View>
    );

    const visitDate = new Date(reservation.date).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Navy header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <AppText style={styles.backIcon}>←</AppText>
                </TouchableOpacity>
                <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>
                    Write a Review
                </AppText>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Restaurant banner ── */}
                <View style={styles.restaurantBanner}>
                    <View style={styles.bannerAccent} />
                    <View style={styles.bannerText}>
                        <AppText variant="cardTitle" color={NAVY} numberOfLines={2}>
                            {reservation.restaurant.name}
                        </AppText>
                        <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ marginTop: 3 }}>
                            📅 {visitDate}  ·  🕐 {reservation.time}  ·  👥 {reservation.partySize} guests
                        </AppText>
                    </View>
                </View>

                {/* ── Overall rating ── */}
                <View style={styles.card}>
                    <View style={styles.sectionLabelRow}>
                        <View style={styles.sectionTick} />
                        <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                            OVERALL EXPERIENCE
                        </AppText>
                    </View>
                    {renderStarRating(overallRating, setOverallRating, 'How was your visit?', '⭐', true)}
                </View>

                {/* ── Category ratings ── */}
                {categories.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.sectionLabelRow}>
                            <View style={styles.sectionTick} />
                            <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                                RATE BY CATEGORY
                            </AppText>
                        </View>
                        {categories.map((cat, i) => (
                            <View key={cat.categoryId}>
                                {renderStarRating(
                                    categoryRatings[cat.categoryId] || 5,
                                    (score) => setCategoryRating(cat.categoryId, score),
                                    getCategoryDisplayName(cat.name),
                                    getCategoryEmoji(cat.name),
                                )}
                                {i < categories.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Review text ── */}
                <View style={styles.card}>
                    <View style={styles.sectionLabelRow}>
                        <View style={styles.sectionTick} />
                        <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                            YOUR REVIEW
                        </AppText>
                    </View>
                    <TextInput
                        style={styles.reviewInput}
                        placeholder="Share your experience with other diners..."
                        placeholderTextColor={Colors.textOnLightTertiary}
                        value={reviewText}
                        onChangeText={setReviewText}
                        multiline
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    <AppText variant="caption" color={Colors.textOnLightTertiary} style={styles.charCount}>
                        {reviewText.length}/500
                    </AppText>
                </View>

                {/* ── Tips ── */}
                <View style={styles.tipsCard}>
                    <AppText style={styles.tipsIcon}>💡</AppText>
                    <View style={{ flex: 1 }}>
                        <AppText variant="captionMedium" color={NAVY} style={{ marginBottom: 5 }}>
                            Tips for a great review
                        </AppText>
                        {[
                            'Mention specific dishes you tried',
                            'Comment on the service quality',
                            'Describe the atmosphere',
                            'Be honest and helpful for other diners',
                        ].map((tip, i) => (
                            <AppText key={i} variant="caption" color={Colors.textOnLightSecondary} style={styles.tipLine}>
                                · {tip}
                            </AppText>
                        ))}
                    </View>
                </View>

                <View style={{ height: Spacing['10'] }} />
            </ScrollView>

            {/* ── Sticky submit ── */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleSubmitReview}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <AppText variant="button" color={Colors.white}>Submit Review</AppText>
                    )}
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.appBackground,
    },

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
        width: 36,
        height: 36,
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 16,
        color: Colors.white,
        fontFamily: 'Inter-SemiBold',
    },
    headerTitle: {
        fontSize: FontSize.lg,
        color: Colors.white,
    },

    // ── Scroll ─────────────────────────────────────────────────────────────────
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing['4'],
        paddingTop: Spacing['4'],
    },

    // ── Restaurant banner ──────────────────────────────────────────────────────
    restaurantBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        marginBottom: Spacing['3'],
        overflow: 'hidden',
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    bannerAccent: {
        width: 4,
        alignSelf: 'stretch',
        backgroundColor: NAVY,
    },
    bannerText: {
        flex: 1,
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['3'],
    },

    // ── Card ───────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        padding: Spacing['4'],
        marginBottom: Spacing['3'],
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },

    // Section label
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['3'],
    },
    sectionTick: {
        width: 3,
        height: 14,
        backgroundColor: NAVY,
        borderRadius: 2,
    },
    sectionLabel: { letterSpacing: 1 },

    // ── Rating row ─────────────────────────────────────────────────────────────
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing['2'],
    },
    ratingRowOverall: {
        paddingVertical: Spacing['1'],
    },
    ratingMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        flex: 1,
    },
    ratingEmoji: { fontSize: 16 },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    star: {
        fontSize: 26,
    },
    starLarge: {
        fontSize: 34,
    },
    ratingNum: {
        marginLeft: Spacing['2'],
        minWidth: 28,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.cardBorder,
        marginVertical: Spacing['1'],
    },

    // ── Review text ────────────────────────────────────────────────────────────
    reviewInput: {
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        padding: Spacing['3'],
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
        minHeight: 110,
    },
    charCount: {
        textAlign: 'right',
        marginTop: Spacing['2'],
    },

    // ── Tips ───────────────────────────────────────────────────────────────────
    tipsCard: {
        flexDirection: 'row',
        gap: Spacing['3'],
        backgroundColor: 'rgba(15,51,70,0.04)',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(15,51,70,0.08)',
        padding: Spacing['3'],
        marginBottom: Spacing['3'],
    },
    tipsIcon: { fontSize: 18, marginTop: 1 },
    tipLine: { lineHeight: 20 },

    // ── Footer ─────────────────────────────────────────────────────────────────
    footer: {
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['3'],
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
        backgroundColor: Colors.white,
    },
    submitBtn: {
        backgroundColor: Colors.accent,
        paddingVertical: Spacing['3'] + 2,
        borderRadius: Radius.lg,
        alignItems: 'center',
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    submitBtnDisabled: {
        backgroundColor: Colors.textOnLightTertiary,
        shadowOpacity: 0,
        elevation: 0,
    },
});

export default ReviewScreen;
