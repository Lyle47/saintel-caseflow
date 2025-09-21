import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  
  const [isLogin, setIsLogin] = useState(mode !== 'reset' && mode !== 'update-password');
  const [isReset, setIsReset] = useState(mode === 'reset');
  const [isUpdatePassword, setIsUpdatePassword] = useState(mode === 'update-password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, resetPassword, updatePassword, user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUpdatePassword) {
      navigate('/');
    }
  }, [user, navigate, isUpdatePassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isUpdatePassword) {
        if (password !== confirmPassword) {
          toast({
            variant: "destructive",
            title: "Password mismatch",
            description: "Passwords do not match.",
          });
          return;
        }
        if (password.length < 6) {
          toast({
            variant: "destructive",
            title: "Password too short", 
            description: "Password must be at least 6 characters long.",
          });
          return;
        }
        const result = await updatePassword(password);
        if (!result.error) {
          toast({
            title: "Password updated successfully!",
            description: "You can now sign in with your new password.",
          });
          // Clear the mode and redirect to login
          setIsUpdatePassword(false);
          setIsLogin(true);
          navigate('/auth');
        }
      } else if (isReset) {
        await resetPassword(email);
        // Stay on reset form after sending email
      } else if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">SageIntel</h1>
          <p className="text-muted-foreground">Case Management System</p>
        </div>

        <Card>
          <CardHeader>
            <div className="text-center">
              {(isReset || isUpdatePassword) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsReset(false);
                    setIsUpdatePassword(false);
                    setIsLogin(true);
                    navigate('/auth');
                  }}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              )}
              <CardTitle>
                {isUpdatePassword ? 'Update Password' : isReset ? 'Reset Password' : isLogin ? 'Sign In' : 'Create Account'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !isReset && !isUpdatePassword && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
              )}
              {!isUpdatePassword && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder={
                        isReset 
                          ? "Enter your email address" 
                          : isLogin 
                            ? "Enter your email" 
                            : "Enter your @sageintel.co.za email"
                      }
                      required
                    />
                  </div>
                  {!isLogin && !isReset && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Only @sageintel.co.za email addresses are allowed to register.
                    </p>
                  )}
                  
                  {isReset && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  )}
                </div>
              )}
              
              {(!isReset || isUpdatePassword) && (
                <div className="space-y-2">
                  <Label htmlFor="password">{isUpdatePassword ? 'New Password' : 'Password'}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      placeholder={isUpdatePassword ? "Enter your new password" : "Enter your password"}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {isUpdatePassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Confirm your new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long.
                  </p>
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? 'Processing...' 
                  : isUpdatePassword
                    ? 'Update Password'
                    : isReset 
                      ? 'Send Reset Link' 
                      : isLogin 
                        ? 'Sign In' 
                        : 'Create Account'
                }
              </Button>
              
              {isLogin && !isUpdatePassword && (
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsReset(true)}
                    className="text-sm"
                  >
                    Forgot your password?
                  </Button>
                </div>
              )}
            </form>
            
            {!isReset && !isUpdatePassword && (
              <>
                <Separator className="my-6" />
                
                <div className="text-center">
                  <p className="text-muted-foreground">
                    {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setIsLogin(!isLogin)}
                    className="p-0"
                  >
                    {isLogin ? 'Create one here' : 'Sign in here'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Secure • Compliant • Professional</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;