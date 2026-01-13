import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
 children: React.ReactNode;
}

interface ErrorBoundaryState {
 hasError: boolean;
 error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
 constructor(props: ErrorBoundaryProps) {
  super(props);
  this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error: Error) {
  return { hasError: true, error };
 }

 componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error("Uncaught error:", error, errorInfo);
 }

 render() {
  if (this.state.hasError) {
   return (
    <div style={{ padding: 20, color: 'red' }}>
     <h1>Something went wrong.</h1>
     <pre>{this.state.error?.toString()}</pre>
    </div>
   );
  }

  return this.props.children;
 }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
 <StrictMode>
  <ErrorBoundary>
   <App />
  </ErrorBoundary>
 </StrictMode>
);