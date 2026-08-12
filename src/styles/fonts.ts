import { DM_Sans, Caveat } from "next/font/google";

// Single family across all weights used in the public proposal template
// (regular body text, medium labels, bold headlines/numbers) so there's one
// consistent font-family declaration rather than stacking a local font for
// 400/500 and a separate Google-hosted one just for 700.
export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Script font used only for the rendered "typed" signature preview.
export const signatureFont = Caveat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-signature",
  display: "swap",
});
