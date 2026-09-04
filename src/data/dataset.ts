import type {
  Transaction, Customer, Settlement, PaymentMethod, TransactionStatus,
  DemoScenarioId, Merchant,
} from '@/types';

// Deterministic PRNG so scenarios are reproducible
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Rohan', 'Karan', 'Dhruv', 'Kabir', 'Aryan', 'Nikhil',
  'Priya', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Pari', 'Myra',
  'Riya', 'Sara', 'Ira', 'Avni', 'Nisha', 'Kavya', 'Meera', 'Tara',
  'Rahul', 'Amit', 'Suresh', 'Deepak', 'Rajesh', 'Vikram', 'Sanjay', 'Anil',
  'Pooja', 'Neha', 'Shreya', 'Anjali', 'Bhavya', 'Divya', 'Geeta', 'Lakshmi',
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Reddy', 'Nair', 'Iyer', 'Mehta', 'Jain',
  'Patel', 'Singh', 'Kumar', 'Rao', 'Das', 'Bose', 'Kapoor', 'Malhotra',
  'Chopra', 'Banerjee', 'Mukherjee', 'Pillai', 'Shetty', 'Naidu', 'Khan', 'Ahmed',
];

const PRODUCT_CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Grocery', 'Books', 'Toys'];

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length)];
}

function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

export { formatINR };

// Base success rates per payment method (normal scenario)
const BASE_SUCCESS_RATES: Record<PaymentMethod, number> = {
  UPI: 0.962,
  Card: 0.955,
  Netbanking: 0.971,
  Wallet: 0.948,
};

const METHOD_WEIGHTS: Record<PaymentMethod, number> = {
  UPI: 0.52,
  Card: 0.28,
  Netbanking: 0.12,
  Wallet: 0.08,
};

const METHODS: PaymentMethod[] = ['UPI', 'Card', 'Netbanking', 'Wallet'];

export interface Dataset {
  merchant: Merchant;
  transactions: Transaction[];
  customers: Customer[];
  settlements: Settlement[];
}

