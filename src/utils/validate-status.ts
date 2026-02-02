import { statusCache } from './status-cache';
import logger from './logger';

/**
 * Validates that a status key is active and exists in the configuration
 * @param status - The status key to validate
 * @returns true if valid, false otherwise
 */
export async function isValidStatus(status: string): Promise<boolean> {
  try {
    const validStatuses = await statusCache.getActiveStatusKeys();
    return validStatuses.includes(status);
  } catch (error) {
    logger.error('Error validating status', { status, error });
    return false;
  }
}

/**
 * Validates a status and throws an error if invalid
 * Use this in handlers to validate status before processing
 * @param status - The status key to validate
 * @throws Error if status is invalid
 */
export async function validateStatus(status: string): Promise<void> {
  const valid = await isValidStatus(status);
  if (!valid) {
    const validStatuses = await statusCache.getActiveStatusKeys();
    throw new Error(
      `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`
    );
  }
}
