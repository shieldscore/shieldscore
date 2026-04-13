import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!client) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    client = twilio(accountSid, authToken);
  }
  return client;
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    if (!fromNumber) {
      console.error('TWILIO_PHONE_NUMBER not set');
      return false;
    }

    await getClient().messages.create({
      body: message,
      from: fromNumber,
      to,
    });

    return true;
  } catch (error) {
    console.error('SMS send failed:', error);
    return false;
  }
}
