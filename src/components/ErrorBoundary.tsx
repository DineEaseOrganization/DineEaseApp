import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontSize, Spacing } from '../theme';
import { r } from '../theme/responsive';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['5'],
    backgroundColor: '#fff',
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: r(10),
  },
  message: {
    fontSize: FontSize.base,
    color: '#666',
    textAlign: 'center',
  },
});

export default ErrorBoundary;
