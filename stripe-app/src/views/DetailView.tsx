import { ContextView, Box, Inline, Badge, Divider, Link } from '@stripe/ui-extension-sdk/ui';
import type { ExtensionContextValue } from '@stripe/ui-extension-sdk/context';
import { useState, useEffect, useCallback } from 'react';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

// TODO: Change to https://shieldscore.io/api before deploying
const BACKEND_URL = 'http://localhost:3000/api';

const DetailView = ({ userContext, environment }: ExtensionContextValue) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const accountId = environment?.objectContext?.id || userContext?.account?.id;
      if (!accountId) return;

      const response = await fetch(`${BACKEND_URL}/alerts/${accountId}?limit=10`);
      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [environment, userContext]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const getSeverityBadge = (severity: string) => {
    if (severity === 'critical') return <Badge type="negative">Critical</Badge>;
    if (severity === 'warning') return <Badge type="warning">Warning</Badge>;
    return <Badge type="info">Info</Badge>;
  };

  const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <ContextView title="Alerts">
      <Box css={{ padding: 'medium' }}>
        <Inline css={{ font: 'caption', fontWeight: 'semibold', marginBottom: 'small' }}>
          RECENT ALERTS
        </Inline>

        {loading && <Inline css={{ font: 'body' }}>Loading alerts...</Inline>}

        {!loading && alerts.length === 0 && (
          <Box css={{ padding: 'medium' }}>
            <Inline css={{ font: 'body', color: 'secondary' }}>
              No alerts. Your account is healthy.
            </Inline>
          </Box>
        )}

        {!loading && alerts.map((alert) => (
          <Box key={alert.id} css={{ marginBottom: 'small', padding: 'small', backgroundColor: 'container' }}>
            <Box css={{ stack: 'x', distribute: 'space-between', marginBottom: 'xxsmall' }}>
              {getSeverityBadge(alert.severity)}
              <Inline css={{ font: 'caption', color: 'secondary' }}>
                {timeAgo(alert.created_at)}
              </Inline>
            </Box>
            <Inline css={{ font: 'body', fontWeight: 'semibold', marginBottom: 'xxsmall' }}>
              {alert.title}
            </Inline>
            <Inline css={{ font: 'caption', color: 'secondary' }}>
              {alert.message}
            </Inline>
          </Box>
        ))}

        <Divider />

        <Box css={{ marginTop: 'medium' }}>
          <Link href="https://shieldscore.io" target="_blank">
            Open ShieldScore settings
          </Link>
        </Box>

        <Box css={{ marginTop: 'medium' }}>
          <Inline css={{ font: 'caption', color: 'secondary' }}>
            ShieldScore uses read-only access. We never touch your funds.
          </Inline>
        </Box>
      </Box>
    </ContextView>
  );
};

export default DetailView;
