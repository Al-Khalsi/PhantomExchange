import { EventEmitter } from "events";

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();

// List of available events for reference:
// - order:created
// - order:filled
// - order:rejected
// - order:cancelled
// - order:updated
// - position:opened
// - position:closed
// - trade:executed