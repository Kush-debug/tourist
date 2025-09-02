import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Mail, Phone, Globe, Key, QrCode, Copy, Check } from 'lucide-react';
import { apiService } from '@/services/ApiService';
import { blockchainService } from '@/services/BlockchainService';
import QRCode from 'qrcode';

interface User {
  id: number;
  email: string;
  name: string;
  nationality?: string;
  phone_number?: string;
  blockchain_wallet: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export const UserAuth: React.FC<{
  onAuthChange: (authState: AuthState) => void;
}> = ({ onAuthChange }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [walletQR, setWalletQR] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    nationality: '',
    phone_number: ''
  });

  // Check for existing authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token and get user profile
      apiService.getUserProfile()
        .then(user => {
          setAuthState({
            isAuthenticated: true,
            user,
            token
          });
          onAuthChange({
            isAuthenticated: true,
            user,
            token
          });
        })
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token');
        });
    }
  }, [onAuthChange]);

  // Generate wallet QR code
  const generateWalletQR = async (walletAddress: string) => {
    try {
      const qrData = blockchainService.generateWalletQR({
        address: walletAddress,
        privateKey: '', // Don't include private key in QR
        publicKey: ''
      });
      const qrCode = await QRCode.toDataURL(qrData);
      setWalletQR(qrCode);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.login(loginForm.email, loginForm.password);
      
      setAuthState({
        isAuthenticated: true,
        user: response.user,
        token: response.token
      });

      onAuthChange({
        isAuthenticated: true,
        user: response.user,
        token: response.token
      });

      setSuccess('Login successful!');
      await generateWalletQR(response.user.blockchain_wallet);
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.register({
        email: registerForm.email,
        password: registerForm.password,
        name: registerForm.name,
        nationality: registerForm.nationality,
        phone_number: registerForm.phone_number
      });

      setSuccess('Registration successful! Please login with your credentials.');
      
      // Reset form
      setRegisterForm({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        nationality: '',
        phone_number: ''
      });
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    apiService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null
    });
    onAuthChange({
      isAuthenticated: false,
      user: null,
      token: null
    });
    setWalletQR('');
    setSuccess('Logged out successfully');
  };

  // Copy wallet address to clipboard
  const copyWalletAddress = async () => {
    if (authState.user?.blockchain_wallet) {
      try {
        await navigator.clipboard.writeText(authState.user.blockchain_wallet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy wallet address:', error);
      }
    }
  };

  // If user is authenticated, show profile
  if (authState.isAuthenticated && authState.user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Welcome, {authState.user.name}!
            </CardTitle>
            <CardDescription className="text-green-100">
              Your Travel Safe Shield account is active and secure
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground">{authState.user.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{authState.user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Nationality</Label>
                <p className="text-sm text-muted-foreground">
                  {authState.user.nationality || 'Not specified'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone Number</Label>
                <p className="text-sm text-muted-foreground">
                  {authState.user.phone_number || 'Not specified'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Wallet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Blockchain Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Wallet Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
                    {authState.user.blockchain_wallet}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyWalletAddress}
                    className="flex items-center gap-1"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Blockchain Network</Label>
                <Badge variant="outline" className="mt-1">
                  Travel Safe Shield Network
                </Badge>
              </div>

              {walletQR && (
                <div className="text-center">
                  <Label className="text-sm font-medium">Wallet QR Code</Label>
                  <div className="mt-2 p-4 bg-white rounded-lg inline-block">
                    <img src={walletQR} alt="Wallet QR Code" className="w-32 h-32" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this QR code to connect with other users
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Account Status</h3>
                <p className="text-sm text-muted-foreground">
                  Your account is verified and ready for use
                </p>
              </div>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {success && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Show login/register forms
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6" />
            Travel Safe Shield
          </CardTitle>
          <CardDescription>
            Secure your journey with blockchain-powered safety
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-nationality">Nationality</Label>
                  <Select
                    value={registerForm.nationality}
                    onValueChange={(value) => setRegisterForm({ ...registerForm, nationality: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Japan">Japan</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="register-phone">Phone Number</Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    value={registerForm.phone_number}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};