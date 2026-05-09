import "server-only";

export function isLocalTestModeEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DECIVIO_TEST_MODE === "1";
}
