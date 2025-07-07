import React, {JSX, useEffect, useState} from 'react';
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
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

const {width} = Dimensions.get('window');

// TypeScript interfaces
interface NotificationItem {
    id: string;
    type: 'reservation' | 'update' | 'review' | 'restaurant_news';
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    actionButton?: {
        label: string;
        action: () => void;
    };
    restaurantName?: string;
    restaurantImage?: string;
    icon?: string;
    priority: 'high' | 'medium' | 'low';
}

interface FilterOption {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface UpdatesScreenProps {
    navigation: {
        navigate: (screen: string, params?: any) => void;
    };
}

const UpdatesScreen: React.FC<UpdatesScreenProps> = ({navigation}) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    // Mock notification data
    const mockNotifications: NotificationItem[] = [
        {
            id: '1',
            type: 'reservation',
            title: 'Reservation Confirmed',
            message: 'Your table for 4 at The Mediterranean Terrace tomorrow at 7:30 PM has been confirmed.',
            timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            isRead: false,
            priority: 'high',
            restaurantName: 'The Mediterranean Terrace',
            restaurantImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100',
            actionButton: {
                label: 'View Details',
                action: () => navigation.navigate('Bookings')
            }
        },
        {
            id: '2',
            type: 'update',
            title: 'App Update Available',
            message: 'Version 2.1.0 is now available with improved map search and faster booking.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            isRead: false,
            priority: 'medium',
            icon: '📱',
            actionButton: {
                label: 'Update Now',
                action: () => Alert.alert('Update', 'Redirecting to app store...')
            }
        },
        {
            id: '3',
            type: 'review',
            title: 'Rate Your Experience',
            message: 'How was your dinner at Sushi Zen? Share your experience and help other diners.',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            isRead: true,
            priority: 'medium',
            restaurantName: 'Sushi Zen',
            restaurantImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=100',
            actionButton: {
                label: 'Write Review',
                action: () => Alert.alert('Review', 'Opening review form...')
            }
        },
        {
            id: '4',
            type: 'restaurant_news',
            title: 'New Restaurant Added',
            message: 'Discover "Aphrodite\'s Kitchen" - Authentic Cypriot cuisine now available for booking.',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isRead: true,
            priority: 'low',
            restaurantImage: 'https://images.unsplash.com/photo-1562788869-4ed32648eb72?w=100',
            actionButton: {
                label: 'Explore',
                action: () => navigation.navigate('Discover')
            }
        },
        {
            id: '5',
            type: 'review',
            title: 'Review Reminder',
            message: 'Don\'t forget to rate your recent dining experience at The Mediterranean Terrace.',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            isRead: true,
            priority: 'low',
            restaurantName: 'The Mediterranean Terrace',
            restaurantImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100',
            actionButton: {
                label: 'Write Review',
                action: () => Alert.alert('Review', 'Opening review form...')
            }
        }
    ];

    const filterOptions: FilterOption[] = [
        {key: 'all', label: 'All', icon: 'notifications-outline'},
        {key: 'reservation', label: 'Bookings', icon: 'calendar-outline'},
        {key: 'update', label: 'Updates', icon: 'download-outline'},
        {key: 'review', label: 'Reviews', icon: 'star-outline'},
    ];

    useEffect(() => {
        setNotifications(mockNotifications);
        const unread = mockNotifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
    }, []);

    const onRefresh = async (): Promise<void> => {
        setRefreshing(true);
        // Simulate API call
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    const markAsRead = (id: string): void => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? {...notification, isRead: true}
                    : notification
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = (): void => {
        setNotifications(prev =>
            prev.map(notification => ({...notification, isRead: true}))
        );
        setUnreadCount(0);
    };

    const deleteNotification = (id: string): void => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const filteredNotifications = notifications.filter(notification =>
        activeFilter === 'all' || notification.type === activeFilter
    );

    const getNotificationIcon = (notification: NotificationItem): string => {
        if (notification.icon) return notification.icon;

        switch (notification.type) {
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

    const formatTimestamp = (timestamp: Date): string => {
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

    const renderNotificationItem: ListRenderItem<NotificationItem> = ({item}) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.isRead && styles.unreadNotification
            ]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                    <View style={styles.iconContainer}>
                        {item.restaurantImage ? (
                            <Image source={{uri: item.restaurantImage}} style={styles.restaurantIcon}/>
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
                            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
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
                                onPress={item.actionButton.action}
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
                onPress={() => deleteNotification(item.id)}
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
                data={filteredNotifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.id}
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
});

export default UpdatesScreen;