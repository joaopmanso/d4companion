// Reads a tooltip screenshot with Claude, using the player's own Anthropic API key.
// The key stays in this browser and requests go straight to api.anthropic.com.
import Anthropic from "@anthropic-ai/sdk";
import { AFFIXES } from "../data/affixes.js";
import { blobToDataUrl } from "../lib/store.js";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "rarity", "ancestral", "itemPower", "type", "affixes", "power", "aspect", "sockets"],
  properties: {
    name: { type: "string", description: "Item name exactly as printed, in normal title case." },
    rarity: { type: "string", enum: ["mythic", "unique", "legendary", "rare", "magic", "common"] },
    ancestral: { type: "boolean" },
    itemPower: { type: "integer", description: "Item Power, or 0 if not shown." },
    type: { type: "string", description: "Item type from the type line, e.g. Boots, Ring, Sword, Focus, Chest Armor." },
    affixes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "key", "kind", "ga", "enchanted"],
        properties: {
          text: { type: "string", description: "The full affix line with its value, without the roll range." },
          key: { type: "string", enum: [...AFFIXES.map((a) => a.key), "other"] },
          kind: { type: "string", enum: ["implicit", "affix", "temper"], description: "implicit = base stat lines above the divider; temper = lines with the tempering (hammer) icon." },
          ga: { type: "boolean", description: "Greater Affix: the line has the star icon." },
          enchanted: { type: "boolean", description: "The line has the enchant (swirl) icon." },
        },
      },
    },
    power: { type: "string", description: "Unique or Mythic power text, empty if none." },
    aspect: { type: "string", description: "Legendary aspect power text, empty if none." },
    sockets: { type: "array", items: { type: "string" }, description: "Socketed gems, runes or splinters by name." },
  },
};

const SYSTEM = `You read Diablo IV item tooltip screenshots and return the item as JSON.
Copy numbers exactly. Map each affix line to the closest key; use "other" when none fits.
"Primary Core Stat" and Willpower both map to willpower. Ranks lines like "+2 to Hellfire Skills" map to the ranks keys.
Weapon base lines (damage per hit, attacks per second) and the armour total are kind "implicit".
If the image has no Diablo IV item tooltip, return an empty name and no affixes.`;

export async function claudeItem(blob, { apiKey, model }, progress) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
  const dataUrl = await blobToDataUrl(blob);
  const [head, data] = dataUrl.split(",");
  const media_type = head.match(/data:([^;]+)/)?.[1] || "image/png";
  progress?.("Asking Claude…");

  const fallback = model === "claude-haiku-5-5" ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };
  const response = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type, data } },
        { type: "text", text: "Read this tooltip." },
      ],
    }],
    ...fallback,
  });

  if (response.stop_reason === "refusal") throw new Error("Claude declined to read this image.");
  if (response.stop_reason === "max_tokens") throw new Error("Claude's answer was cut off. Try a tighter crop of the tooltip.");
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const item = JSON.parse(text);
  item.affixes = item.affixes.map((a) => ({ ...a, key: a.key === "other" ? null : a.key }));
  item.usage = response.usage;
  return item;
}

// Turns SDK errors into something a player can act on.
export function claudeError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "Your Anthropic API key was rejected. Check it in Settings.";
  if (err instanceof Anthropic.PermissionDeniedError) return "That API key can't use this model. Pick another model in Settings.";
  if (err instanceof Anthropic.RateLimitError) return "Rate limited by the API. Wait a minute and try again.";
  if (err instanceof Anthropic.BadRequestError) return `The API rejected the request: ${err.message}`;
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach api.anthropic.com. Check your connection.";
  if (err instanceof Anthropic.APIError) return `API error ${err.status}: ${err.message}`;
  return err?.message || String(err);
}
