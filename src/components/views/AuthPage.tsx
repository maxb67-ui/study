import { useState, useEffect } from 'react';
import { GraduationCap, Mail, Lock, User as UserIcon, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';

type Mode = 'signin' | 'signup' | 'reset' | 'verify';

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    setError('');
    setResetSent(false);
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      }
    } else if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      if (!fullName.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName.trim());
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        setMode('verify');
        setLoading(false);
      }
    } else if (mode === 'reset') {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        setResetSent(true);
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-200/30 dark:bg-primary-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-200/30 dark:bg-accent-900/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Lumora</h1>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">AI Study Planner</p>
        </div>

        <div className="card p-6 sm:p-8 animate-scale-in">
          {mode === 'verify' ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-success-500" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Account Created!</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                Welcome to Lumora, {fullName || 'student'}!
              </p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-6">
                You're all set. Sign in with your new account to start planning.
              </p>
              <button
                onClick={() => {
                  setMode('signin');
                  setPassword('');
                }}
                className="btn-primary w-full"
              >
                Sign In
              </button>
            </div>
          ) : mode === 'reset' && resetSent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary-500" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Check Your Email</h2>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-6">
                We've sent a password reset link to <span className="font-medium text-neutral-600 dark:text-neutral-300">{email}</span>. Follow the link to set a new password.
              </p>
              <button
                onClick={() => {
                  setMode('signin');
                  setResetSent(false);
                }}
                className="btn-primary w-full"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
              </h2>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-6">
                {mode === 'signin'
                  ? 'Sign in to continue your study journey'
                  : mode === 'signup'
                  ? 'Start planning smarter today'
                  : "Enter your email and we'll send a reset link"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="label">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                        className="input pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                        className="input pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-950/30 rounded-xl px-4 py-2.5 animate-slide-up">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Please wait...
                    </>
                  ) : mode === 'signin' ? (
                    'Sign In'
                  ) : mode === 'signup' ? (
                    'Create Account'
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-5 space-y-2">
                {mode === 'signin' && (
                  <>
                    <button
                      onClick={() => setMode('reset')}
                      className="w-full text-xs text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      Forgot your password?
                    </button>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                      Don't have an account?{' '}
                      <button
                        onClick={() => setMode('signup')}
                        className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                      >
                        Sign up
                      </button>
                    </p>
                  </>
                )}
                {mode === 'signup' && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('signin')}
                      className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                    >
                      Sign in
                    </button>
                    </p>
                )}
                {mode === 'reset' && (
                  <button
                    onClick={() => setMode('signin')}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-6">
          Your data is private and secure. Each account is isolated.
        </p>
      </div>
    </div>
  );
}
