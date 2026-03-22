import { AuthProvider } from '@/contexts/AuthContext';
import { AppRouter } from '@/router/index';

export default function AppShell() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}
