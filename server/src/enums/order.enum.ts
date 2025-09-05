enum OrderStatus {
  Processing = 'PROCESSING',
  OnHold = 'ON_HOLD',
  PendingPayment = 'PENDING_PAYMENT',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
  Refunded = 'REFUNDED',
}

enum ShippingMethod {
  ParcelCompany = 'PARCEL_COMPANY',
  Motorcycle = 'MOTORCYCLE',
}

enum PaymentMethod {
  CashOnDelivery = 'CASH_ON_DELIVERY',
  BankTransfer = 'BANK_TRANSFER',
}

enum DeliveryType {
  HomeDelivery = 'HOME_DELIVERY',
  PickupPoint = 'PICKUP_POINT',
}

export { OrderStatus, ShippingMethod, PaymentMethod, DeliveryType };
