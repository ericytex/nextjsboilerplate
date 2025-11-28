'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Key, 
  Smartphone, 
  Mail, 
  Github, 
  Chrome,
  CheckCircle2,
  XCircle,
  Save,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"

export default function AuthenticationPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [authSettings, setAuthSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    sessionTimeout: 30,
    password: '',
    newPassword: '',
    confirmPassword: '',
    oauthProviders: {
      google: { enabled: false, connected: false },
      github: { enabled: false, connected: false },
      microsoft: { enabled: false, connected: false }
    }
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (authSettings.newPassword !== authSettings.confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Password updated successfully')
      setAuthSettings({ ...authSettings, password: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthConnect = (provider: string) => {
    // TODO: Implement OAuth connection
    setAuthSettings({
      ...authSettings,
      oauthProviders: {
        ...authSettings.oauthProviders,
        [provider]: { enabled: true, connected: true }
      }
    })
    toast.success(`${provider} connected successfully`)
  }

  const handleOAuthDisconnect = (provider: string) => {
    setAuthSettings({
      ...authSettings,
      oauthProviders: {
        ...authSettings.oauthProviders,
        [provider]: { enabled: false, connected: false }
      }
    })
    toast.success(`${provider} disconnected`)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Authentication Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your login credentials, two-factor authentication, and OAuth providers
          </p>
        </div>

        <div className="grid gap-6">
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password. Use a strong, unique password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={authSettings.password}
                      onChange={(e) => setAuthSettings({ ...authSettings, password: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={authSettings.newPassword}
                      onChange={(e) => setAuthSettings({ ...authSettings, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={authSettings.confirmPassword}
                      onChange={(e) => setAuthSettings({ ...authSettings, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Require a verification code in addition to your password
                  </p>
                </div>
                <Switch
                  checked={authSettings.twoFactorEnabled}
                  onCheckedChange={(checked) => setAuthSettings({ ...authSettings, twoFactorEnabled: checked })}
                />
              </div>
              {authSettings.twoFactorEnabled && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Setup Instructions:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan the QR code that will be displayed</li>
                    <li>Enter the verification code to complete setup</li>
                  </ol>
                  <Button className="mt-4" size="sm">
                    Setup 2FA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OAuth Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Social Login Providers
              </CardTitle>
              <CardDescription>
                Connect your account with OAuth providers for easier login
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Chrome className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-muted-foreground">Sign in with your Google account</p>
                  </div>
                </div>
                {authSettings.oauthProviders.google.connected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOAuthDisconnect('google')}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOAuthConnect('google')}
                  >
                    Connect
                  </Button>
                )}
              </div>

              {/* GitHub */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Github className="h-5 w-5" />
                  <div>
                    <p className="font-medium">GitHub</p>
                    <p className="text-sm text-muted-foreground">Sign in with your GitHub account</p>
                  </div>
                </div>
                {authSettings.oauthProviders.github.connected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOAuthDisconnect('github')}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOAuthConnect('github')}
                  >
                    Connect
                  </Button>
                )}
              </div>

              {/* Microsoft */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Microsoft</p>
                    <p className="text-sm text-muted-foreground">Sign in with your Microsoft account</p>
                  </div>
                </div>
                {authSettings.oauthProviders.microsoft.connected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOAuthDisconnect('microsoft')}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOAuthConnect('microsoft')}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Session Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Session Settings</CardTitle>
              <CardDescription>
                Configure how long your sessions remain active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email alerts for new login attempts
                  </p>
                </div>
                <Switch
                  checked={authSettings.emailNotifications}
                  onCheckedChange={(checked) => setAuthSettings({ ...authSettings, emailNotifications: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={authSettings.sessionTimeout}
                  onChange={(e) => setAuthSettings({ ...authSettings, sessionTimeout: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Automatically log out after this period of inactivity
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

