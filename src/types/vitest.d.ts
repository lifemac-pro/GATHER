/// <reference types="vitest" />

import type { Mock } from "vitest";

declare global {
  namespace vi {
    export type Mock = Mock
  }
}
