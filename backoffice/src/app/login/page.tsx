'use client';
import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Surface, Stack, Heading, Text, Field, Input, Button } from '@cre/web-ui';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const redirect = searchParams.get('redirect') ?? '/projects';
      router.replace(redirect);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Incorrect email or password.');
      } else if (code === 'auth/user-not-found') {
        setError('No account found with that email.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '16px' }}>
      <Surface variant="raised" padding="medium" style={{ width: '100%', maxWidth: '400px' }}>
        <form onSubmit={handleSubmit}>
          <Stack gap="small">
            <Heading level={3}>Sign in</Heading>
            
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(value) => setEmail(value)}
                autoComplete="email"
                inputProps={{ required: true }}
              />
            </Field>

            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(value) => setPassword(value)}
                autoComplete="current-password"
                inputProps={{ required: true }}
              />
            </Field>

            {error && <Text style={{ color: 'var(--cre-feedback-error-text)' }}>{error}</Text>}

            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </form>
      </Surface>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
