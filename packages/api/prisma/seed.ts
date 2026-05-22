import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const USER_ID    = '5d610d2e-1ac5-4436-a16d-926a1ec77878';
const API_KEY_ID = '4a576c38-e4b5-4458-ae8a-b583ec4fd4c6';

async function ensureUserAndKey() {
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: { passwordHash: '$2a$10$EqVCvzu4wnmL4j6Hvxgc/eQFPCuWS89Nb4w8E5PxfuJIqfKn/eXPi' },
    create: {
      id: USER_ID,
      username: 'demo',
      email: 'demo@minihog.dev',
      passwordHash: '$2a$10$EqVCvzu4wnmL4j6Hvxgc/eQFPCuWS89Nb4w8E5PxfuJIqfKn/eXPi',
    },
  });
  await prisma.apiKey.upsert({
    where: { id: API_KEY_ID },
    update: {},
    create: {
      id: API_KEY_ID,
      userId: USER_ID,
      key: 'mh_seed_demo_key_bella_cucina',
      name: 'Bella Cucina (seed)',
    },
  });
}

// 40 simulated visitors over 30 days
const END_USERS = Array.from({ length: 40 }, (_, i) => `user_${i + 1}`);

function daysAgo(days: number, hoursOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hoursOffset);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeEvent(eventName: string, distinctId: string, timestamp: Date, properties: any = {}) {
  return { id: randomUUID(), eventName, distinctId, timestamp, properties, apiKeyId: API_KEY_ID, userId: USER_ID };
}

