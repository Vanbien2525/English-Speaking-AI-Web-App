import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Polyfill Blob.prototype.arrayBuffer if missing in JSDOM environment
if (typeof Blob !== "undefined" && typeof Blob.prototype.arrayBuffer !== "function") {
  Blob.prototype.arrayBuffer = async function (): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error("FileReader failed to convert Blob to ArrayBuffer"));
      reader.readAsArrayBuffer(this);
    });
  };
}

afterEach(() => {
  cleanup();
});
