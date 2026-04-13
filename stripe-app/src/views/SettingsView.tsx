import {
  ContextView,
  Box,
  Inline,
  Button,
  Divider,
  Switch,
  TextField,
  Banner,
  Spinner,
} from '@stripe/ui-extension-sdk/ui';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import { useState, useEffect, useCallback } from 'react';
import BrandIcon from './brand_icon.svg';

const BACKEND_URL = 'https://shieldscore.io/api';

const SettingsView = ({ userContext, environment }: ExtensionContextValue) => {
  const [phone, setPhone] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'caution' | 'critical'; text: string } | null>(null);

  const getAccountId = useCallback(() => {
    return environment?.objectContext?.id || userContext?.account?.id;
  }, [environment, userContext]);

  // Load current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const accountId = getAccountId();
        if (!accountId) return;

        const response = await fetch(`${BACKEND_URL}/settings/${accountId}`);
        if (!response.ok) throw new Error('Failed to fetch settings');

        const data = await response.json();
        setPhone(data.phone ?? '');
        setEmailEnabled(data.alertPreferences?.email ?? true);
        setSmsEnabled(data.alertPreferences?.sms ?? false);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [getAccountId]);

  const handleSave = async () => {
    const accountId = getAccountId();
    if (!accountId) return;

    // Validate phone if SMS is enabled
    if (smsEnabled && !phone.startsWith('+')) {
      setMessage({ type: 'critical', text: 'Phone number must start with + and include country code (e.g., +14155551234)' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${BACKEND_URL}/settings/${accountId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone || null,
          alertPreferences: {
            email: emailEnabled,
            sms: smsEnabled,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setMessage({ type: 'critical', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ContextView title="Settings" brandColor="#111111" brandIcon={BrandIcon}>
        <Box css={{ padding: 'large', layout: 'column', alignX: 'center' }}>
          <Spinner />
          <Inline css={{ font: 'body', color: 'secondary', marginTop: 'small' }}>
            Loading settings...
          </Inline>
        </Box>
      </ContextView>
    );
  }

  return (
    <ContextView title="Settings" brandColor="#111111" brandIcon={BrandIcon}>
      <Box css={{ padding: 'medium', layout: 'column', gap: 'medium' }}>
        {message && (
          <Banner
            type={message.type}
            title={message.type === 'success' ? 'Saved' : 'Error'}
            description={message.text}
            onDismiss={() => setMessage(null)}
          />
        )}

        <Box css={{ layout: 'column', gap: 'small' }}>
          <Inline css={{ font: 'caption', fontWeight: 'semibold' }}>
            ALERT CHANNELS
          </Inline>

          <Box css={{ layout: 'row', alignY: 'center', distribute: 'space-between' }}>
            <Box css={{ layout: 'column' }}>
              <Inline css={{ font: 'body', fontWeight: 'semibold' }}>Email alerts</Inline>
              <Inline css={{ font: 'caption', color: 'secondary' }}>
                Receive alerts via email for all severity levels
              </Inline>
            </Box>
            <Switch
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
            />
          </Box>

          <Divider />

          <Box css={{ layout: 'row', alignY: 'center', distribute: 'space-between' }}>
            <Box css={{ layout: 'column' }}>
              <Inline css={{ font: 'body', fontWeight: 'semibold' }}>SMS alerts</Inline>
              <Inline css={{ font: 'caption', color: 'secondary' }}>
                Critical and warning alerts only (Defend plan)
              </Inline>
            </Box>
            <Switch
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
            />
          </Box>
        </Box>

        {smsEnabled && (
          <Box css={{ layout: 'column', gap: 'xsmall' }}>
            <Inline css={{ font: 'caption', fontWeight: 'semibold' }}>
              PHONE NUMBER
            </Inline>
            <TextField
              label="Phone number"
              placeholder="+14155551234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Inline css={{ font: 'caption', color: 'secondary' }}>
              Include country code (e.g., +1 for US)
            </Inline>
          </Box>
        )}

        <Divider />

        <Button
          type="primary"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save settings'}
        </Button>

        <Box css={{ marginTop: 'small' }}>
          <Inline css={{ font: 'caption', color: 'secondary' }}>
            ShieldScore uses read-only access. We never touch your funds.
          </Inline>
        </Box>
      </Box>
    </ContextView>
  );
};

export default SettingsView;
