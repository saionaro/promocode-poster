import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import { logger } from "../log.js";
import { BaseEngine } from "./base.js";

export class Engine extends BaseEngine {
  async init() {
    logger.info(`Launching JSDOM for ${this.url}`);
    return this;
  }
  async getPage() {
    try {
      const res = await fetch(this.url);
      const resBlob = await res.blob();
      this.bytesTransferred += resBlob.size;
      return await resBlob.text();
    } catch (e) {
      logger.error(`Can not load ${this.url}`);
      logger.error(e.message);
      process.exit(1);
    }
  }
  async getCodes() {
    const pageContent = await this.getPage();
    const dom = new JSDOM(pageContent);
    const { document } = dom.window;

    if (this.extract === "table") {
      return this.filter(this.parseTable(this.extractTableRows(document)));
    }

    return this.filter(this.parse(this.extractListItems(document)));
  }
  extractListItems(document) {
    const codesUlSelector = this.listSelectors.join(", ");
    const lists = document.querySelectorAll(codesUlSelector);
    const items = [];
    for (const list of lists) {
      for (const child of list.children) {
        items.push(child.textContent);
      }
    }
    return items;
  }
  extractTableRows(document) {
    const tableSelector = this.listSelectors.join(", ");
    let tables = [...document.querySelectorAll(tableSelector)];
    if (this.tableLimit != null) {
      tables = tables.slice(0, this.tableLimit);
    }
    const rows = [];

    for (const table of tables) {
      for (const tr of table.querySelectorAll("tr")) {
        const cellEls = [...tr.querySelectorAll("th, td")];
        if (!cellEls.length) continue;

        const cells = cellEls.map((c) =>
          c.textContent.replace(/\s+/g, " ").trim(),
        );

        if (this.isHeaderRow(tr, cells)) continue;

        if (this.statusColumn != null) {
          const status = cells[this.statusColumn] ?? "";
          if (!this.statusAllowed(status)) continue;
        }

        rows.push(cells);
      }
    }

    return rows;
  }
  isHeaderRow(_tr, cells) {
    // Prefer text over <th>: some sites (e.g. GameRant) mark every cell as <th>.
    const first = (cells[0] || "").toLowerCase();
    return /^(code|codes|wuwa codes|hsr codes|reward|rewards|status)\b/.test(
      first,
    );
  }
}
