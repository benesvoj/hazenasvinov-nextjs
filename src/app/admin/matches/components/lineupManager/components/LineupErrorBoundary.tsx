import React, {Component, ErrorInfo, ReactNode} from 'react';

import {Card, CardBody, Button} from '@heroui/react';

import {ExclamationTriangleIcon, ArrowPathIcon} from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class LineupErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LineupErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({hasError: false, error: undefined, errorInfo: undefined});
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="text-center py-8">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Chyba při načítání sestavy</h3>
            <p className="text-red-600 mb-4">
              Omlouváme se, došlo k neočekávané chybě. Zkuste to prosím znovu.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-sm text-red-700 mb-4">
                <summary className="cursor-pointer font-medium">
                  Technické detaily (pouze pro vývojáře)
                </summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <Button
              color="primary"
              variant="solid"
              startContent={<ArrowPathIcon className="w-4 h-4" />}
              onPress={this.handleRetry}
            >
              Zkusit znovu
            </Button>
          </CardBody>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default LineupErrorBoundary;
