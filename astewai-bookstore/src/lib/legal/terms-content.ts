// Terms of Service content data structure for better maintainability
export const TERMS_CONTENT = {
  acceptance: {
    title: '1. Acceptance of Terms',
    content: [
      'By creating an account, accessing, or using the Astewai Digital Bookstore platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.',
      'You must be at least 13 years old to use our Service. If you are under 18, you represent that you have your parent or guardian\'s permission to use the Service.',
    ],
  },
  accounts: {
    title: '2. User Accounts',
    subsections: [
      {
        title: 'Account Creation',
        content: 'To access certain features of our Service, you must create an account. You agree to:',
        list: [
          'Provide accurate, current, and complete information',
          'Maintain and update your account information',
          'Keep your password secure and confidential',
          'Accept responsibility for all activities under your account',
        ],
      },
      {
        title: 'Account Security',
        content: 'You are responsible for maintaining the security of your account and password. We cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.',
      },
    ],
  },
  content: {
    title: '3. Content and Services',
    subsections: [
      {
        title: 'Digital Books and Content',
        content: 'Our Service provides access to digital books, bundles, and related content. All content is provided for personal, non-commercial use only.',
      },
      {
        title: 'Content Availability',
        content: 'We strive to maintain availability of purchased content, but cannot guarantee perpetual access. Content may be removed due to licensing restrictions, legal requirements, or other circumstances beyond our control.',
      },
      {
        title: 'User-Generated Content',
        content: 'Any content you submit (reviews, comments, feedback) becomes our property and may be used for promotional or other business purposes.',
      },
    ],
  },
  purchases: {
    title: '4. Purchases and Payments',
    subsections: [
      {
        title: 'Payment Processing',
        content: 'All purchases are subject to our manual approval process. Payment will only be processed after administrative approval of your purchase request.',
      },
      {
        title: 'Pricing and Availability',
        content: 'Prices are subject to change without notice. We reserve the right to modify or discontinue products at any time.',
      },
      {
        title: 'Refunds',
        content: 'Due to the digital nature of our products, all sales are final. Refunds may be considered on a case-by-case basis for technical issues or billing errors.',
      },
    ],
  },
  intellectual: {
    title: '5. Intellectual Property',
    subsections: [
      {
        title: 'Our Content',
        content: 'The Service and its original content, features, and functionality are owned by Astewai Digital Bookstore and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.',
      },
      {
        title: 'Licensed Content',
        content: 'Books and other content are licensed to you for personal use only. You may not:',
        list: [
          'Reproduce, distribute, or share purchased content',
          'Remove copyright notices or other proprietary markings',
          'Use content for commercial purposes',
          'Reverse engineer or attempt to extract source material',
        ],
      },
    ],
  },
  conduct: {
    title: '6. User Conduct',
    content: 'You agree not to:',
    list: [
      'Use the Service for any unlawful purpose or in violation of these Terms',
      'Attempt to gain unauthorized access to our systems or other users\' accounts',
      'Interfere with or disrupt the Service or servers',
      'Upload or transmit viruses, malware, or other harmful code',
      'Harass, abuse, or harm other users',
      'Impersonate any person or entity',
      'Collect or harvest personal information from other users',
    ],
  },
  privacy: {
    title: '7. Privacy',
    content: [
      'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.',
      'By using our Service, you consent to the collection and use of information as outlined in our Privacy Policy.',
    ],
  },
  termination: {
    title: '8. Termination',
    subsections: [
      {
        title: 'Termination by You',
        content: 'You may terminate your account at any time by contacting our support team. Upon termination, your right to use the Service will cease immediately.',
      },
      {
        title: 'Termination by Us',
        content: 'We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.',
      },
    ],
  },
  disclaimers: {
    title: '9. Disclaimers',
    content: [
      'The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
      'We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.',
    ],
  },
  limitation: {
    title: '10. Limitation of Liability',
    content: [
      'In no event shall Astewai Digital Bookstore, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, use, goodwill, or other intangible losses.',
      'Our total liability to you for all claims arising from the use of the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.',
    ],
  },
  governing: {
    title: '11. Governing Law',
    content: [
      'These Terms shall be governed by and construed in accordance with the laws of the State of [State], without regard to its conflict of law provisions.',
      'Any disputes arising from these Terms or your use of the Service shall be resolved in the courts of [State/Country].',
    ],
  },
  changes: {
    title: '12. Changes to Terms',
    content: [
      'We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.',
      'Your continued use of the Service after any changes constitutes acceptance of the new Terms.',
    ],
  },
} as const;