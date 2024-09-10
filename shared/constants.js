exports.UserRole = {
  ADMIN: 'ADMIN',
  ASSASSIN: 'ASSASSIN',
}

exports.UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
}

exports.TransactionType = {
  INCOME: 'Entrada',
  OUTCOME: 'Salida',
}

exports.TransactionDescription = {
  COIN_PURCHASE: 'Compra de monedas',
  COIN_SELL: 'Venta de monedas',
  INFORMATION_PURCHASE: 'Compra de información',
  MISSION_REWARD: 'Recompensa de misión',
  MISSION_REJECTION: 'Devolución por rechazo de misión',
  MISSION_CREATION: 'Creación de misión',
}

exports.MissionPaymentType = {
  COINS: "COINS",
  BLOOD_DEBT: "BLOOD_DEBT",
  BLOOD_DEBT_COLLECTION: "BLOOD_DEBT_COLLECTION",
}

exports.MissionStatus = {
  CREATED: "CREATED",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
  ASSIGNED: "ASSIGNED",
  COMPLETED: "COMPLETED",
  PAID: "PAID",
}

exports.BloodDebtStatus = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED", // Se completó la misión inicial la cual generó la deuda de sangre
  PENDING_PAYMENT_APPROVAL: "PENDING_PAYMENT_APPROVAL", // Se creó una misión para pagar la deuda de sangre
  PAID: "PAID", // Se publicó la misión para pagar la deuda de sangre (finaliza el flujo)
}

exports.Configuration = {
  MONEY_PER_COIN: 10,
  INFORMATION_PRICE: 100,
}