'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Eye, 
  Mail, 
  BarChart3, 
  Cookie, 
  Download, 
  Trash2,
  Settings,
  Bell,
  Users,
  Lock,
  Globe
} from 'lucide-react';
import { DataExportDialog } from './data-export-dialog';
import { AccountDeletionDialog } from './account-deletion-dialog';

interface PrivacySettingsProps {
  userEmail: string;
}

interface PrivacyPreferences {
  dataCollection: {
    analytics: boolean;
    performance: boolean;
    marketing: boolean;
    personalization: boolean;
  };
  communications: {
    newsletter: boolean;
    productUpdates: boolean;
    recommendations: boolean;
    promotions: boolean;
  };
  profileVisibility: {
    publicProfile: boolean;
    showReadingActivity: boolean;
    showReviews: boolean;
    showLibrary: boolean;
  };
  dataSharing: {
    anonymizedAnalytics: boolean;
    thirdPartyIntegrations: boolean;
    researchParticipation: boolean;
  };
}

const defaultPreferences: PrivacyPreferences = {
  dataCollection: {
    analytics: true,
    performance: true,
    marketing: false,
    personalization: true,
  },
  communications: {
    newsletter: true,
    productUpdates: true,
    recommendations: false,
    promotions: false,
  },
  profileVisibility: {
    publicProfile: false,
    showReadingActivity: false,
    showReviews: true,
    showLibrary: false,
  },
  dataSharing: {
    anonymizedAnalytics: true,
    thirdPartyIntegrations: false,
    researchParticipation: false,
  },
};

