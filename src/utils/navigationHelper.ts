// src/utils/navigationHelper.ts
import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

// Create a navigation ref that can be accessed from anywhere
export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a screen from anywhere in the app (even outside React components)
 */
export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  } else {
    console.warn('[NavigationHelper] Navigation not ready yet');
  }
}

/**
 * Navigate to Login screen and reset navigation stack
 * This ensures user can't go back to protected screens after logout
 */
export function navigateToLogin() {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { name: 'MainTabs' },
          { name: 'Login' },
        ],
      })
    );
    console.log('[NavigationHelper] Navigated to Login screen');
  } else {
    console.warn('[NavigationHelper] Navigation not ready, cannot navigate to Login');
  }
}

/**
 * Go back in navigation
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}
