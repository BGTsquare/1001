'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Send, TestTube } from 'lucide-react';

interface EmailTestPanelProps {
  className?: string;
}

export function EmailTestPanel({ className }: EmailTestPanelProps) {
  const [testEmail, setTestEmail] = useState('');
  const [templateType, setTemplateType] = useState('welcome');
  const [isLoading, setIsLoading] = useState(false);

  const emailTemplates = [
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'purchase_receipt', label: 'Purchase Receipt' },
    { value: 'purchase_confirmation', label: 'Purchase Confirmation' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: 'security_notification', label: 'Security Notification' },
    { value: 'admin_purchase_approval', label: 'Admin Purchase Approval' },
  ];

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/emails/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail,
          templateType,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Test email sent successfully! ID: ${result.id}`);
        setTestEmail('');
      } else {
        toast.error(result.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error('Failed to send test email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Email Template Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Test Email Address</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-type">Email Template</Label>
          <Select value={templateType} onValueChange={setTemplateType}>
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {emailTemplates.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSendTestEmail}
          disabled={isLoading || !testEmail}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Mail className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">📧 Email Testing Notes:</p>
          <ul className="text-xs space-y-1">
            <li>• Test emails are only available in development mode</li>
            <li>• Requires admin privileges to send test emails</li>
            <li>• Test emails use sample data for demonstration</li>
            <li>• Check your email service configuration if emails don't arrive</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}