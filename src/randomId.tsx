import { v4 as uuidv4 } from "uuid";

/**
 * Generates a random identifier of a specified length.
 *
 * @param {number} length - The length of the identifier to be generated (default is 8).
 * @return {string} A random identifier of the specified length.
 */
export default function randomId(length = 8) {
  return uuidv4().replace(/-/g, "").slice(0, length);
}
