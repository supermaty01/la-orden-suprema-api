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
  INFORMATION_PURCHASE: 'Compra de información',
  MISSION_REWARD: 'Recompensa de misión',
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
  PAID: "PAID",
}

exports.Configuration = {
  MONEY_PER_COIN: 10,
  INFORMATION_PRICE: 100,
}