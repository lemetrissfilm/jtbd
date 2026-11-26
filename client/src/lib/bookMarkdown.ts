import { defaultRehypePlugins, type StreamdownProps } from "streamdown";
import { rehypeRussianTypography } from "./typography";

/** Trusted book media only; retain Streamdown's other Markdown protections. */
export function createBookMarkdownPlugins(origin: string): NonNullable<StreamdownProps["rehypePlugins"]> {
  const url = new URL(origin);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Book media requires an HTTP(S) origin.");
  }
  const defaults = defaultRehypePlugins.harden;
  if (!Array.isArray(defaults)) {
    throw new Error("Unsupported Streamdown hardening configuration.");
  }
  return [
    [defaults[0], {
      ...defaults[1],
      defaultOrigin: url.origin,
      allowedImagePrefixes: [`${url.origin}/manus-storage/`, `${url.origin}/media/`],
      allowDataImages: false,
    }],
    defaultRehypePlugins.raw,
    rehypeRussianTypography,
    defaultRehypePlugins.katex,
  ];
}
