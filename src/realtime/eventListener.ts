import { eventBus } from "../utils/eventBus";
import { activityLogStore } from "../store/activityLogStore";
import { broadcastPortfolioUpdate } from "./portfolioPublisher";

export function setupEventListeners() {
  const events = [
    "order:created",
    "order:filled",
    "order:rejected",
    "position:opened",
    "position:closed",
  ];

  for (const evt of events) {
    eventBus.on(evt, (data) => {
      console.log(`[EVENT] ${evt}`, data);
      activityLogStore.add(evt, data);

      // Optionally broadcast for certain events
      if (evt === "position:opened" || evt === "position:closed") {
        broadcastPortfolioUpdate();
      }
    });
  }
}