export function generateDataset(scenario: DemoScenarioId, days: number = 60): Dataset {
  const seed = scenario === 'normal' ? 42 : 42 + scenario.length * 1000;
  const rand = mulberry32(seed);

  const merchant: Merchant = {
    id: 'mrc_urbancart',
    name: 'UrbanCart',
    email: 'ops@urbancart.in',
    industry: 'E-commerce / Lifestyle',
    testMode: true,
  };

  const now = new Date();
  now.setHours(21, 0, 0, 0); // "today" at 9pm

  // Generate customers
  const customerCount = 1100;
  const customers: Customer[] = [];
  const customerNames: Record<string, string> = {};

  for (let i = 0; i < customerCount; i++) {
    const name = `${pick(INDIAN_FIRST_NAMES, rand())} ${pick(INDIAN_LAST_NAMES, rand())}`;
    const id = `cust_${(i + 1).toString().padStart(5, '0')}`;
    customers.push({
      id,
      name,
      email: `${name.toLowerCase().replace(/\s/g, '.')}@email.com`,
      totalSpend: 0,
      transactionCount: 0,
      refundCount: 0,
      lastPaymentDate: '',
      status: 'active',
      avgOrderValue: 0,
    });
    customerNames[id] = name;
  }

  // Scenario modifiers
  const scenarioConfig = getScenarioConfig(scenario);

  // Generate transactions across `days`
  const transactions: Transaction[] = [];
  let txIdx = 1;

  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const dayOfWeek = day.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Base daily volume
    let baseVolume = 80 + Math.floor(rand() * 40);
    if (isWeekend) baseVolume = Math.floor(baseVolume * 1.3);

    // Revenue drop scenario: reduce volume in recent days
    if (scenario === 'revenue_drop' && d < 7) {
      baseVolume = Math.floor(baseVolume * 0.78);
    }

    for (let t = 0; t < baseVolume; t++) {
      // Pick payment method by weight
      const methodRoll = rand();
      let acc = 0;
      let method: PaymentMethod = 'UPI';
      for (const m of METHODS) {
        acc += METHOD_WEIGHTS[m];
        if (methodRoll < acc) { method = m; break; }
      }

      // Amount distribution: mostly 200-3000, some up to 15000
      const amountRoll = rand();
      let amount: number;
      if (amountRoll < 0.7) amount = 200 + Math.floor(rand() * 2800);
      else if (amountRoll < 0.95) amount = 3000 + Math.floor(rand() * 5000);
      else amount = 8000 + Math.floor(rand() * 8000);

      // Round to nice numbers
      amount = Math.round(amount / 10) * 10;

      // Time of day: weighted toward 10:00-22:00
      const hourRoll = rand();
      let hour: number;
      if (hourRoll < 0.15) hour = Math.floor(rand() * 10); // morning 0-9
      else if (hourRoll < 0.85) hour = 10 + Math.floor(rand() * 12); // 10-21
      else hour = 22 + Math.floor(rand() * 2); // 22-23

      const minute = Math.floor(rand() * 60);
      const second = Math.floor(rand() * 60);
      const ts = new Date(day);
      ts.setHours(hour, minute, second, 0);

      // Determine success
      let successRate = BASE_SUCCESS_RATES[method];
      let isAnomalous = false;
      let anomalyNote: string | undefined;
      let status: TransactionStatus = 'success';

      // Payment degradation scenario: UPI failures spike 18:00-21:00 in last 3 days
      if (scenario === 'payment_degradation' && d < 3 && method === 'UPI' && hour >= 18 && hour < 21) {
        successRate = 0.884;
        isAnomalous = true;
        anomalyNote = 'Occurred during detected UPI degradation window (18:00–21:00)';
      }

      // Customer behavior scenario: Wallet failures increase slightly
      if (scenario === 'customer_behavior' && d < 5 && method === 'Wallet') {
        successRate = 0.89;
      }

      if (rand() > successRate) {
        status = 'failed';
      } else {
        // Small refund rate
        if (rand() < 0.012) {
          status = 'refunded';
        }
      }

      const customer = customers[Math.floor(rand() * customerCount)];
      const orderId = `ord_${txIdx.toString().padStart(6, '0')}`;

      transactions.push({
        id: `pay_${txIdx.toString().padStart(6, '0')}`,
        date: ts.toISOString(),
        amount,
        paymentMethod: method,
        status,
        customerId: customer.id,
        customerName: customerNames[customer.id],
        orderId,
        isAnomalous,
        anomalyNote,
      });

      txIdx++;
    }
  }

  // Sort transactions by date desc
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Build customer aggregates from transactions
  const customerMap = new Map<string, Customer>();
  for (const c of customers) customerMap.set(c.id, { ...c });

  for (const tx of transactions) {
    const c = customerMap.get(tx.customerId);
    if (!c) continue;
    if (tx.status === 'success') {
      c.totalSpend += tx.amount;
      c.transactionCount += 1;
      if (!c.lastPaymentDate || tx.date > c.lastPaymentDate) c.lastPaymentDate = tx.date;
    } else if (tx.status === 'refunded') {
      c.refundCount += 1;
      c.totalSpend += tx.amount;
      c.transactionCount += 1;
      if (!c.lastPaymentDate || tx.date > c.lastPaymentDate) c.lastPaymentDate = tx.date;
    }
  }

  // Finalize customer stats
  const finalCustomers: Customer[] = [];
  for (const c of customerMap.values()) {
    c.avgOrderValue = c.transactionCount > 0 ? Math.round(c.totalSpend / c.transactionCount) : 0;
    if (c.transactionCount === 0) c.status = 'dormant';
    else if (c.totalSpend > 50000) c.status = 'vip';
    finalCustomers.push(c);
  }
  finalCustomers.sort((a, b) => b.totalSpend - a.totalSpend);

  // Generate settlements (daily aggregation, settled T+2)
  const settlements: Settlement[] = [];
  const settledDays = days - 2;
  for (let d = settledDays - 1; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - (d + 2));
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    const dayTx = transactions.filter(t => {
      const td = new Date(t.date);
      return td >= day && td < next && t.status === 'success';
    });

    const expected = dayTx.reduce((s, t) => s + t.amount, 0);
    let actual = expected;
    let status: Settlement['status'] = 'settled';

    // Settlement anomaly scenario: variance in last 5 settlement days
    if (scenario === 'settlement_anomaly' && d < 5) {
      const variance = 0.06 + rand() * 0.04;
      actual = Math.round(expected * (1 - variance));
      status = 'variance';
    }

    settlements.push({
      id: `stl_${settlements.length + 1}`,
      date: day.toISOString(),
      expectedAmount: expected,
      actualAmount: actual,
      status,
      transactionCount: dayTx.length,
    });
  }
  settlements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { merchant, transactions, customers: finalCustomers, settlements };
}

interface ScenarioConfig {
  label: string;
  description: string;
}

export function getScenarioConfig(scenario: DemoScenarioId): ScenarioConfig {
  switch (scenario) {
    case 'normal': return { label: 'Normal Business', description: 'Healthy baseline operations across all metrics.' };
    case 'payment_degradation': return { label: 'Payment Degradation', description: 'UPI failures spike during evening hours.' };
    case 'revenue_drop': return { label: 'Revenue Drop', description: 'Transaction volume declines sharply over 7 days.' };
    case 'settlement_anomaly': return { label: 'Settlement Anomaly', description: 'Actual settlements fall below expected amounts.' };
    case 'customer_behavior': return { label: 'Customer Behaviour Change', description: 'Wallet usage shifts and concentration rises.' };
  }
}
