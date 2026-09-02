import React, { useState, useEffect } from 'react';
import { 
  Feather, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Compass, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Check,
  X,
  Zap,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  loginWithEmail, 
  signupWithEmail, 
  loginAsGuest, 
  resetPasswordWithEmail,
  instantResetUserPassword
} from '../services/firebase';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Password reset state
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [resetMethod, setResetMethod] = useState<'instant' | 'email'>('instant');
  const [resetEmail, setResetEmail] = useState('');
  const [resetName, setResetName] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Status & validation error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Countdown timer for email resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Password Strength Calculation
  const calculatePasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-amber-400' };
    if (score === 2 || score === 3) return { score: 2, label: 'Good', color: 'bg-emerald-500' };
    return { score: 3, label: 'Strong', color: 'bg-[#3b5d4f]' };
  };

  const passwordStrength = calculatePasswordStrength(signupPassword);
  const resetPasswordStrength = calculatePasswordStrength(resetNewPassword);

  // 1. Strict Login Form Submission
  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = loginEmail.trim();
    const passTrimmed = loginPassword;

    if (!emailTrimmed || !passTrimmed) {
      setErrorMessage('Please enter both your email address and password to sign in.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginWithEmail(emailTrimmed, passTrimmed);
      onLoginSuccess(user);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const code = (err as { code?: string })?.code || '';
      
      if (
        code === 'auth/invalid-credential' || 
        code === 'auth/user-not-found' || 
        code === 'auth/wrong-password'
      ) {
        setErrorMessage('Invalid email or password. If you forgot your password, click "Forgot password?" below to reset it instantly.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address format (e.g. name@example.com).');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Access temporarily blocked due to multiple attempts. Use "Forgot password?" for Instant In-App Reset.');
      } else {
        setErrorMessage((err as Error)?.message || 'Unable to sign in. Please verify your email and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Strict Sign Up Form Submission
  const handleSignupFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameTrimmed = signupName.trim();
    const emailTrimmed = signupEmail.trim();

    if (!nameTrimmed) {
      setErrorMessage('Please enter your full name so we can personalize your sanctuary.');
      return;
    }
    if (!emailTrimmed || !emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your confirmation password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await signupWithEmail(emailTrimmed, signupPassword, nameTrimmed);
      setSuccessMessage('Account created successfully! Welcome to Lumina.');
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } catch (err: unknown) {
      console.error('Signup error:', err);
      const code = (err as { code?: string })?.code || '';

      if (code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email address already exists. Please switch to Sign In or use Forgot Password.');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please choose a password with at least 6 characters.');
      } else {
        setErrorMessage((err as Error)?.message || 'Account registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3A. Method 1: Instant In-App Reset (Zero Wait / No Email Delay)
  const handleInstantPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = resetEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please provide a valid registered email address.');
      return;
    }
    if (resetNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setErrorMessage('New passwords do not match. Please verify your entries.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await instantResetUserPassword(cleanEmail, resetNewPassword, resetName.trim());
      setSuccessMessage('Password reset successfully! Logging into your sanctuary...');
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch (err: unknown) {
      console.error('Instant reset error:', err);
      setErrorMessage((err as Error)?.message || 'Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3B. Method 2: Send Official Email Reset Link
  const handleSendEmailResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address to receive reset instructions.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await resetPasswordWithEmail(cleanEmail);
      setEmailSentSuccess(true);
      setResendCountdown(45);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setErrorMessage('Firebase Email provider is disabled in console. Switched you to Instant In-App Reset to set your password directly!');
        setResetMethod('instant');
      } else if (code === 'auth/user-not-found') {
        setErrorMessage('No registered account was found with that email address. You can use the "Instant In-App Reset" tab to set up credentials.');
      } else {
        setErrorMessage((err as Error)?.message || 'Could not send reset email. Use Instant In-App Reset tab instead.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Guest Exploration
  const handleGuestLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const guestProfile = await loginAsGuest();
      onLoginSuccess(guestProfile);
    } catch (err: unknown) {
      console.warn('Guest login notice:', err);
      const guestUser: UserProfile = {
        id: `guest-${Date.now()}`,
        name: 'Guest Explorer',
        email: 'guest@lumina.local',
        isGuest: true,
        createdAt: Date.now(),
      };
      onLoginSuccess(guestUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fbf9f5] flex items-center justify-center p-4 sm:p-6 text-[#242f28] relative overflow-hidden">
      
      {/* Ambient background decoration */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#e8efe9]/60 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#f2ebd9]/70 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Main Card Container */}
        <div className="rounded-3xl bg-white border border-[#e6ded2] shadow-xl p-6 sm:p-8 space-y-6">
          
          {/* Header Brand Section */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-br from-[#3f5d50] to-[#253930] text-white shadow-md mx-auto ring-4 ring-[#e9f0ec]">
              <Feather className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1e2822] tracking-tight">
                Lumina
              </h1>
              <p className="text-xs sm:text-sm text-[#736858] max-w-xs mx-auto leading-relaxed">
                Your mindful sanctuary for daily stories, personal reflections, and peaceful thoughts
              </p>
            </div>
          </div>

          {/* Segmented Tab Controls: Sign In vs Create Account */}
          {!showResetPrompt && (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#f2ece1] border border-[#ded5c6]">
              <button
                id="login-tab-btn"
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'login'
                    ? 'bg-white text-[#212b25] shadow-xs font-bold'
                    : 'text-[#6e6353] hover:text-[#212b25]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                id="signup-tab-btn"
                type="button"
                onClick={() => {
                  setTab('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'signup'
                    ? 'bg-white text-[#212b25] shadow-xs font-bold'
                    : 'text-[#6e6353] hover:text-[#212b25]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#3f5d50]" />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Notification Messages */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-[#fef2f2] border border-[#fecaca] text-xs text-[#991b1b] flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626] mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              <button 
                type="button" 
                onClick={() => setErrorMessage(null)}
                className="text-[#991b1b] hover:text-[#450a0a] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#166534] flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16a34a]" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* ═════════════════ 1. SIGN IN FORM ═════════════════ */}
          {tab === 'login' && !showResetPrompt && (
            <form onSubmit={handleLoginFormSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="login-email" 
                  className="block text-xs font-semibold text-[#483d2e]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="login-password" 
                    className="block text-xs font-semibold text-[#483d2e]"
                  >
                    Password
                  </label>
                  <button
                    id="forgot-password-link"
                    type="button"
                    onClick={() => {
                      setResetEmail(loginEmail);
                      setShowResetPrompt(true);
                      setEmailSentSuccess(false);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-[#4f7062] hover:text-[#2d463b] font-semibold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#918574] hover:text-[#3f5d50] p-1 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Sign In Button */}
              <button
                id="submit-login-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#3f5d50] hover:bg-[#314a3f] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer pt-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in securely...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Sanctuary</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ═════════════════ 2. FORGOT PASSWORD / ACCOUNT RECOVERY FLOW ═════════════════ */}
          {showResetPrompt && (
            <div className="space-y-4">
              
              {/* Reset Header */}
              <div className="flex items-center justify-between border-b border-[#f0e9dc] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#ebf3ee] text-[#3f5d50] flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#1e2a22]">
                      Account Recovery
                    </h3>
                    <p className="text-[10px] text-[#786b59]">
                      Choose your preferred password recovery method
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPrompt(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-[#6e6353] hover:text-[#1e2a22] font-semibold hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>

              {/* Recovery Method Switcher */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#f2ece1] border border-[#ded5c6]">
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('instant');
                    setErrorMessage(null);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    resetMethod === 'instant'
                      ? 'bg-white text-[#212b25] shadow-xs font-bold'
                      : 'text-[#6e6353] hover:text-[#212b25]'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>Instant Reset (No Email)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('email');
                    setErrorMessage(null);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    resetMethod === 'email'
                      ? 'bg-white text-[#212b25] shadow-xs font-bold'
                      : 'text-[#6e6353] hover:text-[#212b25]'
                  }`}
                >
                  <Mail className="w-3 h-3 text-[#3f5d50]" />
                  <span>Email Link</span>
                </button>
              </div>

              {/* ── Option A: Instant In-App Reset (Zero Wait) ── */}
              {resetMethod === 'instant' && (
                <form onSubmit={handleInstantPasswordReset} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-[#f5f8f6] border border-[#d2dfd7] text-[11px] text-[#344d40] flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Instant Recovery:</strong> Set a new password right now without waiting for email delivery.
                    </span>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#483d2e]">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your.registered.email@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Account Name / Verification */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#483d2e]">
                      Account Name / Identity
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={resetName}
                        onChange={(e) => setResetName(e.target.value)}
                        placeholder="e.g. Sahil Firoz"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-[#483d2e]">
                        New Password
                      </label>
                      {resetNewPassword.length > 0 && (
                        <span className="text-[10px] font-semibold text-[#5a6e63]">
                          {resetPasswordStrength.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showResetNewPassword ? 'text' : 'password'}
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Enter your new password (min 6 characters)"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#918574] hover:text-[#3f5d50] p-1 cursor-pointer"
                      >
                        {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-[#483d2e]">
                        Confirm New Password
                      </label>
                      {resetConfirmPassword.length > 0 && (
                        <span className="text-[10px] font-semibold flex items-center gap-1">
                          {resetNewPassword === resetConfirmPassword ? (
                            <span className="text-emerald-700 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Match
                            </span>
                          ) : (
                            <span className="text-amber-700 flex items-center gap-0.5">
                              <X className="w-3 h-3" /> Differs
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showResetNewPassword ? 'text' : 'password'}
                        required
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#3f5d50] hover:bg-[#314a3f] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer pt-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating credentials...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Reset Password & Sign In Immediately</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ── Option B: Email Link with Status Card & Spam Guidance ── */}
              {resetMethod === 'email' && (
                <div className="space-y-3">
                  {!emailSentSuccess ? (
                    <form onSubmit={handleSendEmailResetLink} className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#483d2e]">
                          Account Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#3f5d50] hover:bg-[#314a3f] text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Dispatching reset link...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            <span>Send Official Reset Link</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Email Sent Info Card */
                    <div className="space-y-3 animate-fadeIn">
                      <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] space-y-2 text-left">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#166534]">
                          <Inbox className="w-4 h-4 text-[#16a34a]" />
                          <span>Reset link dispatched to:</span>
                        </div>
                        <div className="text-xs font-mono font-semibold text-[#14532d] bg-white/80 px-2 py-1 rounded-lg border border-[#bbf7d0]">
                          {resetEmail}
                        </div>
                        
                        {/* Critical Spam Guidance */}
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1 mt-2">
                          <div className="font-bold flex items-center gap-1 text-amber-800">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Important: Check Spam / Junk Folder</span>
                          </div>
                          <p className="leading-relaxed text-[10px] text-amber-800/90">
                            Automated emails from Firebase (<code className="font-mono text-[9px] bg-amber-100 px-1 py-0.5 rounded">noreply@gen-lang-client-0034752370.firebaseapp.com</code>) often land in your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> tab.
                          </p>
                        </div>
                      </div>

                      {/* Fallback to Instant Reset if email is delayed */}
                      <button
                        type="button"
                        onClick={() => setResetMethod('instant')}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Email not arriving? Reset Instantly In-App</span>
                      </button>

                      {/* Resend button with countdown */}
                      <button
                        type="button"
                        disabled={resendCountdown > 0 || isLoading}
                        onClick={handleSendEmailResetLink}
                        className="w-full py-2 px-3 rounded-xl border border-[#ded5c6] text-xs font-semibold text-[#5c4f3e] hover:bg-[#f6f2ea] flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>
                          {resendCountdown > 0
                            ? `Resend available in ${resendCountdown}s`
                            : 'Resend Reset Email'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ═════════════════ 3. CREATE ACCOUNT / SIGN UP FORM ═════════════════ */}
          {tab === 'signup' && !showResetPrompt && (
            <form onSubmit={handleSignupFormSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label 
                  htmlFor="signup-name" 
                  className="block text-xs font-semibold text-[#483d2e]"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Sahil Firoz"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label 
                  htmlFor="signup-email" 
                  className="block text-xs font-semibold text-[#483d2e]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="signup-password" 
                    className="block text-xs font-semibold text-[#483d2e]"
                  >
                    Password
                  </label>
                  {signupPassword.length > 0 && (
                    <span className="text-[10px] font-semibold text-[#5a6e63]">
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#918574] hover:text-[#3f5d50] p-1 cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator Bars */}
                {signupPassword.length > 0 && (
                  <div className="flex items-center gap-1 pt-1">
                    <div className={`h-1 flex-1 rounded-full transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-gray-200'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-gray-200'}`} />
                    <div className={`h-1 flex-1 rounded-full transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-gray-200'}`} />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="signup-confirm-password" 
                    className="block text-xs font-semibold text-[#483d2e]"
                  >
                    Confirm Password
                  </label>
                  {signupConfirmPassword.length > 0 && (
                    <span className="text-[10px] font-semibold flex items-center gap-1">
                      {signupPassword === signupConfirmPassword ? (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Match
                        </span>
                      ) : (
                        <span className="text-amber-700 flex items-center gap-0.5">
                          <X className="w-3 h-3" /> Passwords differ
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#918574] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-confirm-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f4] border border-[#ded5c6] text-xs sm:text-sm text-[#1e2822] placeholder:text-[#a89d8c] focus:bg-white focus:ring-2 focus:ring-[#3f5d50]/20 focus:border-[#3f5d50] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Sign Up Button */}
              <button
                id="submit-signup-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#3f5d50] hover:bg-[#314a3f] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer pt-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving your account details...</span>
                  </>
                ) : (
                  <>
                    <span>Create Sanctuary Account</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Subtle Divider */}
          {!showResetPrompt && (
            <>
              <div className="relative flex items-center justify-center pt-1">
                <div className="w-full border-t border-[#ebe4d8]" />
                <span className="bg-white px-3 text-[10px] uppercase font-bold tracking-widest text-[#9d9282] absolute">
                  Explore Without Account
                </span>
              </div>

              {/* Guest Explorer */}
              <button
                id="guest-explorer-btn"
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full group py-3 px-4 rounded-2xl bg-[#f5f8f6] border border-[#d2dfd7] hover:border-[#3f5d50] hover:bg-[#ebf3ee] transition-all flex items-center justify-between active:scale-[0.99] disabled:opacity-50 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#3f5d50] flex items-center justify-center border border-[#d2dfd7] shadow-xs group-hover:scale-105 transition-transform">
                    <Compass className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-[#1e2a22]">
                      Continue as Guest Explorer
                    </div>
                    <div className="text-[11px] text-[#607469]">
                      Explore all journal features in private offline sandbox
                    </div>
                  </div>
                </div>

                <div className="w-6 h-6 rounded-full bg-white text-[#3f5d50] flex items-center justify-center border border-[#d2dfd7] group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </>
          )}

          {/* Footer Security Guarantees */}
          <div className="pt-2 border-t border-[#f1ebe0] flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] text-[#8c8070] text-center">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3f5d50]" />
              <span>256-bit encrypted storage</span>
            </div>
            <span className="hidden sm:inline text-[#d5ccbe]">•</span>
            <span>Your journal entries remain strictly confidential</span>
          </div>

        </div>

      </div>
    </div>
  );
};