export function PrivacySettings({ userEmail }: PrivacySettingsProps) {
  const [preferences, setPreferences] = useState<PrivacyPreferences>(defaultPreferences);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showAccountDeletion, setShowAccountDeletion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePreferenceChange = (
    category: keyof PrivacyPreferences,
    setting: string,
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement actual API call to save preferences
      console.log('Saving privacy preferences:', preferences);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message (you might want to use a toast here)
      console.log('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Privacy Settings</h2>
          <p className="text-muted-foreground">
            Manage your privacy preferences and data controls
          </p>
        </div>
        <Button onClick={handleSavePreferences} disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="data-collection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="data-collection">Data Collection</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="profile">Profile Visibility</TabsTrigger>
          <TabsTrigger value="sharing">Data Sharing</TabsTrigger>
          <TabsTrigger value="rights">Your Rights</TabsTrigger>
        </TabsList>

        <TabsContent value="data-collection" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Data Collection Preferences</CardTitle>
              </div>
              <CardDescription>
                Control what data we collect to improve your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="analytics">Analytics Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how you use our platform to improve performance
                    </p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={preferences.dataCollection.analytics}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('dataCollection', 'analytics', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="performance">Performance Monitoring</Label>
                    <p className="text-sm text-muted-foreground">
                      Collect performance data to identify and fix issues
                    </p>
                  </div>
                  <Switch
                    id="performance"
                    checked={preferences.dataCollection.performance}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('dataCollection', 'performance', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="marketing">Marketing Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Track marketing campaign effectiveness and user acquisition
                    </p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={preferences.dataCollection.marketing}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('dataCollection', 'marketing', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="personalization">Personalization Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Use your activity to provide personalized recommendations
                    </p>
                  </div>
                  <Switch
                    id="personalization"
                    checked={preferences.dataCollection.personalization}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('dataCollection', 'personalization', checked)
                    }
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Data Protection</p>
                    <p className="text-muted-foreground">
                      All collected data is encrypted, anonymized where possible, and used 
                      solely to improve your experience. We never sell your personal data.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Communication Preferences</CardTitle>
              </div>
              <CardDescription>
                Choose what emails and notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="newsletter">Newsletter</Label>
                      <Badge variant="secondary" className="text-xs">Weekly</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Weekly digest of new books, featured content, and reading tips
                    </p>
                  </div>
                  <Switch
                    id="newsletter"
                    checked={preferences.communications.newsletter}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('communications', 'newsletter', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="productUpdates">Product Updates</Label>
                      <Badge variant="secondary" className="text-xs">As needed</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Important updates about new features and service changes
                    </p>
                  </div>
                  <Switch
                    id="productUpdates"
                    checked={preferences.communications.productUpdates}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('communications', 'productUpdates', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="recommendations">Book Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Personalized book suggestions based on your reading history
                    </p>
                  </div>
                  <Switch
                    id="recommendations"
                    checked={preferences.communications.recommendations}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('communications', 'recommendations', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="promotions">Promotions & Offers</Label>
                    <p className="text-sm text-muted-foreground">
                      Special deals, discounts, and promotional campaigns
                    </p>
                  </div>
                  <Switch
                    id="promotions"
                    checked={preferences.communications.promotions}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('communications', 'promotions', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <CardTitle>Profile Visibility</CardTitle>
              </div>
              <CardDescription>
                Control what information is visible to other users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="publicProfile">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile discoverable by other users
                    </p>
                  </div>
                  <Switch
                    id="publicProfile"
                    checked={preferences.profileVisibility.publicProfile}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('profileVisibility', 'publicProfile', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="showReadingActivity">Reading Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Show your current reading progress and recently read books
                    </p>
                  </div>
                  <Switch
                    id="showReadingActivity"
                    checked={preferences.profileVisibility.showReadingActivity}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('profileVisibility', 'showReadingActivity', checked)
                    }
                    disabled={!preferences.profileVisibility.publicProfile}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="showReviews">Reviews & Ratings</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your book reviews and ratings on your profile
                    </p>
                  </div>
                  <Switch
                    id="showReviews"
                    checked={preferences.profileVisibility.showReviews}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('profileVisibility', 'showReviews', checked)
                    }
                    disabled={!preferences.profileVisibility.publicProfile}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="showLibrary">Library Collection</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your book collection and reading lists
                    </p>
                  </div>
                  <Switch
                    id="showLibrary"
                    checked={preferences.profileVisibility.showLibrary}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('profileVisibility', 'showLibrary', checked)
                    }
                    disabled={!preferences.profileVisibility.publicProfile}
                  />
                </div>
              </div>

              {!preferences.profileVisibility.publicProfile && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Private Profile</p>
                      <p className="text-muted-foreground">
                        Your profile is currently private. Enable "Public Profile" to 
                        control individual visibility settings.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <CardTitle>Data Sharing Preferences</CardTitle>
              </div>
              <CardDescription>
                Control how your data is shared for research and improvement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="anonymizedAnalytics">Anonymized Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Share anonymized usage data to help improve the platform
                    </p>
                  </div>
                  <Switch
                    id="anonymizedAnalytics"
                    checked={preferences.dataSharing.anonymizedAnalytics}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('dataSharing', 'anonymizedAnalytics', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="thirdPartyIntegrations">Third-party Integrations</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow data sharing with trusted partners for enhanced features
                    </p>
                  </div>
                  <Switch
                    id="thirdPartyIntegrations"
                    checked={preferences.dataSharing.thirdPartyIntegrations}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('dataSharing', 'thirdPartyIntegrations', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="researchParticipation">Research Participation</Label>
                    <p className="text-sm text-muted-foreground">
                      Participate in anonymized research studies about reading habits
                    </p>
                  </div>
                  <Switch
                    id="researchParticipation"
                    checked={preferences.dataSharing.researchParticipation}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('dataSharing', 'researchParticipation', checked)
                    }
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="flex items-start space-x-2">
                  <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Research Impact</p>
                    <p className="text-blue-700">
                      Your participation in research helps us understand reading patterns 
                      and improve the experience for all users. All research data is 
                      anonymized and aggregated.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rights" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Your Data Rights</CardTitle>
              </div>
              <CardDescription>
                Exercise your rights under GDPR and other privacy regulations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <Download className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">Export Your Data</CardTitle>
                    </div>
                    <CardDescription>
                      Download a copy of all your personal data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get a complete export of your account data, including profile 
                      information, library, purchases, and reading progress.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDataExport(true)}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Request Data Export
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <CardTitle className="text-lg">Delete Account</CardTitle>
                    </div>
                    <CardDescription>
                      Permanently delete your account and data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data. 
                      This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowAccountDeletion(true)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Additional Rights</h4>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Right to Rectification</p>
                      <p className="text-muted-foreground">
                        You can update or correct your personal information at any time 
                        through your account settings.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Right to Restrict Processing</p>
                      <p className="text-muted-foreground">
                        You can limit how we process your data by adjusting your 
                        privacy settings above.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Right to Object</p>
                      <p className="text-muted-foreground">
                        You can object to certain types of data processing, such as 
                        marketing communications or analytics.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Right to Data Portability</p>
                      <p className="text-muted-foreground">
                        Export your data in a structured, machine-readable format 
                        for transfer to another service.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Need Help?</p>
                <p className="text-muted-foreground">
                  If you have questions about your privacy rights or need assistance 
                  with any of these options, please contact our privacy team at{' '}
                  <a href="mailto:privacy@astewai.com" className="underline hover:no-underline">
                    privacy@astewai.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <DataExportDialog
        open={showDataExport}
        onClose={() => setShowDataExport(false)}
      />

      <AccountDeletionDialog
        open={showAccountDeletion}
        onClose={() => setShowAccountDeletion(false)}
        userEmail={userEmail}
      />
    </div>
  );
}