import { createRoot } from 'react-dom/client';
import '@rimori/react-client/dist/style.css';
import App from './App.tsx';
import './index.css';
import './globals.css';

createRoot(document.getElementById('root')!).render(<App />);
