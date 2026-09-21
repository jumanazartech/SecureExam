import React from 'react';

// Prevents a render error in one screen from blanking the whole app.
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('UI crashed:', error, info?.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-nearblack p-6">
                <div className="max-w-md w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
                    <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Something went wrong</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 break-words">{String(this.state.error?.message || this.state.error)}</p>
                    <button onClick={() => window.location.reload()} className="mt-6 h-11 px-5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Reload</button>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
