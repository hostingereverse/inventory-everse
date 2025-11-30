// Smart TXT parser with regex patterns and AI fallback
// Handles irregular formats like: "Order ID: ORD-2025-001 | Price: 1299 | Email: john@company.com"

export interface ParsedOrderData {
  order_id?: string;
  price?: number;
  email?: string;
  delivery_days?: number;
  payment_status?: string;
  payment_method?: string;
  supplier_name?: string;
  purchase_rate?: number;
  quantity?: number;
  payment_date?: string;
  invoice_id?: string;
  raw_line: string;
  confidence: 'high' | 'medium' | 'low';
}

// Regex patterns for common formats
const PATTERNS = {
  orderId: [
    /Order\s*ID[:-\s]*([A-Z0-9-_]+)/i,
    /(ORD[-_]?[0-9]{4,}[-_]?[0-9]+)/i,
    /Order[:-\s]*([A-Z]{2,}[0-9-]+)/i,
  ],
  price: [
    /Price[:-\s]*[₹$]?\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /([0-9,]+(?:\.[0-9]+)?)\s*(?:paid|price|amount)/i,
    /₹\s*([0-9,]+(?:\.[0-9]+)?)/i,
  ],
  email: [
    /Email[:-\s]*([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/i,
    /([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/i, // Standalone email
  ],
  deliveryDays: [
    /Delivered?\s+in\s+(\d+)\s+days?/i,
    /Delivery[:-\s]*(\d+)\s*days?/i,
    /(\d+)\s*days?\s*delivery/i,
  ],
  paymentStatus: [
    /(?:paid|payment|status)[:-\s]*(paid|pending|completed|failed)/i,
    /(paid|pending|completed)/i,
  ],
  paymentMethod: [
    /(?:paid|via|using|method)[:-\s]*(cash|UPI|card|credit|debit|bank|transfer|wallet)/i,
    /(cash|UPI|card|credit|debit)/i,
  ],
  supplier: [
    /Supplier[:-\s]*(.+?)(?:\||\n|$)/i,
    /Supplier[:-\s]*(.+?)(?:\s+Purchase)/i,
  ],
  purchaseRate: [
    /Purchase\s+Rate[:-\s]*[₹$]?\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /Rate[:-\s]*[₹$]?\s*([0-9,]+(?:\.[0-9]+)?)/i,
  ],
  quantity: [
    /Qty[:-\s]*(\d+)/i,
    /Quantity[:-\s]*(\d+)/i,
    /(\d+)\s*(?:units?|pcs?|pieces?)/i,
  ],
  paymentDate: [
    /(?:paid|payment)[:-\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  ],
  invoiceId: [
    /Invoice[:-\s]*([A-Z0-9-]+)/i,
    /Invoice\s+ID[:-\s]*([A-Z0-9-]+)/i,
  ],
};

export function parseTxtLine(line: string): ParsedOrderData {
  const result: ParsedOrderData = {
    raw_line: line.trim(),
    confidence: 'low',
  };

  if (!line.trim()) {
    return result;
  }

  let matches = 0;

  // Try to extract Order ID
  for (const pattern of PATTERNS.orderId) {
    const match = line.match(pattern);
    if (match) {
      result.order_id = match[1].trim();
      matches++;
      break;
    }
  }

  // Try to extract Price
  for (const pattern of PATTERNS.price) {
    const match = line.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      result.price = parseFloat(priceStr);
      matches++;
      break;
    }
  }

  // Try to extract Email
  for (const pattern of PATTERNS.email) {
    const match = line.match(pattern);
    if (match) {
      result.email = match[1].trim().toLowerCase();
      matches++;
      break;
    }
  }

  // Try to extract Delivery Days
  for (const pattern of PATTERNS.deliveryDays) {
    const match = line.match(pattern);
    if (match) {
      result.delivery_days = parseInt(match[1]);
      matches++;
      break;
    }
  }

  // Try to extract Payment Status
  for (const pattern of PATTERNS.paymentStatus) {
    const match = line.match(pattern);
    if (match) {
      result.payment_status = match[1].toLowerCase();
      matches++;
      break;
    }
  }

  // Try to extract Payment Method
  for (const pattern of PATTERNS.paymentMethod) {
    const match = line.match(pattern);
    if (match) {
      result.payment_method = match[1].toLowerCase();
      matches++;
      break;
    }
  }

  // Try to extract Supplier Name
  for (const pattern of PATTERNS.supplier) {
    const match = line.match(pattern);
    if (match) {
      result.supplier_name = match[1].trim();
      matches++;
      break;
    }
  }

  // Try to extract Purchase Rate
  for (const pattern of PATTERNS.purchaseRate) {
    const match = line.match(pattern);
    if (match) {
      const rateStr = match[1].replace(/,/g, '');
      result.purchase_rate = parseFloat(rateStr);
      matches++;
      break;
    }
  }

  // Try to extract Quantity
  for (const pattern of PATTERNS.quantity) {
    const match = line.match(pattern);
    if (match) {
      result.quantity = parseInt(match[1]);
      matches++;
      break;
    }
  }

  // Try to extract Payment Date
  for (const pattern of PATTERNS.paymentDate) {
    const match = line.match(pattern);
    if (match) {
      result.payment_date = match[1].trim();
      matches++;
      break;
    }
  }

  // Try to extract Invoice ID
  for (const pattern of PATTERNS.invoiceId) {
    const match = line.match(pattern);
    if (match) {
      result.invoice_id = match[1].trim();
      matches++;
      break;
    }
  }

  // Determine confidence level
  if (matches >= 3) {
    result.confidence = 'high';
  } else if (matches >= 2) {
    result.confidence = 'medium';
  }

  return result;
}

// AI fallback using Workers AI (for lines that regex couldn't parse)
export async function parseWithAI(
  line: string,
  ai: any // Workers AI binding
): Promise<ParsedOrderData> {
  if (!ai) {
    return { raw_line: line, confidence: 'low' };
  }

  try {
    const prompt = `Extract structured data from this inventory/order line. Return JSON only with keys: order_id, price, email, delivery_days, payment_status, payment_method, supplier_name, purchase_rate, quantity, payment_date, invoice_id. Line: "${line}"`;

    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    // Parse AI response
    const text = response.response || response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        raw_line: line,
        confidence: 'medium', // AI parsing is medium confidence
      };
    }
  } catch (error) {
    console.error('AI parsing failed:', error);
  }

  return { raw_line: line, confidence: 'low' };
}

// Parse entire TXT file
export async function parseTxtFile(
  content: string,
  ai?: any
): Promise<ParsedOrderData[]> {
  const lines = content.split('\n').filter((line) => line.trim());
  const results: ParsedOrderData[] = [];

  for (const line of lines) {
    let parsed = parseTxtLine(line);

    // If confidence is low and AI is available, try AI fallback
    if (parsed.confidence === 'low' && ai) {
      parsed = await parseWithAI(line, ai);
    }

    if (parsed.order_id || parsed.price || parsed.email || parsed.supplier_name) {
      results.push(parsed);
    }
  }

  return results;
}