async function seed() {
  await ensureUserAndKey();
  const deleted = await prisma.event.deleteMany({ where: { distinctId: { startsWith: 'user_' } } });
  console.log(`Cleared ${deleted.count} old seed events.`);
  await prisma.eventSchema.deleteMany({ where: { userId: USER_ID } });
  console.log('Cleared old event schemas.\n');

  const events: ReturnType<typeof makeEvent>[] = [];

  // ── Property pools ────────────────────────────────────────────────────────
  const pages      = ['/home', '/menu', '/about', '/contact', '/reservations'];
  const referrers  = ['google', 'instagram', 'direct', 'yelp', 'tripadvisor'];
  const devices    = ['desktop', 'mobile', 'tablet'];
  const countries  = ['US', 'GB', 'CA', 'AU', 'DE'];
  const locations  = ['Downtown', 'Westside'];
  const menuCats   = ['starters', 'pasta', 'pizza', 'mains', 'desserts'];
  const timeSlots  = ['12:00', '13:00', '19:00', '20:00', '21:00'];
  const menuItems  = ['Tagliatelle Bolognese', 'Margherita', 'Bruschetta al Pomodoro', 'Tiramisu', 'Branzino al Forno', 'Cacio e Pepe', 'Arancini', 'Cannoli Siciliani', 'Diavola', 'Pappardelle al Cinghiale'];
  const itemCats   = ['pasta', 'pizza', 'starters', 'desserts', 'mains'];
  const itemPrices = [8, 9, 12, 13, 14, 16, 17, 18, 19, 22, 24, 26, 28, 34];
  const orderTypes = ['dine-in', 'takeaway', 'delivery'];
  const payments   = ['card', 'cash', 'apple_pay'];
  const coupons    = ['WELCOME10', 'SPRITZ', 'LUNCH28'];
  const partySizes = [2, 2, 3, 4, 4, 6, 8];
  const ratings    = [3, 4, 4, 5, 5, 5];

  // ── Spread users across the last 30 days (3 waves) ───────────────────────
  // Wave 1: users 1-15 arrived 20-30 days ago
  // Wave 2: users 16-28 arrived 8-19 days ago
  // Wave 3: users 29-40 arrived 1-7 days ago (most recent)

  for (const userId of END_USERS) {
    const userNum = parseInt(userId.split('_')[1]);
    const device  = pick(devices);
    const country = pick(countries);
    const ref     = pick(referrers);

    // Spread arrival day across 30 days
    const baseDay = userNum <= 15
      ? Math.floor(rand(20, 30))
      : userNum <= 28
        ? Math.floor(rand(8, 19))
        : Math.floor(rand(1, 7));

    let offset = rand(0, 4); // random hour of day

    // ── page_view — all 40 ──────────────────────────────────────────────────
    // 1-3 page views per user
    const pvCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < pvCount; i++) {
      events.push(makeEvent('page_view', userId, daysAgo(baseDay, offset + i * 0.1), {
        page: i === 0 ? '/home' : pick(pages), referrer: i === 0 ? ref : 'direct', device, country,
      }));
    }
    offset += pvCount * 0.15;

    // ── menu_view — 34 of 40 ───────────────────────────────────────────────
    if (userNum <= 34) {
      const mvCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < mvCount; i++) {
        events.push(makeEvent('menu_view', userId, daysAgo(baseDay, offset), {
          category: pick(menuCats), device,
        }));
        offset += 0.05 + rand(0, 0.1);
      }
    }

    // ── reservation funnel — 28 → 22 → 16 ────────────────────────────────
    if (userNum <= 28) {
      // button_click before reservation
      events.push(makeEvent('button_click', userId, daysAgo(baseDay, offset + 0.02), {
        button_id: 'reserve-table', button_label: 'Reserve a Table', page: '/reservations', device,
      }));
      events.push(makeEvent('reservation_started', userId, daysAgo(baseDay, offset), {
        party_size: pick(partySizes), device,
      }));
      offset += 0.1 + rand(0, 0.15);

      if (userNum <= 22) {
        events.push(makeEvent('reservation_completed', userId, daysAgo(baseDay, offset), {
          party_size: pick(partySizes), time_slot: pick(timeSlots), location: pick(locations), device,
        }));
        offset += 0.05 + rand(0, 0.1);

        // ── review after dining (days later) — 12 of 22 ──────────────────
        if (userNum <= 12) {
          events.push(makeEvent('review_submitted', userId, daysAgo(Math.max(1, baseDay - 2), rand(0, 8)), {
            rating: pick(ratings), device,
          }));
        }
      }
    }

    // ── signup (loyalty) — 18 of 40 ───────────────────────────────────────
    if (userNum <= 18) {
      events.push(makeEvent('signup', userId, daysAgo(baseDay, offset), {
        method: pick(['email', 'google']), device, referrer: ref,
      }));
      offset += 0.05;
    }

    // ── order funnel — 24 → 20 → 16 ──────────────────────────────────────
    if (userNum <= 24) {
      events.push(makeEvent('button_click', userId, daysAgo(baseDay, offset + 0.02), {
        button_id: 'order-now', button_label: 'Order Now', page: '/menu', device,
      }));
      events.push(makeEvent('order_started', userId, daysAgo(baseDay, offset), {
        order_type: pick(orderTypes), device,
      }));
      offset += 0.1 + rand(0, 0.2);

      if (userNum <= 20) {
        const itemCount = 1 + Math.floor(Math.random() * 4);
        for (let i = 0; i < itemCount; i++) {
          events.push(makeEvent('order_item_added', userId, daysAgo(baseDay, offset), {
            item_name: pick(menuItems), category: pick(itemCats), price: pick(itemPrices), device,
          }));
          offset += 0.02 + rand(0, 0.05);
        }

        // coupon — 10 of 20
        if (userNum <= 10) {
          events.push(makeEvent('coupon_applied', userId, daysAgo(baseDay, offset), {
            code: pick(coupons), discount: pick([3, 5, 8, 10, 15]), device,
          }));
          offset += 0.02;
        }

        if (userNum <= 16) {
          const itemCount2 = 1 + Math.floor(Math.random() * 3);
          const total = Math.round(pick(itemPrices) * itemCount2 * (userNum <= 10 ? 0.9 : 1));
          events.push(makeEvent('order_completed', userId, daysAgo(baseDay, offset), {
            total, item_count: itemCount2, order_type: pick(orderTypes),
            payment_method: pick(payments), location: pick(locations), device,
          }));
        }
      }
    }

    // ── Extra page_views on return visits (retention pattern) ─────────────
    // Return events are placed 1 full day PAST the threshold so they
    // always satisfy the forward-retention check (any event >= T0 + D days).
    // D+1 return: 30 of 40  (placed at T0+2 so it's clearly >= T0+1)
    if (userNum <= 30 && baseDay > 2) {
      events.push(makeEvent('page_view', userId, daysAgo(baseDay - 2, rand(0, 4)), {
        page: pick(pages), referrer: 'direct', device, country, returning: true,
      }));
      if (userNum <= 20) {
        events.push(makeEvent('menu_view', userId, daysAgo(baseDay - 2, rand(1, 5)), {
          category: pick(menuCats), device,
        }));
      }
    }
    // D+3 return: 20 of 40  (placed at T0+4 so it's clearly >= T0+3)
    if (userNum <= 20 && baseDay > 4) {
      events.push(makeEvent('page_view', userId, daysAgo(baseDay - 4, rand(0, 4)), {
        page: pick(pages), referrer: 'direct', device, country, returning: true,
      }));
    }
    // D+7 return: 12 of 40  (placed at T0+8 so it's clearly >= T0+7)
    if (userNum <= 12 && baseDay > 8) {
      events.push(makeEvent('page_view', userId, daysAgo(baseDay - 8, rand(0, 4)), {
        page: pick(pages), referrer: 'direct', device, country, returning: true,
      }));
      events.push(makeEvent('reservation_started', userId, daysAgo(baseDay - 8, rand(1, 4)), {
        party_size: pick(partySizes), device,
      }));
      if (userNum <= 8) {
        events.push(makeEvent('reservation_completed', userId, daysAgo(baseDay - 8, rand(2, 5)), {
          party_size: pick(partySizes), time_slot: pick(timeSlots), location: pick(locations), device,
        }));
      }
    }
  }

  // ── Seed event schemas ────────────────────────────────────────────────────
  console.log(`\nInserting ${events.length} events for ${END_USERS.length} users...`);
  await prisma.$transaction(
    events.map(e => prisma.event.create({
      data: {
        id: e.id, eventName: e.eventName, distinctId: e.distinctId,
        timestamp: e.timestamp, properties: e.properties,
        apiKeyId: e.apiKeyId, userId: e.userId,
      } as any,
    })),
    { timeout: 60000 }
  );

  const counts: Record<string, number> = {};
  events.forEach(e => { counts[e.eventName] = (counts[e.eventName] || 0) + 1; });
  console.log('\nEvent breakdown:');
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([n, c]) => console.log(`  ${n}: ${c}`));
  console.log(`\nTotal: ${events.length} events`);

  console.log('\nSeeding event schemas...');
  const schemas = [
    { name: 'reservation_completed', description: 'Guest completes a table booking',
      properties: [
        { name: 'party_size', type: 'number', description: 'Number of guests', values: [] },
        { name: 'time_slot',  type: 'string', description: 'Booking time slot', values: ['12:00','13:00','19:00','20:00','21:00'] },
        { name: 'location',   type: 'string', description: 'Restaurant branch',  values: ['Downtown','Westside'] },
        { name: 'device',     type: 'string', description: 'Device type',        values: ['desktop','mobile','tablet'] },
      ],
    },
    { name: 'order_completed', description: 'Guest completes an online order',
      properties: [
        { name: 'total',          type: 'number', description: 'Order total in USD', values: [] },
        { name: 'item_count',     type: 'number', description: 'Items ordered', values: [] },
        { name: 'order_type',     type: 'string', description: 'How the order was placed', values: ['dine-in','takeaway','delivery'] },
        { name: 'payment_method', type: 'string', description: 'Payment method',           values: ['card','cash','apple_pay'] },
        { name: 'location',       type: 'string', description: 'Restaurant branch',        values: ['Downtown','Westside'] },
      ],
    },
    { name: 'menu_view', description: 'Guest browses a section of the menu',
      properties: [
        { name: 'category', type: 'string', description: 'Menu section', values: ['starters','pasta','pizza','mains','desserts'] },
        { name: 'device',   type: 'string', description: 'Device type',  values: ['desktop','mobile','tablet'] },
      ],
    },
    { name: 'reservation_started', description: 'Guest starts the reservation flow',
      properties: [
        { name: 'party_size', type: 'number', description: 'Number of guests', values: [] },
        { name: 'device',     type: 'string', description: 'Device type',      values: ['desktop','mobile','tablet'] },
      ],
    },
    { name: 'order_started', description: 'Guest starts an online order',
      properties: [
        { name: 'order_type', type: 'string', description: 'Order channel', values: ['dine-in','takeaway','delivery'] },
        { name: 'device',     type: 'string', description: 'Device type',   values: ['desktop','mobile','tablet'] },
      ],
    },
    { name: 'order_item_added', description: 'Guest adds a menu item to their order',
      properties: [
        { name: 'item_name', type: 'string', description: 'Menu item name', values: [] },
        { name: 'category',  type: 'string', description: 'Menu category',  values: ['starters','pasta','pizza','mains','desserts'] },
        { name: 'price',     type: 'number', description: 'Item price USD',  values: [] },
      ],
    },
    { name: 'coupon_applied', description: 'Guest applies a promo code',
      properties: [
        { name: 'code',     type: 'string', description: 'Promo code used',    values: ['WELCOME10','SPRITZ','LUNCH28'] },
        { name: 'discount', type: 'number', description: 'Discount amount USD', values: [] },
      ],
    },
    { name: 'review_submitted', description: 'Guest submits a dining review',
      properties: [
        { name: 'rating', type: 'number', description: 'Star rating 1-5', values: [] },
        { name: 'device', type: 'string', description: 'Device type',     values: ['desktop','mobile','tablet'] },
      ],
    },
  ];

  for (const s of schemas) {
    await prisma.eventSchema.create({
      data: { id: randomUUID(), userId: USER_ID, name: s.name, description: s.description, properties: s.properties as any },
    });
    console.log(`  Created schema: ${s.name}`);
  }

  console.log('\nFunnels:');
  console.log('  Discovery:    page_view(40) → menu_view(34)');
  console.log('  Reservation:  menu_view(34) → reservation_started(28) → reservation_completed(22)');
  console.log('  Order:        order_started(24) → order_item_added(20) → order_completed(16)');
  console.log('  Loyalty:      signup(18)');
  console.log('\nSeed complete! Bella Cucina — 30-day spread across 40 users.');
}

seed()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
