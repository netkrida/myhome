/**
 * WhatsApp link builder utilities
 * Generates WhatsApp web/app links with optional prefilled text and UTM parameters
 */

export interface BuildWaLinkOptions {
  /** Phone number in E.164 format without + prefix (e.g., "628123456789") */
  number: string;
  /** Optional prefilled message text */
  text?: string;
  /** Optional UTM parameters for tracking */
  utm?: Record<string, string>;
}

/**
 * Build WhatsApp link with optional prefilled text and UTM parameters
 * 
 * @param opts - Options for building the WhatsApp link
 * @returns WhatsApp link URL
 * 
 * @example
 * buildWaLink({ number: "628123456789" })
 * // "https://wa.me/628123456789"
 * 
 * buildWaLink({ 
 *   number: "628123456789", 
 *   text: "Hello, I'm interested in your property" 
 * })
 * // "https://wa.me/628123456789?text=Hello%2C%20I'm%20interested%20in%20your%20property"
 * 
 * buildWaLink({ 
 *   number: "628123456789", 
 *   text: "Hello",
 *   utm: { utm_source: "myhome", utm_medium: "wa-float" }
 * })
 * // "https://wa.me/628123456789?text=Hello&utm_source=myhome&utm_medium=wa-float"
 */
export function buildWaLink(opts: BuildWaLinkOptions): string {
  const { number, text, utm } = opts;
  const base = `https://wa.me/${number}`;
  const params = new URLSearchParams();

  if (text) {
    params.set("text", text);
  }

  if (utm) {
    for (const [key, value] of Object.entries(utm)) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

