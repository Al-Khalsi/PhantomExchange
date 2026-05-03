import { OrderSide, OrderType, OrderStatus } from "../store/orderStore";

export interface PlaceOrderInput {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  leverage?: number;      // Optional: defaults to account or symbol default
  reduceOnly?: boolean;    // If true, order can only reduce existing position
}