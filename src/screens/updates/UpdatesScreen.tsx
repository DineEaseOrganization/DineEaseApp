import React, { JSX, useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    ListRenderItem,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updatesService, MobileUpdate, processingService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { UpdatesStackParamList } from '../../navigation/AppNavigator';
import { mapReservationDtoToReservation } from '../../utils/reservationMapper';
import { Colors, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';

const NAVY = Colors.primary;

interface FilterOption {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface UpdatesScreenProps {
    navigation: StackNavigationProp<UpdatesStackParamList, 'UpdatesList'>;
}

const mapCategoryToFilterKey = (category: string): string => {
    const mapping: Record<string, string> = {
        'RESERVATION': 'reservation',
        'REVIEW': 'review',
        'RESTAURANT_NEWS': 'restaurant_news',
        'APP_UPDATE': 'update',
        'SYSTEM': 'update',
    };
    return mapping[category] || category.toLowerCase();
};

const mapFilterKeyToCategory = (filterKey: string): string | undefined => {
    const mapping: Record<string, string> = {
        'reservation': 'RESERVATION',
        'review': 'REVIEW',
        'restaurant_news': 'RESTAURANT_NEWS',
        'update': 'APP_UPDATE',
    };
    return mapping[filterKey];
};

const UpdatesScreen: React.FC<UpdatesScreenProps> = ({ navigation }) => {
    const { user } = useAuth();
    const [updates, setUpdates] = useState<MobileUpdate[]>([]);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const filterOptions: FilterOption[] = [
        { key: 'all', label: 'All', icon: 'notifications-outline' },
        { key: 'reservation', label: 'Bookings', icon: 'calendar-outline' },
        { key: 'update', label: 'Updates', icon: 'download-outline' },
        { key: 'review', label: 'Reviews', icon: 'star-outline' },
    ];

    const fetchUpdates = useCallback(async () => {
        if (!user) return;
        try {
            setError(null);
            const category = activeFilter === 'all' ? undefined : mapFilterKeyToCategory(activeFilter);
            const response = await updatesService.getUpdates(category);
            setUpdates(response.content);
            setUnreadCount(response.unreadCount);
        } catch (err: any) {
            setError(err.message || 'Failed to load updates');
        } finally {
            setLoading(false);
        }
    }, [user, activeFilter]);

    useFocusEffect(
        useCallback(() => {
            fetchUpdates();
        }, [fetchUpdates])
    );

    const onRefresh = async (): Promise<void> => {
        setRefreshing(true);
        await fetchUpdates();
        setRefreshing(false);
    };

    const markAsRead = async (updateId: number): Promise<void> => {
        if (!user) return;
        try {
            await updatesService.markAsRead(updateId);
            setUpdates(prev =>
                prev.map(u => u.updateId === updateId ? { ...u, isRead: true, readAt: new Date().toISOString() } : u)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            Alert.alert('Error', 'Failed to mark update as read');
        }
    };

    const markAllAsRead = async (): Promise<void> => {
        if (!user) return;
        try {
            await updatesService.markAllAsRead();
            setUpdates(prev => prev.map(u => ({ ...u, isRead: true, readAt: new Date().toISOString() })));
            setUnreadCount(0);
        } catch {
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const deleteNotification = async (updateId: number): Promise<void> => {
        if (!user) return;
        try {
            await updatesService.deleteUpdate(updateId);
            setUpdates(prev => prev.filter(u => u.updateId !== updateId));
        } catch {
            Alert.alert('Error', 'Failed to delete update');
        }
    };

    const getNotificationIcon = (update: MobileUpdate): string => {
        if (update.icon) return update.icon;
        const filterKey = mapCategoryToFilterKey(update.updateCategory);
        switch (filterKey) {
            case 'reservation': return '📅';
            case 'update': return '📱';
            case 'review': return '⭐';
            case 'restaurant_news': return '🍽️';
            default: return '📢';
        }
    };

    const handleActionButton = async (update: MobileUpdate): Promise<void> => {
        if (!update.actionButton?.data) return;
        const { screen, ...params } = update.actionButton.data;
        if (!screen) return;
        try {
            if ((screen === 'ReviewScreen' || screen === 'Review') && params.reservationId) {
                const reservationDtos = await processingService.getCustomerReservations();
                const dto = reservationDtos.find(r => r.reservationId === params.reservationId);
                if (!dto) {
                    Alert.alert('Error', 'Reservation not found.');
                    return;
                }
                const reservation = mapReservationDtoToReservation(dto);
                navigation.navigate('ReviewScreen', {
                    reservation,
                    restaurantId: params.restaurantId,
                    reservationId: params.reservationId,
                    updateId: update.updateId ?? undefined,
                });
            }
        } catch {
            Alert.alert('Error', 'Failed to load reservation details.');
        }
    };

    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'high': return Colors.error;
            case 'medium': return Colors.warning;
            default: return NAVY;
        }
    };

    const formatTimestamp = (isoString: string): string => {
        const timestamp = new Date(isoString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            return `${Math.floor(diffInHours / 24)}d ago`;
        }
    };

    const renderNotificationItem: ListRenderItem<MobileUpdate> = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
            onPress={() => !item.isRead && item.updateId && markAsRead(item.updateId)}
            activeOpacity={0.85}
        >
            {/* Unread left accent */}
            {!item.isRead && <View style={[styles.unreadAccent, { backgroundColor: getPriorityColor(item.priority) }]} />}

            <View style={styles.notificationInner}>
                {/* Icon */}
                <View style={styles.iconWrap}>
                    {item.restaurantImageUrl ? (
                        <Image source={{ uri: item.restaurantImageUrl }} style={styles.restaurantIcon} />
                    ) : (
                        <AppText style={styles.notificationIcon}>{getNotificationIcon(item)}</AppText>
                    )}
                    {!item.isRead && (
                        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
                    )}
                </View>

                {/* Content */}
                <View style={styles.notificationText}>
                    <View style={styles.titleRow}>
                        <AppText
                            variant={item.isRead ? 'bodyMedium' : 'bodySemiBold'}
                            color={Colors.textOnLight}
                            numberOfLines={1}
                            style={styles.notificationTitle}
                        >
                            {item.title}
                        </AppText>
                        <AppText variant="caption" color={Colors.textOnLightTertiary}>
                            {formatTimestamp(item.createdAt)}
                        </AppText>
                    </View>

                    {item.restaurantName && (
                        <AppText variant="captionMedium" color={NAVY} style={{ marginBottom: 3 }}>
                            {item.restaurantName}
                        </AppText>
                    )}

                    <AppText variant="caption" color={Colors.textOnLightSecondary} numberOfLines={2}>
                        {item.message}
                    </AppText>

                    {item.actionButton && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleActionButton(item)}
                        >
                            <AppText variant="captionMedium" color={Colors.accent}>
                                {item.actionButton.label}
                            </AppText>
                            <Ionicons name="arrow-forward" size={13} color={Colors.accent} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Delete */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => item.updateId && deleteNotification(item.updateId)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="trash-outline" size={18} color={Colors.textOnLightTertiary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderFilterChip = (filter: FilterOption): JSX.Element => {
        const isActive = activeFilter === filter.key;
        return (
            <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.key)}
            >
                <Ionicons name={filter.icon} size={14} color={isActive ? Colors.primary : 'rgba(255,255,255,0.75)'} />
                <AppText variant="captionMedium" color={isActive ? Colors.primary : 'rgba(255,255,255,0.75)'} style={{ marginLeft: 4 }}>
                    {filter.label}
                </AppText>
            </TouchableOpacity>
        );
    };

    // ── Loading ──
    if (loading) {
        return (
            <SafeAreaView style={styles.safeContainer}>
                <View style={styles.header}>
                    <AppText variant="h3" color={Colors.white}>Updates</AppText>
                </View>
                <View style={styles.centerFill}>
                    <ActivityIndicator size="large" color={NAVY} />
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['3'] }}>
                        Loading updates...
                    </AppText>
                </View>
            </SafeAreaView>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <SafeAreaView style={styles.safeContainer}>
                <View style={styles.header}>
                    <AppText variant="h3" color={Colors.white}>Updates</AppText>
                </View>
                <View style={styles.centerFill}>
                    <AppText style={{ fontSize: 48, marginBottom: Spacing['3'] }}>⚠️</AppText>
                    <AppText variant="sectionTitle" color={NAVY} style={{ marginBottom: Spacing['2'] }}>Failed to Load</AppText>
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ textAlign: 'center', marginBottom: Spacing['5'] }}>
                        {error}
                    </AppText>
                    <AppButton label="Retry" onPress={fetchUpdates} variant="primary" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            {/* ── Navy Header ── */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <AppText variant="h3" color={Colors.white} style={styles.headerTitle}>Updates</AppText>
                    <View style={styles.headerRight}>
                        {unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <AppText variant="captionMedium" color={Colors.white}>{unreadCount}</AppText>
                            </View>
                        )}
                        {unreadCount > 0 && (
                            <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
                                <AppText variant="captionMedium" color={Colors.white}>Mark all read</AppText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filter chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                >
                    {filterOptions.map(renderFilterChip)}
                </ScrollView>
            </View>

            {/* ── Notification List ── */}
            <FlatList
                data={updates}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.updateId?.toString() || Math.random().toString()}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={NAVY}
                        colors={[NAVY]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <AppText style={{ fontSize: 52, marginBottom: Spacing['3'] }}>📭</AppText>
                        <AppText variant="sectionTitle" color={NAVY} style={{ marginBottom: Spacing['2'] }}>All caught up</AppText>
                        <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ textAlign: 'center' }}>
                            {activeFilter === 'all'
                                ? "New notifications will appear here."
                                : `No ${filterOptions.find(f => f.key === activeFilter)?.label.toLowerCase()} notifications.`}
                        </AppText>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

export default UpdatesScreen;

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: NAVY,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        backgroundColor: NAVY,
        paddingTop: Spacing['3'],
        paddingHorizontal: Spacing['4'],
        paddingBottom: Spacing['3'],
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing['3'],
    },
    headerTitle: {
        fontSize: 22,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
    },
    unreadBadge: {
        backgroundColor: Colors.accent,
        minWidth: 22,
        height: 22,
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    markAllBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['1'] + 2,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    filtersContent: {
        flexDirection: 'row',
        gap: Spacing['2'],
        paddingBottom: Spacing['1'],
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing['3'],
        paddingVertical: 6,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    filterChipActive: {
        backgroundColor: Colors.white,
        borderColor: Colors.white,
    },

    // ── Center fill ───────────────────────────────────────────────────────────
    centerFill: {
        flex: 1,
        backgroundColor: Colors.appBackground,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing['5'],
    },

    // ── List ──────────────────────────────────────────────────────────────────
    list: {
        flex: 1,
        backgroundColor: Colors.appBackground,
    },
    listContent: {
        paddingTop: Spacing['3'],
        paddingBottom: Spacing['8'],
    },

    // ── Notification item ─────────────────────────────────────────────────────
    notificationItem: {
        marginHorizontal: Spacing['4'],
        marginBottom: Spacing['2'],
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        overflow: 'hidden',
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    unreadNotification: {
        borderColor: `${NAVY}25`,
    },
    unreadAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderTopLeftRadius: Radius.xl,
        borderBottomLeftRadius: Radius.xl,
    },
    notificationInner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing['3'],
        paddingLeft: Spacing['4'],
        gap: Spacing['3'],
    },

    // ── Icon ─────────────────────────────────────────────────────────────────
    iconWrap: {
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: Radius.lg,
        backgroundColor: 'rgba(15,51,70,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    restaurantIcon: {
        width: 44,
        height: 44,
        borderRadius: Radius.lg,
    },
    notificationIcon: {
        fontSize: 22,
    },
    priorityDot: {
        position: 'absolute',
        top: -3,
        right: -3,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: Colors.cardBackground,
    },

    // ── Text block ────────────────────────────────────────────────────────────
    notificationText: {
        flex: 1,
        minWidth: 0,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 3,
        gap: Spacing['2'],
    },
    notificationTitle: {
        flex: 1,
    },

    // ── Action button ─────────────────────────────────────────────────────────
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        marginTop: Spacing['2'],
        backgroundColor: 'rgba(122,0,0,0.06)',
        paddingHorizontal: Spacing['2'] + 2,
        paddingVertical: 4,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(122,0,0,0.12)',
    },

    // ── Delete button ─────────────────────────────────────────────────────────
    deleteButton: {
        padding: 4,
        flexShrink: 0,
    },

    // ── Empty state ───────────────────────────────────────────────────────────
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Spacing['10'],
        paddingHorizontal: Spacing['8'],
    },
});
