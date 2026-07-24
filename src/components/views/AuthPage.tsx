import { useState, useEffect } from 'react';
import { GraduationCap, Mail, Lock, User as UserIcon, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { LandingPage } from '@/components/views/LandingPage';

type Mode = 'signin' | 'signup' | 'reset' | 'verify';

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const toast = useToast();

  const [showAuthModal, setShowAuthModal] = useState(false);
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

  function openModal(initialMode: Mode) {
    setMode(initialMode);
    setShowAuthModal(true);
  }

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
    <div className="relative">
      {/* Landing Page Content */}
      <LandingPage
        onGetStarted={() => openModal('signup')}
        onSignIn={() => openModal('signin')}
      />

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="relative w-full max-w-md card p-6 sm:p-8 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-2">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Lumora</h2>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">AI Study Planner</p>
            </div>

            {mode === 'verify' ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-success-50 dark:bg-success-950/30 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-success-500" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Account Created!</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  Welcome to Lumora, {fullName || 'student'}!
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-5">
                  Sign in with your credentials to launch your planner.
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
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Check Your Email</h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-5">
                  We've sent a reset link to <span className="font-medium text-neutral-600 dark:text-neutral-300">{email}</span>.
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
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1 text-center">
                  {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
                </h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-5 text-center">
                  {mode === 'signin'
                    ? 'Sign in to continue your study journey'
                    : mode === 'signup'
                    ? 'Start planning smarter today'
                    : "Enter your email and we'll send a reset link"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {mode === 'signup' && (
                    <div>
                      <label className="label text-[10px]">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="text"
                          maxLength={100}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Jane Doe"
                          className="input pl-10 text-xs"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="label text-[10px]">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="email"
                        maxLength={100}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input pl-10 text-xs"
                        required
                      />
                    </div>
                  </div>

                  {mode !== 'reset' && (
                    <div>
                      <label className="label text-[10px]">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          maxLength={72}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                          className="input pl-10 pr-10 text-xs"
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
                    <div className="text-xs text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-950/30 rounded-xl px-3.5 py-2 animate-slide-up">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center text-xs py-2.5"
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

                <div className="mt-4 space-y-1.5">
                  {mode === 'signin' && (
                    <>
                      <button
                        onClick={() => setMode('reset')}
                        className="w-full text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-primary-600 transition-colors"
                      >
                        Forgot your password?
                      </button>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                        Don't have an account?{' '}
                        <button
                          onClick={() => setMode('signup')}
                          className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                        >
                          Sign up
                        </button>
                      </p>
                    </>
                  )}
                  {mode === 'signup' && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                      Already have an account?{' '}
                      <button
                        onClick={() => setMode('signin')}
                        className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                  {mode === 'reset' && (
                    <button
                      onClick={() => setMode('signin')}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to sign in
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}