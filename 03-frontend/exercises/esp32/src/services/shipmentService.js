import mockShipments from "../data/shipments";

export async function getShipments() {
  // TODO: thay đoạn dưới bằng fetch('/api/shipments') khi backend sẵn sàng
  await new Promise(resolve => setTimeout(resolve, 1000));

  return mockShipments;
}