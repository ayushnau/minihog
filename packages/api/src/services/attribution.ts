import { prisma } from '../db/client';

/**
 * Performs last-click attribution for an install event
 * 
 * Rules:
 * 1. Fetch all clicks for the device_id
 * 2. Filter clicks within the attribution window (e.g., last 24h)
 * 3. Select the most recent click
 * 4. Return its campaign_id
 * 
 * @param deviceId - The device identifier
 * @param installTime - When the install occurred
 * @param attributionWindowHours - How many hours back to look for clicks
 * @returns The attributed campaign ID or null if no qualifying click found
 */
export async function performAttribution(
  deviceId: string,
  installTime: Date,
  attributionWindowHours: number
): Promise<string | null> {
  // Calculate the cutoff time (install time minus attribution window)
  const cutoffTime = new Date(installTime);
  cutoffTime.setHours(cutoffTime.getHours() - attributionWindowHours);

  // Fetch all clicks for this device within the attribution window
  // Ordered by timestamp descending (most recent first)
  const clicks = await prisma.click.findMany({
    where: {
      deviceId,
      timestamp: {
        gte: cutoffTime, // Within attribution window
        lte: installTime, // Before or at install time
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: 1, // Only need the most recent one
  });

  // Return the campaign ID of the most recent click, or null
  return clicks.length > 0 ? clicks[0].campaignId : null;
}


