/**
 * Dispute Response Guidance
 *
 * Maps Stripe dispute reason codes to actionable guidance,
 * win rates, priority levels, and required evidence fields.
 */

export interface DisputeGuidance {
  reasonCode: string;
  advice: string;
  winRate: string;
  priority: 'high' | 'medium' | 'low';
  evidenceFields: string[];
}

const GUIDANCE_MAP: Record<string, Omit<DisputeGuidance, 'reasonCode'>> = {
  fraudulent: {
    advice:
      'Submit AVS match confirmation, CVV verification, IP address logs, and any 3D Secure authentication records. If the customer has purchase history, include it.',
    winRate: '~20%',
    priority: 'high',
    evidenceFields: [
      'customer_purchase_ip',
      'customer_signature',
      'uncategorized_text',
    ],
  },
  product_not_received: {
    advice:
      'Submit shipping carrier tracking number, delivery confirmation, and signed proof of delivery if available. Include the shipping address used.',
    winRate: '~70%',
    priority: 'medium',
    evidenceFields: [
      'shipping_tracking_number',
      'shipping_carrier',
      'shipping_date',
      'shipping_address',
    ],
  },
  duplicate: {
    advice:
      'Submit evidence showing the charges are for separate transactions. Include distinct order IDs, different product descriptions, or different delivery dates.',
    winRate: '~55%',
    priority: 'medium',
    evidenceFields: [
      'duplicate_charge_id',
      'duplicate_charge_explanation',
      'duplicate_charge_documentation',
    ],
  },
  subscription_canceled: {
    advice:
      'Submit cancellation policy, evidence the customer agreed to terms, and proof the cancellation request was made after the charge date.',
    winRate: '~45%',
    priority: 'medium',
    evidenceFields: [
      'cancellation_policy',
      'cancellation_rebuttal',
      'customer_communication',
    ],
  },
  product_unacceptable: {
    advice:
      'Submit product description as advertised, proof of delivery matching the description, and any customer communication about the issue.',
    winRate: '~40%',
    priority: 'medium',
    evidenceFields: [
      'product_description',
      'customer_communication',
      'uncategorized_text',
    ],
  },
  unrecognized: {
    advice:
      'Submit transaction receipt, billing descriptor explanation, and any customer communication. Consider if your billing descriptor is clear.',
    winRate: '~50%',
    priority: 'low',
    evidenceFields: [
      'billing_address',
      'receipt',
      'customer_communication',
      'uncategorized_text',
    ],
  },
  credit_not_processed: {
    advice:
      'Submit refund policy, evidence of any refund already issued, or proof the refund request was outside your policy window.',
    winRate: '~45%',
    priority: 'medium',
    evidenceFields: [
      'refund_policy',
      'refund_refusal_explanation',
      'customer_communication',
    ],
  },
  general: {
    advice:
      'Submit all available transaction evidence: receipts, delivery proof, customer communication, and terms of service.',
    winRate: '~30%',
    priority: 'low',
    evidenceFields: [
      'receipt',
      'customer_communication',
      'service_documentation',
      'uncategorized_text',
    ],
  },
};

/**
 * Get actionable guidance for a Stripe dispute reason code.
 * Falls back to 'general' guidance for unknown reason codes.
 */
export function getDisputeGuidance(reasonCode: string): DisputeGuidance {
  const entry = GUIDANCE_MAP[reasonCode] ?? GUIDANCE_MAP['general'];
  return {
    reasonCode,
    ...entry,
  };
}
