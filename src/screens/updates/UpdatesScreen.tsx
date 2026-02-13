import React, {JSX, useCallback, useEffect, useState} from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    ImageStyle,
    ListRenderItem,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
    ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {updatesService, MobileUpdate, processingService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';
import {StackNavigationProp} from '@react-navigation/stack';
import {useFocusEffect} from '@react-navigation/native';
import {UpdatesStackParamList} from '../../navigation/AppNavigator';
import {mapReservationDtoToReservation} from '../../utils/reservationMapper';

const {width} = Dimensions.get('window');

// TypeScript interfaces
interface FilterOption {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface UpdatesScreenProps {
    navigation: StackNavigationProp<UpdatesStackParamList, 'UpdatesList'>;
}

// Map backend category to frontend filter key
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

// Map frontend filter key to backend category
const mapFilterKeyToCategory = (filterKey: string): string | undefined => {
    const mapping: Record<string, string> = {
        'reservation': 'RESERVATION',
        'review': 'REVIEW',
        'restaurant_news': 'RESTAURANT_NEWS',
        'update': 'APP_UPDATE',
    };
    return mapping[filterKey];
};

const UpdatesScreen: React.FC<UpdatesScreenProps> = ({navigation}) => {
    const {user} = useAuth();
    const [updates, setUpdates] = useState<MobileUpdate[]>([]);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const filterOptions: FilterOption[] = [
        {key: 'all', label: 'All', icon: 'notifications-outline'},
        {key: 'reservation', label: 'Bookings', icon: 'calendar-outline'},
        {key: 'update', label: 'Updates', icon: 'download-outline'},
        {key: 'review', label: 'Reviews', icon: 'star-outline'},
    ];

    // Fetch updates from API
    const fetchUpdates = useCallback(async () => {
        if (!user) {
            console.log('No user logged in');
            return;
        }

        try {
            setError(null);
            const category = activeFilter === 'all' ? undefined : mapFilterKeyToCategory(activeFilter);
            const response = await updatesService.getUpdates(category);

            setUpdates(response.content);
            setUnreadCount(response.unreadCount);
        } catch (err: any) {
            console.error('Error fetching updates:', err);
            setError(err.message || 'Failed to load updates');
        } finally {
            setLoading(false);
        }
    }, [user, activeFilter]);

    // Load updates on mount, filter change, and when screen regains focus
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

            // Update local state optimistically
            setUpdates(prev =>
                prev.map(update =>
                    update.updateId === updateId
                        ? {...update, isRead: true, readAt: new Date().toISOString()}
                        : update
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err: any) {
            console.error('Error marking update as read:', err);
            Alert.alert('Error', 'Failed to mark update as read');
        }
    };

    const markAllAsRead = async (): Promise<void> => {
        if (!user) return;

        try {
            await updatesService.markAllAsRead();

            // Update local state
            setUpdates(prev =>
                prev.map(update => ({
                    ...update,
                    isRead: true,
                    readAt: new Date().toISOString()
                }))
            );
            setUnreadCount(0);
        } catch (err: any) {
            console.error('Error marking all as read:', err);
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const deleteNotification = async (updateId: number): Promise<void> => {
        if (!user) return;

        try {
            await updatesService.deleteUpdate(updateId);

            // Update local state
            setUpdates(prev => prev.filter(u => u.updateId !== updateId));
        } catch (err: any) {
            console.error('Error deleting update:', err);
            Alert.alert('Error', 'Failed to delete update');
        }
    };

    const getNotificationIcon = (update: MobileUpdate): string => {
        if (update.icon) return update.icon;

        const filterKey = mapCategoryToFilterKey(update.updateCategory);
        switch (filterKey) {
            case 'reservation':
                return '📅';
            case 'update':
                return '📱';
            case 'review':
                return '⭐';
            case 'restaurant_news':
                return '🍽️';
            default:
                return '📢';
        }
    };

    const handleActionButton = async (update: MobileUpdate): Promise<void> => {
        if (!update.actionButton?.data) return;

        const {screen, ...params} = update.actionButton.data;

        if (!screen) return;

        try {
            // Handle ReviewScreen navigation (support both "Review" and "ReviewScreen" from backend)
            if ((screen === 'ReviewScreen' || screen === 'Review') && params.reservationId) {
                // Fetch the full reservation data needed by ReviewScreen
                const reservationDtos = await processingService.getCustomerReservations();
                const dto = reservationDtos.find(r => r.reservationId === params.reservationId);

                if (!dto) {
                    Alert.alert('Error', 'Reservation not found. It may have been cancelled or deleted.');
                    return;
                }

                // Map DTO to Reservation type expected by ReviewScreen
                const reservation = mapReservationDtoToReservation(dto);

                navigation.navigate('ReviewScreen', {
                    reservation: reservation,
                    restaurantId: params.restaurantId,
                    reservationId: params.reservationId,
                    updateId: update.updateId ?? undefined,
                });
            } else {
                console.warn('Unknown screen:', screen);
            }
        } catch (error) {
            console.error('Failed to handle action button:', error);
            Alert.alert('Error', 'Failed to load reservation details. Please try again.');
        }
    };

    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'high':
                return '#FF3B30';
            case 'medium':
                return '#FF9500';
            case 'low':
                return '#007AFF';
            default:
                return '#007AFF';
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
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    };

    const renderNotificationItem: ListRenderItem<MobileUpdate> = ({item}) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.isRead && styles.unreadNotification
            ]}
            onPress={() => !item.isRead && item.updateId && markAsRead(item.updateId)}
        >
            <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                    <View style={styles.iconContainer}>
                        {item.restaurantImageUrl ? (
                            <Image source={{uri: item.restaurantImageUrl}} style={styles.restaurantIcon}/>
                        ) : (
                            <Text style={styles.notificationIcon}>{getNotificationIcon(item)}</Text>
                        )}
                        {!item.isRead && (
                            <View style={[styles.priorityDot, {backgroundColor: getPriorityColor(item.priority)}]}/>
                        )}
                    </View>

                    <View style={styles.notificationText}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
                                {item.title}
                            </Text>
                            <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
                        </View>

                        {item.restaurantName && (
                            <Text style={styles.restaurantName}>{item.restaurantName}</Text>
                        )}

                        <Text style={styles.notificationMessage} numberOfLines={2}>
                            {item.message}
                        </Text>

                        {item.actionButton && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleActionButton(item)}
                            >
                                <Text style={styles.actionButtonText}>{item.actionButton.label}</Text>
                                <Ionicons name="arrow-forward" size={14} color="#007AFF"/>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => item.updateId && deleteNotification(item.updateId)}
            >
                <Ionicons name="trash-outline" size={20} color="#999"/>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderFilterChip = (filter: FilterOption): JSX.Element => (
        <TouchableOpacity
            key={filter.key}
            style={[
                styles.filterChip,
                activeFilter === filter.key && styles.activeFilterChip
            ]}
            onPress={() => setActiveFilter(filter.key)}
        >
            <Ionicons
                name={filter.icon}
                size={16}
                color={activeFilter === filter.key ? '#fff' : '#666'}
            />
            <Text style={[
                styles.filterText,
                activeFilter === filter.key && styles.activeFilterText
            ]}>
                {filter.label}
            </Text>
        </TouchableOpacity>
    );

    // Show loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Updates</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading updates...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Updates</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorTitle}>Failed to Load</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchUpdates}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitle}>
                    <Text style={styles.title}>Updates</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>

                {unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllReadButton} onPress={markAllAsRead}>
                        <Text style={styles.markAllReadText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                {filterOptions.map(renderFilterChip)}
            </ScrollView>

            {/* Notifications List */}
            <FlatList
                data={updates}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.updateId?.toString() || Math.random().toString()}
                style={styles.notificationsList}
                contentContainerStyle={styles.notificationsContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#007AFF"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateIcon}>📱</Text>
                        <Text style={styles.emptyStateTitle}>No Updates</Text>
                        <Text style={styles.emptyStateMessage}>
                            {activeFilter === 'all'
                                ? "You're all caught up! New notifications will appear here."
                                : `No ${filterOptions.find(f => f.key === activeFilter)?.label.toLowerCase()} notifications.`
                            }
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    } as ViewStyle,
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    } as ViewStyle,
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    } as TextStyle,
    unreadBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
        minWidth: 24,
        alignItems: 'center',
    } as ViewStyle,
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    } as TextStyle,
    markAllReadButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    } as ViewStyle,
    markAllReadText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    } as TextStyle,
    filtersContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        maxHeight: 60, // Add this to constrain the height
    } as ViewStyle,

    filtersContent: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center', // Change back to center for proper alignment
        flexGrow: 0, // Add this to prevent expansion
    } as ViewStyle,
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 10, // Further reduced from 12
        paddingVertical: 4, // Further reduced from 6
        borderRadius: 12, // Further reduced from 16 for smaller appearance
        marginRight: 6, // Further reduced from 8
        borderWidth: 1,
        borderColor: '#e9ecef',
        minHeight: 28, // Further reduced from 32
    } as ViewStyle,
    filterText: {
        fontSize: 12, // Further reduced from 13
        color: '#666',
        marginLeft: 4, // Further reduced from 6
        fontWeight: '500',
    } as TextStyle,
    activeFilterChip: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    } as ViewStyle,
    activeFilterText: {
        color: '#fff',
        fontWeight: '600',
    } as TextStyle,
    notificationsList: {
        flex: 1,
        paddingTop: 0, // Add small padding to bring notifications closer to filters
    } as ViewStyle,
    notificationsContent: {
        paddingTop: 8,
    } as ViewStyle,

    notificationItem: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 2, // Reduce from 4 to 2 - this reduces space between notifications AND the first notification gap
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    } as ViewStyle,
    unreadNotification: {
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    } as ViewStyle,
    notificationContent: {
        flex: 1,
    } as ViewStyle,
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    } as ViewStyle,
    iconContainer: {
        position: 'relative',
        marginRight: 12,
    } as ViewStyle,
    restaurantIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
    } as ImageStyle,
    notificationIcon: {
        fontSize: 24,
        width: 40,
        height: 40,
        textAlign: 'center',
        textAlignVertical: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        overflow: 'hidden',
    } as TextStyle,
    priorityDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
    } as ViewStyle,
    notificationText: {
        flex: 1,
    } as ViewStyle,
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 2,
    } as ViewStyle,
    notificationTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flex: 1,
        marginRight: 8,
    } as TextStyle,
    unreadTitle: {
        fontWeight: '600',
    } as TextStyle,
    timestamp: {
        fontSize: 12,
        color: '#999',
    } as TextStyle,
    restaurantName: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
        marginBottom: 4,
    } as TextStyle,
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    } as TextStyle,
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#007AFF',
    } as ViewStyle,
    actionButtonText: {
        color: '#007AFF',
        fontSize: 12,
        fontWeight: '500',
        marginRight: 4,
    } as TextStyle,
    deleteButton: {
        padding: 8,
    } as ViewStyle,
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    } as ViewStyle,
    emptyStateIcon: {
        fontSize: 64,
        marginBottom: 16,
    } as TextStyle,
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    } as TextStyle,
    emptyStateMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    } as TextStyle,
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    } as TextStyle,
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    } as ViewStyle,
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    } as TextStyle,
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    } as TextStyle,
    errorMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    } as TextStyle,
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    } as ViewStyle,
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    } as TextStyle,
});

export default UpdatesScreen;