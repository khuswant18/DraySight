import type { Page } from "patchright-core";
import type { PortalRawResult } from "../types.js";

export interface TerminalPortalAdapter {
  readonly portalName: string;
  readonly baseUrl: string;
  login(page: Page): Promise<void>;
  searchContainer(
    page: Page,
    containerNumber: string
  ): Promise<PortalRawResult>;
}
