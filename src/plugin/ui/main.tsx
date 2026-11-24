import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import { PluginApp } from './PluginApp';
import { ErrorBoundary } from './ErrorBoundary';
import { pluginLogger } from './pluginLogger';

pluginLogger.info('Initializing Plugin UI...');

const rootElement = document.getElementById('plugin-root');
if (!rootElement) {
  pluginLogger.error('Failed to find plugin root element #plugin-root');
  throw new Error('Failed to find plugin root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <PluginApp />
    </ErrorBoundary>
  </StrictMode>
);
