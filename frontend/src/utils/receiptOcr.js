const DATE_PATTERNS = [
  { regex: /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/, order: ['y', 'm', 'd'] },
  { regex: /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/, order: ['d', 'm', 'y'] },
  { regex: /\b(\d{1,2})[-/](\d{1,2})[-/](\d{2})\b/, order: ['d', 'm', 'y2'] },
];

const AMOUNT_PATTERNS = [
  /\b(?:total|grand\s*total|net\s*amount|balance\s*due|amount\s*paid|amount\s*due)\b[:\s]*(?:rs\.?|inr|₹)?\s*([\d,]+\.?\d*)/i,
  /(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)/gi,
  /\b([\d,]+\.\d{2})\b/g,
];

const CATEGORY_KEYWORDS = [
  { category: 'FOOD', keywords: ['restaurant', 'cafe', 'food', 'grocery', 'mart', 'kitchen', 'dining', 'swiggy', 'zomato'] },
  { category: 'RENT', keywords: ['rent', 'lease', 'housing', 'landlord'] },
  { category: 'BILLS', keywords: ['bill', 'electric', 'water', 'internet', 'aws', 'hosting', 'subscription', 'mobile'] },
  { category: 'TRAVEL', keywords: ['uber', 'ola', 'fuel', 'petrol', 'diesel', 'metro', 'travel', 'cab'] },
  { category: 'SHOPPING', keywords: ['store', 'shop', 'mall', 'amazon', 'flipkart', 'retail', 'electronics'] },
  { category: 'MEDICAL', keywords: ['pharmacy', 'health', 'medicine', 'clinic', 'hospital', 'medical', 'doctor'] },
];

function pad2(value) {
  return String(value).padStart(2, '0');
}

function parseDateToken(match, order) {
  const values = { d: match[1], m: match[2], y: match[3], y2: match[3] };
  let year;
  let month;
  let day;

  if (order[0] === 'y') {
    year = values.y;
    month = values.m;
    day = values.d;
  } else if (order[2] === 'y2') {
    year = `20${values.y2}`;
    month = values.m;
    day = values.d;
  } else {
    year = values.y;
    month = values.m;
    day = values.d;
  }

  const iso = `${year}-${pad2(month)}-${pad2(day)}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return iso;
}

export function parseReceiptText(rawText, confidence = 0) {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let amount = '';
  let date = '';
  let merchant = '';

  for (const pattern of DATE_PATTERNS) {
    const match = rawText.match(pattern.regex);
    if (match) {
      const parsed = parseDateToken(match, pattern.order);
      if (parsed) {
        date = parsed;
        break;
      }
    }
  }

  if (!date) {
    date = new Date().toISOString().split('T')[0];
  }

  const labeledAmount = rawText.match(AMOUNT_PATTERNS[0]);
  if (labeledAmount) {
    amount = labeledAmount[1].replace(/,/g, '');
  } else {
    const amounts = [];
    const currencyMatches = [...rawText.matchAll(AMOUNT_PATTERNS[1])];
    currencyMatches.forEach((match) => amounts.push(parseFloat(match[1].replace(/,/g, ''))));
    const decimalMatches = [...rawText.matchAll(AMOUNT_PATTERNS[2])];
    decimalMatches.forEach((match) => amounts.push(parseFloat(match[1].replace(/,/g, ''))));
    const valid = amounts.filter((value) => !Number.isNaN(value) && value > 0);
    if (valid.length) {
      amount = String(Math.max(...valid));
    }
  }

  const skipLine = (line) =>
    /^(total|sub\s*total|tax|gst|invoice|receipt|date|amount|cash|card|thank)/i.test(line)
    || DATE_PATTERNS.some((pattern) => pattern.regex.test(line))
    || /(?:rs\.?|inr|₹)\s*\d+/i.test(line);

  merchant = lines.find((line) => line.length > 2 && !skipLine(line)) || '';
  merchant = merchant.replace(/^[#+*-\s]+/, '').trim(); // Remove leading noisy characters like # or +

  const lower = `${merchant} ${rawText}`.toLowerCase();
  const categoryMatch = CATEGORY_KEYWORDS.find((entry) =>
    entry.keywords.some((keyword) => lower.includes(keyword))
  );

  return {
    merchant,
    amount,
    date,
    category: categoryMatch?.category || 'OTHER',
    description: merchant,
    confidence: Math.round(confidence || 0),
    rawText,
  };
}

export async function scanReceiptImage(file, onProgress) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text' && onProgress) {
        onProgress(Math.round((message.progress || 0) * 100));
      }
      if (message.status === 'loading tesseract core' && onProgress) {
        onProgress(5);
      }
      if (message.status === 'initializing tesseract' && onProgress) {
        onProgress(10);
      }
      if (message.status === 'loading language traineddata' && onProgress) {
        onProgress(20);
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);
    return parseReceiptText(data.text, data.confidence);
  } finally {
    await worker.terminate();
  }
}
