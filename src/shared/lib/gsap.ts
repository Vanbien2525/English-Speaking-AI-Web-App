/**
 * Single GSAP entry point. Import `gsap` / `useGSAP` from here (never from "gsap"
 * directly) so plugin registration happens exactly once on the client.
 */
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };
