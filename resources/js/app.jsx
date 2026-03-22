import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import AppShell from './AppShell';

createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <AppShell />
    </React.StrictMode>,
);
