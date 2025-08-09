'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cookie, Settings, Shield, BarChart3, Target, Users } from 'lucide-react';
import Link from 'next/link';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  functional: false,
};

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent');
    const savedPreferences = localStorage.getItem('cookie-preferences');

    if (consent) {
      setHasConsented(true);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } else {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    
    savePreferences(allAccepted);
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    savePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    savePreferences(defaultPreferences);
    setShowBanner(false);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', 'true');
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setPreferences(prefs);
    setHasConsented(true);

    // Apply cookie preferences
    applyCookiePreferences(prefs);
  };

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Analytics cookies
    if (prefs.analytics) {
      // Enable analytics tracking
      console.log('Analytics cookies enabled');
    } else {
      // Disable analytics tracking
      console.log('Analytics cookies disabled');
    }

    // Marketing cookies
    if (prefs.marketing) {
      // Enable marketing tracking
      console.log('Marketing cookies enabled');
    } else {
      // Disable marketing tracking
      console.log('Marketing cookies disabled');
    }

    // Functional cookies
    if (prefs.functional) {
      // Enable functional features
      console.log('Functional cookies enabled');
    } else {
      // Disable functional features
      console.log('Functional cookies disabled');
    }
  };

  const handlePreferenceChange = (type: keyof CookiePreferences, checked: boolean) => {
    if (type === 'necessary') return; // Necessary cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [type]: checked,
    }));
  };

  const cookieCategories = [
    {
      id: 'necessary' as keyof CookiePreferences,
      title: 'Necessary Cookies',
      description: 'Essential for the website to function properly. These cannot be disabled.',
      icon: Shield,
      required: true,
      examples: ['Authentication', 'Security', 'Session management'],
    },
    {
      id: 'functional' as keyof CookiePreferences,
      title: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization.',
      icon: Settings,
      required: false,
      examples: ['Language preferences', 'Theme settings', 'Reading progress'],
    },
    {
      id: 'analytics' as keyof CookiePreferences,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website.',
      icon: BarChart3,
      required: false,
      examples: ['Page views', 'User behavior', 'Performance metrics'],
    },
    {
      id: 'marketing' as keyof CookiePreferences,
      title: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements and track campaign effectiveness.',
      icon: Target,
      required: false,
      examples: ['Ad targeting', 'Social media integration', 'Campaign tracking'],
    },
  ];

  if (hasConsented && !showBanner) {
    return null;
  }

  return (
    <>
      {/* Cookie Consent Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
          <div className="container mx-auto max-w-6xl">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">We use cookies</h3>
                      <p className="text-muted-foreground text-sm">
                        We use cookies and similar technologies to enhance your browsing experience, 
                        analyze site traffic, and provide personalized content. By clicking "Accept All", 
                        you consent to our use of cookies.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      <Button onClick={handleAcceptAll} size="sm">
                        Accept All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRejectAll}
                      >
                        Reject All
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowSettings(true)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Customize
                      </Button>
                      <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:underline">
                        Privacy Policy
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Cookie className="h-5 w-5" />
              <span>Cookie Preferences</span>
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can enable or disable different types of cookies below.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="categories" className="space-y-4">
            <TabsList>
              <TabsTrigger value="categories">Cookie Categories</TabsTrigger>
              <TabsTrigger value="details">Detailed Information</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4">
              <div className="space-y-4">
                {cookieCategories.map((category) => {
                  const Icon = category.icon;
                  const isEnabled = preferences[category.id];
                  
                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <div>
                              <CardTitle className="text-lg flex items-center space-x-2">
                                <span>{category.title}</span>
                                {category.required && (
                                  <Badge variant="secondary" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {category.description}
                              </CardDescription>
                            </div>
                          </div>
                          <Checkbox
                            checked={isEnabled}
                            onCheckedChange={(checked) => 
                              handlePreferenceChange(category.id, !!checked)
                            }
                            disabled={category.required}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-2">Examples:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {category.examples.map((example, index) => (
                              <li key={index}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p>You can change these preferences at any time in your account settings.</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAcceptSelected}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>What are cookies?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p>
                    Cookies are small text files that are stored on your device when you visit a website. 
                    They help websites remember information about your visit, which can make it easier to 
                    visit the site again and make the site more useful to you.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">How we use cookies:</h4>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                        <li>To keep you signed in to your account</li>
                        <li>To remember your preferences and settings</li>
                        <li>To analyze how our website is used</li>
                        <li>To provide personalized content and recommendations</li>
                        <li>To measure the effectiveness of our marketing campaigns</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium">Your rights:</h4>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                        <li>You can control which cookies are set through these preferences</li>
                        <li>You can delete cookies through your browser settings</li>
                        <li>You can request information about the data we collect</li>
                        <li>You can request deletion of your personal data</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">
                      For more information about how we handle your data, please read our{' '}
                      <Link href="/privacy-policy" className="underline hover:no-underline">
                        Privacy Policy
                      </Link>
                      {' '}and{' '}
                      <Link href="/terms-of-service" className="underline hover:no-underline">
                        Terms of Service
                      </Link>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}