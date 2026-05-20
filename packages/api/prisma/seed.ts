import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Your existing user and API key
const USER_ID = 'a55392ce-6335-494c-9da7-1e08739b052a';
const API_KEY_ID = '51e376dc-ead7-45a3-944b-09bae07d289f';

// 20 simulated end-users
const END_USERS = Array.from({ length: 20 }, (_, i) => `user_${i + 1}`);

function daysAgo(days: number, hoursOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() + hoursOffset);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeEvent(eventName: string, distinctId: string, timestamp: Date, properties: any = {}) {
  return {
    id: randomUUID(),
    eventName,
    distinctId,
    timestamp,
    properties,
    apiKeyId: API_KEY_ID,
    userId: USER_ID,
  };
}

async function seed() {
  // Clear old seed data (events with distinct_id starting with user_)
  const deleted = await prisma.event.deleteMany({
    where: { distinctId: { startsWith: 'user_' } },
  });
  console.log(`Cleared ${deleted.count} old seed events.\n`);

  const events: ReturnType<typeof makeEvent>[] = [];
  const pages = ['/home', '/pricing', '/about', '/docs', '/blog'];
  const buttons = ['cta-hero', 'nav-signup', 'add-cart', 'checkout', 'share-btn'];
  const products = ['Basic Plan', 'Pro Plan', 'Enterprise Plan'];
  const searchTerms = ['analytics', 'pricing', 'docs', 'integration', 'sdk'];

  for (const userId of END_USERS) {
    const userNum = parseInt(userId.split('_')[1]);

    // All users start with page_view on day 5 (5 days ago) — well within 7d range
    const baseDay = 5;
    const hourJitter = Math.random() * 4; // spread within same day

    // Step 1: page_view — all 20 users
    events.push(makeEvent('page_view', userId, daysAgo(baseDay, hourJitter), {
      page: pick(pages),
      referrer: pick(['google', 'twitter', 'direct', 'github']),
    }));

    // A few extra page views
    for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
      events.push(makeEvent('page_view', userId, daysAgo(baseDay, hourJitter + 0.1 + Math.random()), {
        page: pick(pages),
      }));
    }

    // Step 2: signup — 16 of 20 users (1-2 hours after page_view)
    if (userNum <= 16) {
      const signupOffset = hourJitter + 1 + Math.random();
      events.push(makeEvent('signup', userId, daysAgo(baseDay, signupOffset), {
        method: pick(['email', 'google', 'github']),
      }));

      // Step 3: onboarding_complete — 12 of 16 (shortly after signup)
      if (userNum <= 12) {
        const onboardOffset = signupOffset + 0.2 + Math.random() * 0.5;
        events.push(makeEvent('onboarding_complete', userId, daysAgo(baseDay, onboardOffset), {
          steps_completed: pick([3, 4, 5]),
        }));

        // Step 4: add_to_cart — 8 of 12 (same day, a bit later)
        if (userNum <= 8) {
          const cartOffset = onboardOffset + 0.5 + Math.random() * 2;
          const product = pick(products);
          events.push(makeEvent('add_to_cart', userId, daysAgo(baseDay, cartOffset), {
            product,
            price: pick([9.99, 29.99, 99.99]),
          }));

          // Step 5: purchase — 5 of 8
          if (userNum <= 5) {
            events.push(makeEvent('purchase', userId, daysAgo(baseDay, cartOffset + 0.1 + Math.random()), {
              product,
              amount: pick([9.99, 29.99, 99.99]),
              currency: 'USD',
            }));
          }
        }
      }
    }

    // Extra events for variety (same day)
    const extraCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < extraCount; i++) {
      const evtName = pick(['button_click', 'search', 'share', 'settings_change', 'logout']);
      let props: any = {};
      if (evtName === 'button_click') props = { button_id: pick(buttons), page: pick(pages) };
      else if (evtName === 'search') props = { query: pick(searchTerms) };
      else if (evtName === 'share') props = { platform: pick(['twitter', 'linkedin', 'email']) };

      events.push(makeEvent(evtName, userId, daysAgo(baseDay, hourJitter + Math.random() * 8), props));
    }

    // --- Retention data ---
    // Users return on day 4 (1 day later), day 3 (2 days later), day 2 (3 days later), day 1 (4 days later)
    // Day 1 retention: 18/20 users return
    if (userNum <= 18) {
      events.push(makeEvent('page_view', userId, daysAgo(4, Math.random() * 4), {
        page: pick(pages), returning: true,
      }));
      if (Math.random() > 0.4) {
        events.push(makeEvent(pick(['button_click', 'search']), userId, daysAgo(4, 1 + Math.random() * 3), {
          page: pick(pages),
        }));
      }
    }

    // Day 2 retention: 14/20
    if (userNum <= 14) {
      events.push(makeEvent('page_view', userId, daysAgo(3, Math.random() * 4), {
        page: pick(pages), returning: true,
      }));
    }

    // Day 3 retention: 10/20
    if (userNum <= 10) {
      events.push(makeEvent('page_view', userId, daysAgo(2, Math.random() * 4), {
        page: pick(pages), returning: true,
      }));
    }

    // Day 4 retention: 6/20
    if (userNum <= 6) {
      events.push(makeEvent('page_view', userId, daysAgo(1, Math.random() * 4), {
        page: pick(pages), returning: true,
      }));
    }
  }

  // Insert all events
  console.log(`Inserting ${events.length} events for ${END_USERS.length} users...`);

  await prisma.$transaction(
    events.map((e) =>
      prisma.event.create({
        data: {
          id: e.id,
          eventName: e.eventName,
          distinctId: e.distinctId,
          timestamp: e.timestamp,
          properties: e.properties,
          apiKeyId: e.apiKeyId,
          userId: e.userId,
        } as any,
      })
    ),
    { timeout: 30000 }
  );

  // Summary
  const eventCounts: Record<string, number> = {};
  events.forEach((e) => { eventCounts[e.eventName] = (eventCounts[e.eventName] || 0) + 1; });

  console.log('\nEvent breakdown:');
  Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
    console.log(`  ${name}: ${count}`);
  });

  console.log('\nFunnel (page_view → signup → onboarding → add_to_cart → purchase):');
  console.log('  20 → 16 → 12 → 8 → 5 users');

  console.log('\nRetention (page_view cohort):');
  console.log('  Day 1: 18/20 (90%), Day 2: 14/20 (70%), Day 3: 10/20 (50%), Day 4: 6/20 (30%)');

  console.log('\nAll events are within last 5 days — use 7d date range.');
  console.log('Seed complete!');
}

seed()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
