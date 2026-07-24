import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as defineJeepSqlite } from 'jeep-sqlite/loader';
import App from './App';

// Ionic core styles
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/text-alignment.css';

// App theme
import './theme/variables.css';
import './theme/global.css';

async function bootstrap() {
  // Register the jeep-sqlite web component and provide the web store element
  // when running in the browser preview (native uses the real SQLite plugin).
  if (Capacitor.getPlatform() === 'web') {
    await defineJeepSqlite(window);
    await customElements.whenDefined('jeep-sqlite');
    const jeepEl = document.createElement('jeep-sqlite');
    document.body.appendChild(jeepEl);
  }

  const container = document.getElementById('root')!;
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
