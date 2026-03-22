import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

function dashboardPathForRole(role) {
    if (role === 'admin') {
        return '/admin';
    }

    return '/student';
}

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const user = await login(form);
            const fromPath = location.state?.from?.pathname;

            navigate(fromPath || dashboardPathForRole(user.role), {
                replace: true,
            });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center px-4 py-8 sm:px-0">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Sign in as student or admin</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                required
                            />
                        </div>

                        {error ? <p className="text-sm text-red-600">{error}</p> : null}

                        <Button className="w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </Button>

                        <p className="text-xs text-slate-500">
                            Demo credentials will be provided in the setup summary.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
