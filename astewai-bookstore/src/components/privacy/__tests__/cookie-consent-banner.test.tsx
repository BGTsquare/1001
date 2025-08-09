import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CookieConsentBanner } from '../cookie-consent-banner';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('shows banner when no consent is stored', async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });
  });

  it('does not show banner when consent is already given', () => {
    localStorageMock.getItem.mockReturnValue('true');

    render(<CookieConsentBanner />);

    expect(screen.queryByText('We use cookies')).not.toBeInTheDocument();
  });

  it('accepts all cookies when Accept All is clicked', async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });

    const acceptButton = screen.getByText('Accept All');
    fireEvent.click(acceptButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('cookie-consent', 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cookie-preferences',
      JSON.stringify({
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
      })
    );
  });

  it('rejects all cookies when Reject All is clicked', async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });

    const rejectButton = screen.getByText('Reject All');
    fireEvent.click(rejectButton);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('cookie-consent', 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cookie-preferences',
      JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
      })
    );
  });

  it('opens settings dialog when Customize is clicked', async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });

    const customizeButton = screen.getByText('Customize');
    fireEvent.click(customizeButton);

    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
    expect(screen.getByText('Necessary Cookies')).toBeInTheDocument();
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
  });

  it('shows cookie categories in settings dialog', async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });

    const customizeButton = screen.getByText('Customize');
    fireEvent.click(customizeButton);

    expect(screen.getByText('Necessary Cookies')).toBeInTheDocument();
    expect(screen.getByText('Functional Cookies')).toBeInTheDocument();
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
    expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
  });

  it('prevents disabling necessary cookies', async () => {
    render(<CookieConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('We use cookies')).toBeInTheDocument();
    });

    const customizeButton = screen.getByText('Customize');
    fireEvent.click(customizeButton);

    // Find the necessary cookies checkbox - it should be disabled
    const necessaryCheckbox = screen.getByRole('checkbox', { name: /necessary/i });
    expect(necessaryCheckbox).toBeDisabled();
    expect(necessaryCheckbox).toBeChecked();
  });
});