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
  PENDING: "PENDING", // Se creó una misión inicial que generó una deuda de sangre
  REJECTED: "REJECTED", // Se rechazó la misión inicial
  ASSIGNED: "ASSIGNED", // Se asignó un asesino a la misión inicial
  PAID_INITIAL_MISSION: "PAID_INITIAL_MISSION", // Se completó la misión inicial la cual generó la deuda de sangre
  PENDING_COLLECTION_APPROVAL: "PENDING_COLLECTION_APPROVAL", // Se creó una misión para pagar la deuda de sangre
  PAID: "PAID", // Se publicó la misión para pagar la deuda de sangre (finaliza el flujo)
}

exports.Configuration = {
  MONEY_PER_COIN: 10,
  INFORMATION_PRICE: 100,
}

exports.Countries = [
  "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaiyán", "Bahamas", "Bangladés", "Barbados", "Baréin", "Bélgica", "Belice", "Benín",
  "Bielorrusia", "Birmania", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi",
  "Bután", "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre",
  "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Dominica",
  "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia",
  "Esuatini", "Etiopía", "Filipinas", "Finlandia", "Fiyi", "Francia", "Gabón", "Gambia", "Georgia", "Ghana",
  "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Guyana", "Haití", "Honduras", "Hungría",
  "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", "Islas Salomón", "Israel", "Italia",
  "Jamaica", "Japón", "Jordania", "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait", "Laos", "Lesoto",
  "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo", "Macedonia del Norte", "Madagascar", "Malasia",
  "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia",
  "Mónaco", "Mongolia", "Montenegro", "Mozambique", "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria",
  "Noruega", "Nueva Zelanda", "Omán", "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú",
  "Polonia", "Portugal", "Reino Unido", "República Centroafricana", "República Checa", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumanía", "Rusia",
  "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona",
  "Singapur", "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza", "Surinam",
  "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía",
  "Tuvalu", "Ucrania", "Uganda", "Uruguay", "Uzbekistán", "Vanuatu", "Vaticano", "Venezuela", "Vietnam", "Yemen",
  "Yibuti", "Zambia", "Zimbabue"
];