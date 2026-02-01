// 📢 Daily Campaign - Campañas Temáticas Diarias
// Cada día del mes tiene un tema diferente, ciclo de 31 días

import { config } from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from './utils/logger.js';

config();

// ============================================
// CONFIGURACIÓN DE 31 TEMAS MENSUALES
// ============================================
interface CampaignTheme {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  searchTerms: string[];
  products: CampaignProduct[];
}

interface CampaignProduct {
  name: string;
  asin: string;
  price: number;
  originalPrice?: number;
  image: string;
  highlight?: string;
}

// 31 TEMAS - Uno para cada día del mes
const MONTHLY_THEMES: CampaignTheme[] = [
  // DÍA 1 - Barbacoas Weber
  {
    id: 'barbacoas_weber',
    emoji: '🔥',
    title: 'Especial Barbacoas Weber',
    subtitle: 'Las mejores barbacoas para este verano',
    searchTerms: ['barbacoa weber', 'weber genesis', 'weber spirit'],
    products: [
      { name: 'Weber Spirit E-310 Original Barbacoa Gas', asin: 'B01HHIG326', price: 549, originalPrice: 699, image: 'https://m.media-amazon.com/images/I/71sWn6u9sBL._AC_SL1500_.jpg', highlight: '🏆 Más vendida' },
      { name: 'Weber Master-Touch GBS 57cm Carbón', asin: 'B00WWRB5N2', price: 299, originalPrice: 369, image: 'https://m.media-amazon.com/images/I/81vKOQ8xp9L._AC_SL1500_.jpg' },
      { name: 'Weber Compact Kettle 47cm Carbón Negro', asin: 'B00H1PT7J8', price: 99, image: 'https://m.media-amazon.com/images/I/71+4HBdPiVL._AC_SL1500_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Weber Q1000 Barbacoa Gas Portátil', asin: 'B00FKB8NX0', price: 239, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/71SxPV-7eQL._AC_SL1500_.jpg' },
      { name: 'Weber Smokey Joe Premium 37cm', asin: 'B00H1PT7HU', price: 79, image: 'https://m.media-amazon.com/images/I/71Wm1G4NJNL._AC_SL1500_.jpg', highlight: '🎒 Portátil' },
    ]
  },
  // DÍA 2 - Smart TV Samsung
  {
    id: 'tv_samsung',
    emoji: '📺',
    title: 'Especial TV Samsung',
    subtitle: 'Tecnología QLED y Neo QLED a precios increíbles',
    searchTerms: ['samsung tv', 'samsung qled', 'samsung neo qled'],
    products: [
      { name: 'Samsung 55" Neo QLED 4K QN85B', asin: 'B09RXXL5FB', price: 899, originalPrice: 1299, image: 'https://m.media-amazon.com/images/I/71RiQZ4n0QL._AC_SL1500_.jpg', highlight: '🏆 Mejor calidad' },
      { name: 'Samsung 50" Crystal UHD 4K AU7095', asin: 'B09FHTQ8QC', price: 379, originalPrice: 499, image: 'https://m.media-amazon.com/images/I/71LJJrKbezL._AC_SL1500_.jpg', highlight: '💰 Mejor relación calidad-precio' },
      { name: 'Samsung 43" The Frame QLED 4K', asin: 'B0B3QKC1ML', price: 799, originalPrice: 999, image: 'https://m.media-amazon.com/images/I/71PjvnGfFWL._AC_SL1500_.jpg', highlight: '🎨 Diseño único' },
      { name: 'Samsung 65" QLED 4K Q60B', asin: 'B09RGL5GJ5', price: 699, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/71LPk8kbI2L._AC_SL1500_.jpg' },
      { name: 'Samsung 32" Smart TV HD', asin: 'B0B1NKQJPZ', price: 199, image: 'https://m.media-amazon.com/images/I/71d3oPVZDLL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 3 - Productos para Perros
  {
    id: 'productos_perros',
    emoji: '🐕',
    title: 'Especial Mundo Canino',
    subtitle: 'Todo para tu mejor amigo peludo',
    searchTerms: ['comida perro', 'cama perro', 'juguete perro'],
    products: [
      { name: 'Royal Canin Medium Adult 15kg', asin: 'B001ANVAZE', price: 59.99, originalPrice: 74.99, image: 'https://m.media-amazon.com/images/I/71GqLJzAj0L._AC_SL1500_.jpg', highlight: '🏆 Más vendido' },
      { name: 'Cama Ortopédica Bedsure Perro Grande', asin: 'B082WHYKHN', price: 39.99, originalPrice: 54.99, image: 'https://m.media-amazon.com/images/I/81W4HxK9LML._AC_SL1500_.jpg' },
      { name: 'Kong Classic Juguete Resistente L', asin: 'B0002AR0I8', price: 12.99, image: 'https://m.media-amazon.com/images/I/71awnMRjhCL._AC_SL1500_.jpg', highlight: '💪 Indestructible' },
      { name: 'Collar GPS Tractive para Perros', asin: 'B07BFMLZ1P', price: 49.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/61gfT4U1NGL._AC_SL1500_.jpg', highlight: '📍 Localización GPS' },
      { name: 'Furminator Cepillo Deslanador L', asin: 'B0040QQ07C', price: 24.99, originalPrice: 34.99, image: 'https://m.media-amazon.com/images/I/71pimfYkNRL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 4 - Relojes Garmin
  {
    id: 'relojes_garmin',
    emoji: '⌚',
    title: 'Especial Relojes Garmin',
    subtitle: 'El compañero perfecto para deportistas',
    searchTerms: ['garmin forerunner', 'garmin fenix', 'garmin venu'],
    products: [
      { name: 'Garmin Fenix 7 Sapphire Solar', asin: 'B09NRGCBC6', price: 699, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/71fxPGJgq2L._AC_SL1500_.jpg', highlight: '🏆 Top gama' },
      { name: 'Garmin Forerunner 255 Music', asin: 'B0B5VL2XGM', price: 299, originalPrice: 349, image: 'https://m.media-amazon.com/images/I/61Aa+Dxk7QL._AC_SL1500_.jpg', highlight: '🏃 Mejor para running' },
      { name: 'Garmin Venu 2 Plus AMOLED', asin: 'B09MVZYXGL', price: 399, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/61rKRYLoTOL._AC_SL1500_.jpg' },
      { name: 'Garmin Instinct 2 Solar Tactical', asin: 'B09NMKWG98', price: 349, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/61ys-f0N00L._AC_SL1500_.jpg', highlight: '🔋 Carga solar' },
      { name: 'Garmin Forerunner 55 GPS', asin: 'B096FPLK8P', price: 139, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/61zz1HE9J3S._AC_SL1500_.jpg', highlight: '💰 Mejor precio' },
    ]
  },
  // DÍA 5 - Móviles Xiaomi
  {
    id: 'moviles_xiaomi',
    emoji: '📱',
    title: 'Especial Móviles Xiaomi',
    subtitle: 'Tecnología premium a precios accesibles',
    searchTerms: ['xiaomi redmi', 'xiaomi poco', 'xiaomi 13'],
    products: [
      { name: 'Xiaomi 13T Pro 12GB/256GB', asin: 'B0CJHXS91V', price: 599, originalPrice: 799, image: 'https://m.media-amazon.com/images/I/61mLnJHDoqL._AC_SL1500_.jpg', highlight: '🏆 Flagship killer' },
      { name: 'Xiaomi Redmi Note 13 Pro 5G 8GB/256GB', asin: 'B0CS6GHZJ1', price: 279, originalPrice: 349, image: 'https://m.media-amazon.com/images/I/61Aj8Pp9X9L._AC_SL1500_.jpg', highlight: '📸 Cámara 200MP' },
      { name: 'Xiaomi POCO X5 Pro 5G 8GB/256GB', asin: 'B0BVKPWBWL', price: 249, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/71r69Y7BSeL._AC_SL1500_.jpg' },
      { name: 'Xiaomi Redmi 12 4GB/128GB', asin: 'B0C7JW5V4K', price: 129, image: 'https://m.media-amazon.com/images/I/71f2FUdSjWL._AC_SL1500_.jpg', highlight: '💰 Mejor gama entrada' },
      { name: 'Xiaomi POCO F5 12GB/256GB', asin: 'B0C3K3CQTB', price: 349, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/61TUGsQbPVL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 6 - Cafeteras
  {
    id: 'cafeteras',
    emoji: '☕',
    title: 'Especial Cafeteras',
    subtitle: 'El café perfecto en casa',
    searchTerms: ['cafetera nespresso', 'cafetera delonghi', 'cafetera automatica'],
    products: [
      { name: 'De\'Longhi Magnifica S ECAM22.110', asin: 'B009JL3DMI', price: 299, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/71OWiT6vKGL._AC_SL1500_.jpg', highlight: '🏆 Superautomática' },
      { name: 'Nespresso Vertuo Next Premium', asin: 'B08D6QM4NZ', price: 99, originalPrice: 179, image: 'https://m.media-amazon.com/images/I/71tW9k0TJYL._AC_SL1500_.jpg', highlight: '💰 Chollazo' },
      { name: 'Philips Serie 2200 EP2220/10', asin: 'B07TDKTY6K', price: 279, originalPrice: 379, image: 'https://m.media-amazon.com/images/I/71q34oxfOdL._AC_SL1500_.jpg' },
      { name: 'Krups Roma EA8108 Espresso Auto', asin: 'B00465S5LG', price: 249, originalPrice: 329, image: 'https://m.media-amazon.com/images/I/71IzJDc17NL._AC_SL1500_.jpg' },
      { name: 'Cecotec Power Espresso 20 Barista', asin: 'B083XVKC33', price: 89, originalPrice: 119, image: 'https://m.media-amazon.com/images/I/61F5cCAqVKL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 7 - Auriculares Sony
  {
    id: 'auriculares_sony',
    emoji: '🎧',
    title: 'Especial Auriculares Sony',
    subtitle: 'Sonido premium y cancelación de ruido líder',
    searchTerms: ['sony wh-1000xm', 'sony wf', 'auriculares sony'],
    products: [
      { name: 'Sony WH-1000XM5 Noise Cancelling', asin: 'B0BM8TKV3Z', price: 329, originalPrice: 419, image: 'https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg', highlight: '🏆 Mejor ANC del mercado' },
      { name: 'Sony WH-1000XM4 Bluetooth', asin: 'B08C7KG5LP', price: 229, originalPrice: 379, image: 'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg', highlight: '💰 Mejor calidad-precio' },
      { name: 'Sony WF-1000XM5 Earbuds', asin: 'B0C4QYZ3QK', price: 279, originalPrice: 319, image: 'https://m.media-amazon.com/images/I/51kYj8SoVBL._AC_SL1500_.jpg' },
      { name: 'Sony LinkBuds S Bluetooth', asin: 'B0B1LNLM1Y', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/51GlNM18HhL._AC_SL1500_.jpg' },
      { name: 'Sony WH-CH720N Inalámbricos', asin: 'B0BT3B89DX', price: 99, originalPrice: 149, image: 'https://m.media-amazon.com/images/I/51YWXKR1D2L._AC_SL1200_.jpg' },
    ]
  },
  // DÍA 8 - Robots Aspirador
  {
    id: 'robots_aspirador',
    emoji: '🧹',
    title: 'Especial Robots Aspirador',
    subtitle: 'Tu hogar limpio sin esfuerzo',
    searchTerms: ['roomba', 'roborock', 'robot aspirador'],
    products: [
      { name: 'iRobot Roomba j7+ Autovaciado', asin: 'B09B9B94GG', price: 599, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/61iEuQ28hnL._AC_SL1500_.jpg', highlight: '🏆 Evita obstáculos con IA' },
      { name: 'Roborock S7 MaxV Ultra', asin: 'B09RG8X5YD', price: 899, originalPrice: 1299, image: 'https://m.media-amazon.com/images/I/61X4xT3RHVL._AC_SL1500_.jpg' },
      { name: 'iRobot Roomba 692 WiFi', asin: 'B08F7VK6VX', price: 199, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/71lEQJekQ1L._AC_SL1500_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Cecotec Conga 8290 Ultra', asin: 'B09NTLVLJS', price: 399, originalPrice: 549, image: 'https://m.media-amazon.com/images/I/51OmKJbJDEL._AC_SL1000_.jpg' },
      { name: 'Xiaomi Robot Vacuum S10+', asin: 'B0BRC7H6TS', price: 349, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/61yX7SfJSEL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 9 - Gaming PlayStation
  {
    id: 'gaming_playstation',
    emoji: '🎮',
    title: 'Especial PlayStation',
    subtitle: 'El mejor ecosistema gaming',
    searchTerms: ['ps5', 'dualsense', 'playstation'],
    products: [
      { name: 'PlayStation 5 Consola Estándar', asin: 'B09BKN8PMN', price: 549, image: 'https://m.media-amazon.com/images/I/51QT35rUf0L._SL1500_.jpg', highlight: '🎮 La consola' },
      { name: 'Mando DualSense Blanco PS5', asin: 'B08H98GVK8', price: 54.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/61lsFiYLJzL._SL1500_.jpg' },
      { name: 'PlayStation VR2', asin: 'B0BHDR74N6', price: 549, originalPrice: 599, image: 'https://m.media-amazon.com/images/I/61uDUe5K4dL._SL1500_.jpg', highlight: '🥽 Realidad Virtual' },
      { name: 'PS5 DualSense Edge Pro Controller', asin: 'B0BPQPJK6T', price: 199, originalPrice: 239, image: 'https://m.media-amazon.com/images/I/61WDUkkAzcL._SL1500_.jpg' },
      { name: 'Auriculares PULSE 3D PS5', asin: 'B08H99BPJN', price: 79.99, originalPrice: 99.99, image: 'https://m.media-amazon.com/images/I/61S8aaYyDQL._SL1500_.jpg' },
    ]
  },
  // DÍA 10 - Freidoras de Aire
  {
    id: 'freidoras_aire',
    emoji: '🍟',
    title: 'Especial Air Fryer',
    subtitle: 'Cocina sana sin renunciar al sabor',
    searchTerms: ['freidora aire', 'air fryer', 'philips airfryer'],
    products: [
      { name: 'Philips Airfryer XXL Premium HD9762', asin: 'B07VLB9PZF', price: 199, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/71+9P4PxRwL._AC_SL1500_.jpg', highlight: '🏆 La mejor del mercado' },
      { name: 'Ninja Foodi MAX Dual Zone AF400EU', asin: 'B08QZKC47Z', price: 189, originalPrice: 249, image: 'https://m.media-amazon.com/images/I/81adbScIJSL._AC_SL1500_.jpg', highlight: '👨‍👩‍👧‍👦 Ideal familias' },
      { name: 'Cosori Air Fryer 5.5L XXL', asin: 'B07GJBBGHG', price: 99, originalPrice: 129, image: 'https://m.media-amazon.com/images/I/71Y2CKL8uKL._AC_SL1500_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Philips Essential Airfryer 4.1L', asin: 'B0936F6XPV', price: 89, originalPrice: 139, image: 'https://m.media-amazon.com/images/I/61xPJmFrAZL._AC_SL1000_.jpg' },
      { name: 'Cecotec Cecofry Full InoxBlack Pro', asin: 'B08QF7FZGC', price: 59, originalPrice: 89, image: 'https://m.media-amazon.com/images/I/61xt3pwQGiL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 11 - Productos para Gatos
  {
    id: 'productos_gatos',
    emoji: '🐱',
    title: 'Especial Mundo Felino',
    subtitle: 'Todo para el rey de la casa',
    searchTerms: ['comida gato', 'arenero gato', 'rascador gato'],
    products: [
      { name: 'Royal Canin Indoor 27 Gato 10kg', asin: 'B003A53GE4', price: 54.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/71gVGljF3TL._AC_SL1500_.jpg', highlight: '🏆 Más vendido' },
      { name: 'Árbol Rascador 170cm Multi-nivel', asin: 'B074Z5PJVY', price: 49.99, originalPrice: 79.99, image: 'https://m.media-amazon.com/images/I/71m8i4I1rVL._AC_SL1500_.jpg', highlight: '🏠 Súper completo' },
      { name: 'Catit Fuente de Agua 3L', asin: 'B0055PXWQO', price: 24.99, originalPrice: 34.99, image: 'https://m.media-amazon.com/images/I/71S1YOPsHgL._AC_SL1500_.jpg' },
      { name: 'PetSafe Arenero Autolimpiable', asin: 'B00GN834CW', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/71dE-KVN32L._AC_SL1500_.jpg', highlight: '🤖 Automático' },
      { name: 'Feliway Classic Difusor + Recambio', asin: 'B005OCSPX4', price: 22.99, originalPrice: 29.99, image: 'https://m.media-amazon.com/images/I/71oJ-Lb88BL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 12 - Apple Watch
  {
    id: 'apple_watch',
    emoji: '⌚',
    title: 'Especial Apple Watch',
    subtitle: 'El smartwatch más completo',
    searchTerms: ['apple watch', 'apple watch ultra', 'apple watch se'],
    products: [
      { name: 'Apple Watch Series 9 GPS 45mm', asin: 'B0CHX3PBBF', price: 449, originalPrice: 499, image: 'https://m.media-amazon.com/images/I/81fxjeu8fdL._AC_SL1500_.jpg', highlight: '🏆 Última generación' },
      { name: 'Apple Watch Ultra 2 49mm', asin: 'B0CHXDXQN6', price: 849, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/81imDNd785L._AC_SL1500_.jpg', highlight: '💪 Para aventureros' },
      { name: 'Apple Watch SE 2ª Gen GPS 44mm', asin: 'B0CHX5BY1S', price: 279, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/81mYeH+pgAL._AC_SL1500_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Correa Apple Watch Sport Band', asin: 'B09JNXLV9R', price: 49, image: 'https://m.media-amazon.com/images/I/51oRMU+HSTL._AC_SL1000_.jpg' },
      { name: 'Cargador Magnético Apple Watch', asin: 'B09V4LFWPY', price: 35, originalPrice: 45, image: 'https://m.media-amazon.com/images/I/618KJaKrAhL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 13 - Patinetes Eléctricos
  {
    id: 'patinetes_electricos',
    emoji: '🛴',
    title: 'Especial Patinetes Eléctricos',
    subtitle: 'Movilidad urbana inteligente',
    searchTerms: ['patinete electrico', 'xiaomi scooter', 'segway'],
    products: [
      { name: 'Xiaomi Electric Scooter 4 Pro', asin: 'B0B8V8V8Z6', price: 499, originalPrice: 649, image: 'https://m.media-amazon.com/images/I/51-E+0V8ZZL._AC_SL1000_.jpg', highlight: '🏆 Mejor autonomía' },
      { name: 'Segway Ninebot KickScooter F40E', asin: 'B09N3LKLG4', price: 449, originalPrice: 599, image: 'https://m.media-amazon.com/images/I/61sNcNRDDfL._AC_SL1500_.jpg' },
      { name: 'Xiaomi Electric Scooter 3 Lite', asin: 'B0B1D8XLMN', price: 299, originalPrice: 399, image: 'https://m.media-amazon.com/images/I/51cQQQ6UKPL._AC_SL1000_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Cecotec Bongo Serie Z On Road', asin: 'B0BXGR9M8M', price: 379, originalPrice: 499, image: 'https://m.media-amazon.com/images/I/61eTB3uqQEL._AC_SL1500_.jpg' },
      { name: 'SmartGyro Xtreme SpeedWay V2', asin: 'B08QCRV9L6', price: 329, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/61zN-1d-ToL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 14 - Cuidado del Bebé
  {
    id: 'cuidado_bebe',
    emoji: '👶',
    title: 'Especial Mundo Bebé',
    subtitle: 'Lo mejor para los más pequeños',
    searchTerms: ['carrito bebe', 'vigilabebes', 'trona bebe'],
    products: [
      { name: 'Chicco Polly Magic Relax Trona', asin: 'B07TZKTL5D', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/71IqL+bU0yL._AC_SL1500_.jpg', highlight: '🏆 Más vendida' },
      { name: 'Vigilabebés Philips Avent SCD503', asin: 'B0748FXQPJ', price: 69.99, originalPrice: 99.99, image: 'https://m.media-amazon.com/images/I/61Kk7DZ7BPL._AC_SL1000_.jpg' },
      { name: 'Cochecito Trio Kinderkraft Moov', asin: 'B07T3CQ1V5', price: 329, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/61rCz5wP5IL._AC_SL1200_.jpg', highlight: '🚗 3 en 1' },
      { name: 'Esterilizador Philips Avent 3en1', asin: 'B00AHJNQXY', price: 79, originalPrice: 109, image: 'https://m.media-amazon.com/images/I/81y-dHAkxsL._AC_SL1500_.jpg' },
      { name: 'BabyBjörn Hamaca Balance Soft', asin: 'B00BQYXCES', price: 179, originalPrice: 229, image: 'https://m.media-amazon.com/images/I/71L0OqAQhPL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 15 - Portátiles Gaming
  {
    id: 'portatiles_gaming',
    emoji: '💻',
    title: 'Especial Portátiles Gaming',
    subtitle: 'Potencia para jugar donde quieras',
    searchTerms: ['portatil gaming', 'asus rog', 'msi gaming'],
    products: [
      { name: 'ASUS ROG Strix G15 RTX 4060 15.6"', asin: 'B0C4HYQJ5N', price: 1099, originalPrice: 1399, image: 'https://m.media-amazon.com/images/I/81wGDqWz8eL._AC_SL1500_.jpg', highlight: '🏆 Mejor rendimiento' },
      { name: 'Lenovo Legion 5 RTX 4050 15.6"', asin: 'B0C5R4SJGD', price: 899, originalPrice: 1199, image: 'https://m.media-amazon.com/images/I/71H1EaMvdWL._AC_SL1500_.jpg' },
      { name: 'MSI Katana GF66 RTX 4050 15.6"', asin: 'B0BXRT8FG4', price: 799, originalPrice: 999, image: 'https://m.media-amazon.com/images/I/71KfC3Vq5sL._AC_SL1500_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Acer Nitro 5 RTX 3050 15.6"', asin: 'B09NCNMGQY', price: 699, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/71+Qti5iSXL._AC_SL1500_.jpg' },
      { name: 'HP Victus 16 RTX 4060 16.1"', asin: 'B0C5K7C4GL', price: 999, originalPrice: 1299, image: 'https://m.media-amazon.com/images/I/81VfUCxEiLL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 16 - Fotografía Canon
  {
    id: 'fotografia_canon',
    emoji: '📷',
    title: 'Especial Fotografía Canon',
    subtitle: 'Captura momentos increíbles',
    searchTerms: ['canon eos', 'canon mirrorless', 'objetivo canon'],
    products: [
      { name: 'Canon EOS R6 Mark II Cuerpo', asin: 'B0BHJJY4GN', price: 2499, originalPrice: 2899, image: 'https://m.media-amazon.com/images/I/616P9U5FPML._AC_SL1500_.jpg', highlight: '🏆 Full Frame Pro' },
      { name: 'Canon EOS R50 + RF-S 18-45mm', asin: 'B0BVS7GJ44', price: 699, originalPrice: 849, image: 'https://m.media-amazon.com/images/I/71w++YfCzZL._AC_SL1500_.jpg', highlight: '👍 Ideal principiantes' },
      { name: 'Canon EOS 250D + 18-55mm IS STM', asin: 'B07QJP62WY', price: 549, originalPrice: 699, image: 'https://m.media-amazon.com/images/I/71dUYKSuSZL._AC_SL1500_.jpg' },
      { name: 'Canon RF 50mm f/1.8 STM', asin: 'B08KZJH5P5', price: 199, originalPrice: 249, image: 'https://m.media-amazon.com/images/I/71S-KPZ+RML._AC_SL1500_.jpg', highlight: '💎 Imprescindible' },
      { name: 'Canon PowerShot G7 X Mark III', asin: 'B07SGZJ8PW', price: 699, originalPrice: 849, image: 'https://m.media-amazon.com/images/I/71Fsd3w7YzL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 17 - Fitness y Gimnasio
  {
    id: 'fitness_gimnasio',
    emoji: '💪',
    title: 'Especial Fitness en Casa',
    subtitle: 'Tu gimnasio personal',
    searchTerms: ['mancuernas', 'banco gimnasio', 'cinta correr'],
    products: [
      { name: 'Bowflex SelectTech 552 Mancuernas', asin: 'B001ARYU58', price: 499, originalPrice: 599, image: 'https://m.media-amazon.com/images/I/71YM+kS+qUL._AC_SL1500_.jpg', highlight: '🏆 Ajustables 2-24kg' },
      { name: 'Sportstech Banco Multifunción BRT500', asin: 'B08GWNNFXB', price: 199, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/71vvd49WtNL._AC_SL1500_.jpg' },
      { name: 'Fitbit Charge 6 Pulsera Actividad', asin: 'B0CGK6RCMV', price: 129, originalPrice: 159, image: 'https://m.media-amazon.com/images/I/61W+Ww+Hs7L._AC_SL1500_.jpg' },
      { name: 'Cinta de Correr Plegable Sportstech', asin: 'B07HMKZXVL', price: 399, originalPrice: 549, image: 'https://m.media-amazon.com/images/I/71fTLFvTLXL._AC_SL1500_.jpg', highlight: '🏠 Plegable' },
      { name: 'Kit Bandas Elásticas Fitness', asin: 'B08DY3KVYB', price: 24.99, originalPrice: 39.99, image: 'https://m.media-amazon.com/images/I/81J0iO1WNUL._AC_SL1500_.jpg', highlight: '💰 Chollazo' },
    ]
  },
  // DÍA 18 - Iluminación Philips Hue
  {
    id: 'philips_hue',
    emoji: '💡',
    title: 'Especial Philips Hue',
    subtitle: 'Iluminación inteligente para tu hogar',
    searchTerms: ['philips hue', 'hue bridge', 'hue play'],
    products: [
      { name: 'Philips Hue Kit Inicio White & Color 3+1', asin: 'B09HZ5J2VD', price: 129, originalPrice: 179, image: 'https://m.media-amazon.com/images/I/61fQi6IgD1L._AC_SL1000_.jpg', highlight: '🏆 Kit completo' },
      { name: 'Philips Hue Play Bar 2 Pack', asin: 'B07GXBZBZF', price: 99, originalPrice: 139, image: 'https://m.media-amazon.com/images/I/515EvTYLr5L._AC_SL1000_.jpg', highlight: '🎮 Ideal gaming' },
      { name: 'Philips Hue Gradient Lightstrip TV 55"', asin: 'B08HQ6L6BP', price: 179, originalPrice: 229, image: 'https://m.media-amazon.com/images/I/71qkbBKsxWL._AC_SL1500_.jpg' },
      { name: 'Philips Hue White E27 Pack 2', asin: 'B07SS377J6', price: 22.99, originalPrice: 34.99, image: 'https://m.media-amazon.com/images/I/51fmNpMkNtL._AC_SL1000_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Philips Hue Bridge Smart Hub', asin: 'B016WNFSJK', price: 49, image: 'https://m.media-amazon.com/images/I/31Z3I5V7vKL._AC_.jpg' },
    ]
  },
  // DÍA 19 - Nintendo Switch
  {
    id: 'nintendo_switch',
    emoji: '🕹️',
    title: 'Especial Nintendo Switch',
    subtitle: 'Diversión para toda la familia',
    searchTerms: ['nintendo switch', 'switch oled', 'juegos switch'],
    products: [
      { name: 'Nintendo Switch OLED Blanca', asin: 'B098TVMWXL', price: 329, originalPrice: 349, image: 'https://m.media-amazon.com/images/I/61nqNujSF1L._SL1500_.jpg', highlight: '🏆 Pantalla OLED' },
      { name: 'Nintendo Switch Lite Turquesa', asin: 'B07V4GC9V4', price: 189, originalPrice: 219, image: 'https://m.media-amazon.com/images/I/71mZsH0MtrL._SL1500_.jpg', highlight: '💰 Más económica' },
      { name: 'Pro Controller Nintendo Switch', asin: 'B07GKKJPJK', price: 54.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/71YOGkTJJcL._SL1500_.jpg' },
      { name: 'The Legend of Zelda: TotK', asin: 'B09WJR1QVG', price: 54.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/81hEi0T-UfL._SL1500_.jpg', highlight: '🎮 Imprescindible' },
      { name: 'Mario Kart 8 Deluxe', asin: 'B01N1O5WCH', price: 44.99, originalPrice: 59.99, image: 'https://m.media-amazon.com/images/I/81lsBPgAPpL._SL1500_.jpg' },
    ]
  },
  // DÍA 20 - Cosmética Premium
  {
    id: 'cosmetica_premium',
    emoji: '✨',
    title: 'Especial Cosmética Premium',
    subtitle: 'Los mejores productos de belleza',
    searchTerms: ['serum vitamina c', 'crema antiedad', 'maquillaje premium'],
    products: [
      { name: 'Estée Lauder Advanced Night Repair', asin: 'B00GTJJGXS', price: 79, originalPrice: 109, image: 'https://m.media-amazon.com/images/I/61xPZs8OAHL._SL1500_.jpg', highlight: '🏆 Sérum icónico' },
      { name: 'La Roche-Posay Hyalu B5 Sérum', asin: 'B07C1K2ZBK', price: 34.99, originalPrice: 44.99, image: 'https://m.media-amazon.com/images/I/61H-2hFXbUL._SL1500_.jpg' },
      { name: 'Foreo Luna 3 Limpiador Facial', asin: 'B07XBKW5D2', price: 159, originalPrice: 219, image: 'https://m.media-amazon.com/images/I/61IwmsMnrTL._SL1500_.jpg', highlight: '🧖 Spa en casa' },
      { name: 'ghd Platinum+ Plancha Pelo', asin: 'B07K4SGDVY', price: 199, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/41YBNiGpK+L._SL1000_.jpg' },
      { name: 'Dyson Corrale Plancha Inalámbrica', asin: 'B085HZ9NMJ', price: 399, originalPrice: 499, image: 'https://m.media-amazon.com/images/I/61PF-k8xvYL._SL1500_.jpg', highlight: '💎 Sin cable' },
    ]
  },
  // DÍA 21 - Cocina KitchenAid
  {
    id: 'cocina_kitchenaid',
    emoji: '👨‍🍳',
    title: 'Especial KitchenAid',
    subtitle: 'El sueño de todo chef',
    searchTerms: ['kitchenaid', 'robot cocina kitchenaid', 'batidora kitchenaid'],
    products: [
      { name: 'KitchenAid Artisan 5KSM175 4.8L', asin: 'B00DEI0XY6', price: 449, originalPrice: 599, image: 'https://m.media-amazon.com/images/I/61NBx3Eb5UL._AC_SL1500_.jpg', highlight: '🏆 El clásico' },
      { name: 'KitchenAid Batidora de Mano 9 Vel', asin: 'B01E28QB8I', price: 99, originalPrice: 139, image: 'https://m.media-amazon.com/images/I/61GHkAdoA+L._AC_SL1500_.jpg' },
      { name: 'KitchenAid Procesador Alimentos 3.1L', asin: 'B01N3QTPXU', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/81BKbdYU9qL._AC_SL1500_.jpg' },
      { name: 'KitchenAid Tostadora 2 Ranuras', asin: 'B01M25AGLZ', price: 119, originalPrice: 159, image: 'https://m.media-amazon.com/images/I/71j4PbVmJnL._AC_SL1500_.jpg', highlight: '🍞 Diseño retro' },
      { name: 'KitchenAid Hervidor Eléctrico 1.7L', asin: 'B01M1KTAAF', price: 109, originalPrice: 149, image: 'https://m.media-amazon.com/images/I/61R0M3rLMYL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 22 - Cámaras de Seguridad
  {
    id: 'camaras_seguridad',
    emoji: '📹',
    title: 'Especial Seguridad Hogar',
    subtitle: 'Protege tu casa de forma inteligente',
    searchTerms: ['camara seguridad', 'ring doorbell', 'arlo'],
    products: [
      { name: 'Ring Video Doorbell 4', asin: 'B09491YSTG', price: 159, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/51Ai-1vJMdL._SL1000_.jpg', highlight: '🏆 Más vendido' },
      { name: 'Arlo Pro 4 Spotlight Camera', asin: 'B09BK12P27', price: 179, originalPrice: 249, image: 'https://m.media-amazon.com/images/I/51UKV7pDOXL._SL1000_.jpg', highlight: '📱 Sin cables' },
      { name: 'Blink Outdoor 3 Cámaras Kit', asin: 'B086DKSYB8', price: 149, originalPrice: 249, image: 'https://m.media-amazon.com/images/I/41T7jJTR-2L._SL1000_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Google Nest Cam Indoor', asin: 'B09FCLPLWX', price: 99, originalPrice: 129, image: 'https://m.media-amazon.com/images/I/41Jgz-ctEFL._SL1000_.jpg' },
      { name: 'TP-Link Tapo C200 Cámara WiFi', asin: 'B07XLML2YS', price: 24.99, originalPrice: 39.99, image: 'https://m.media-amazon.com/images/I/51M5X6WpVcL._AC_SL1000_.jpg', highlight: '🔥 Chollo' },
    ]
  },
  // DÍA 23 - Ciclismo
  {
    id: 'ciclismo',
    emoji: '🚴',
    title: 'Especial Ciclismo',
    subtitle: 'Equipamiento para ciclistas',
    searchTerms: ['casco ciclismo', 'garmin edge', 'luz bicicleta'],
    products: [
      { name: 'Garmin Edge 530 GPS Ciclismo', asin: 'B07RHL2GVD', price: 229, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/71Ct0R4I93L._AC_SL1500_.jpg', highlight: '🏆 GPS top' },
      { name: 'Wahoo KICKR Core Smart Trainer', asin: 'B07DPSZQ2L', price: 699, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/71J3aTpGBjL._AC_SL1500_.jpg', highlight: '🏠 Rodillo smart' },
      { name: 'Casco Giro Aether MIPS', asin: 'B07PQYQFKP', price: 199, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/71DYdqBkdoL._AC_SL1500_.jpg' },
      { name: 'Luces Bicicleta Sigma Sport Set', asin: 'B07DPNM33V', price: 39.99, originalPrice: 59.99, image: 'https://m.media-amazon.com/images/I/71lQJNn3N3L._AC_SL1500_.jpg', highlight: '🔦 Súper potentes' },
      { name: 'Candado Kryptonite Evolution Mini-7', asin: 'B06XCM6F5Q', price: 59, originalPrice: 79, image: 'https://m.media-amazon.com/images/I/71NFR2lCMpL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 24 - Altavoces Inteligentes
  {
    id: 'altavoces_inteligentes',
    emoji: '🔊',
    title: 'Especial Altavoces Inteligentes',
    subtitle: 'Tu asistente en casa',
    searchTerms: ['echo', 'google home', 'sonos'],
    products: [
      { name: 'Amazon Echo (4ª Gen) Premium', asin: 'B085HK4KL3', price: 79.99, originalPrice: 119.99, image: 'https://m.media-amazon.com/images/I/71JB6hM6Z6L._AC_SL1000_.jpg', highlight: '🏆 Alexa potente' },
      { name: 'Echo Dot (5ª Gen) con Reloj', asin: 'B09B8RKXVD', price: 44.99, originalPrice: 64.99, image: 'https://m.media-amazon.com/images/I/61xoR4A6q-L._AC_SL1000_.jpg', highlight: '💰 Más vendido' },
      { name: 'Google Nest Hub 2ª Gen', asin: 'B08V5H2WJX', price: 79, originalPrice: 99, image: 'https://m.media-amazon.com/images/I/61SdXCEMRFL._SL1500_.jpg' },
      { name: 'Sonos One SL Altavoz WiFi', asin: 'B07W7HMNZX', price: 179, originalPrice: 229, image: 'https://m.media-amazon.com/images/I/71WJIV3ZqQL._AC_SL1500_.jpg', highlight: '🎵 Sonido premium' },
      { name: 'Echo Show 8 (2ª Gen) Pantalla', asin: 'B084DFCNK4', price: 99, originalPrice: 149, image: 'https://m.media-amazon.com/images/I/61mMC-fj9WL._AC_SL1000_.jpg' },
    ]
  },
  // DÍA 25 - Sillas Gaming/Oficina
  {
    id: 'sillas_gaming',
    emoji: '🪑',
    title: 'Especial Sillas Gaming & Oficina',
    subtitle: 'Ergonomía para largas sesiones',
    searchTerms: ['silla gaming', 'silla ergonomica', 'secretlab'],
    products: [
      { name: 'Secretlab TITAN Evo 2022', asin: 'B09Q3GNR7Z', price: 449, originalPrice: 519, image: 'https://m.media-amazon.com/images/I/71R-RQG0yxL._AC_SL1500_.jpg', highlight: '🏆 La mejor del mercado' },
      { name: 'Autonomous ErgoChair Pro+', asin: 'B08QFXL8KT', price: 399, originalPrice: 499, image: 'https://m.media-amazon.com/images/I/61sQ29P7VML._AC_SL1500_.jpg', highlight: '💼 Oficina ergonómica' },
      { name: 'Noblechairs ICON Gaming Chair', asin: 'B07DD9LWPR', price: 349, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/71pFpJ3F-DL._AC_SL1500_.jpg' },
      { name: 'DXRacer Formula Series', asin: 'B01NBGGH3K', price: 249, originalPrice: 329, image: 'https://m.media-amazon.com/images/I/71pVKH6tbzL._AC_SL1500_.jpg' },
      { name: 'SONGMICS Silla Gaming Barata', asin: 'B07FKT3S9Q', price: 99, originalPrice: 149, image: 'https://m.media-amazon.com/images/I/81qR1YDrWuL._AC_SL1500_.jpg', highlight: '💰 Mejor precio' },
    ]
  },
  // DÍA 26 - Kindle y Lectura
  {
    id: 'kindle_lectura',
    emoji: '📚',
    title: 'Especial Kindle & Lectura',
    subtitle: 'El placer de leer sin límites',
    searchTerms: ['kindle', 'kindle paperwhite', 'ereader'],
    products: [
      { name: 'Kindle Paperwhite 6.8" 16GB', asin: 'B09TM7Y7GN', price: 139, originalPrice: 159, image: 'https://m.media-amazon.com/images/I/61PHVoQkgKL._AC_SL1000_.jpg', highlight: '🏆 Más vendido' },
      { name: 'Kindle Paperwhite Signature 32GB', asin: 'B09TMNWQQ3', price: 179, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/61XMoZBmjsL._AC_SL1000_.jpg', highlight: '🔋 Carga inalámbrica' },
      { name: 'Kindle Scribe 10.2" 64GB', asin: 'B09BSXTKG1', price: 339, originalPrice: 399, image: 'https://m.media-amazon.com/images/I/71D3s2kqIkL._AC_SL1500_.jpg', highlight: '✍️ Con escritura' },
      { name: 'Kindle 11ª Gen 6" 16GB', asin: 'B09SWWGBYJ', price: 99, image: 'https://m.media-amazon.com/images/I/61SUjlIbM5L._AC_SL1000_.jpg', highlight: '💰 Más económico' },
      { name: 'Funda Kindle Paperwhite Cuero', asin: 'B09TNWKJLW', price: 39, originalPrice: 49, image: 'https://m.media-amazon.com/images/I/81sGBhQBz-L._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 27 - Domótica
  {
    id: 'domotica',
    emoji: '🏠',
    title: 'Especial Casa Inteligente',
    subtitle: 'Automatiza tu hogar',
    searchTerms: ['enchufe inteligente', 'termostato inteligente', 'alexa hogar'],
    products: [
      { name: 'Termostato Inteligente Tado V3+', asin: 'B07FZ3TJZZ', price: 149, originalPrice: 219, image: 'https://m.media-amazon.com/images/I/51NvNqA-EoL._SL1000_.jpg', highlight: '🏆 Ahorra energía' },
      { name: 'TP-Link Tapo P100 Enchufes x4', asin: 'B0C6Y7DRDW', price: 29.99, originalPrice: 49.99, image: 'https://m.media-amazon.com/images/I/51H2jMYq9gL._AC_SL1500_.jpg', highlight: '💰 Chollazo' },
      { name: 'Ring Alarm Kit 5 Piezas', asin: 'B087QLQQWD', price: 199, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/51vM5NoxuDL._SL1000_.jpg', highlight: '🔐 Seguridad completa' },
      { name: 'Aqara Hub M2 + Sensor Kit', asin: 'B08GKHS4ZN', price: 89, originalPrice: 119, image: 'https://m.media-amazon.com/images/I/51g8zZa6nXL._AC_SL1500_.jpg' },
      { name: 'SwitchBot Curtain Rod 2', asin: 'B0C4G9HB4F', price: 79, originalPrice: 99, image: 'https://m.media-amazon.com/images/I/61fZXL2VcbL._AC_SL1500_.jpg', highlight: '🪟 Automatiza cortinas' },
    ]
  },
  // DÍA 28 - Zapatillas Running
  {
    id: 'zapatillas_running',
    emoji: '👟',
    title: 'Especial Zapatillas Running',
    subtitle: 'Las mejores para correr',
    searchTerms: ['nike running', 'asics running', 'brooks running'],
    products: [
      { name: 'Nike ZoomX Vaporfly Next% 2', asin: 'B08L5VXVFT', price: 219, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/71xYkBSCVRL._AC_SL1500_.jpg', highlight: '🏆 Las de élite' },
      { name: 'ASICS Gel-Nimbus 25', asin: 'B0B8XXQXS4', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/71xHPsIvhaL._AC_SL1500_.jpg', highlight: '🛡️ Máxima amortiguación' },
      { name: 'Brooks Ghost 15', asin: 'B0B8XXQXS4', price: 119, originalPrice: 159, image: 'https://m.media-amazon.com/images/I/71aP+OHqVkL._AC_SL1500_.jpg' },
      { name: 'Adidas Ultraboost Light', asin: 'B0BRT3SQD6', price: 139, originalPrice: 189, image: 'https://m.media-amazon.com/images/I/71pVPSbU2VL._AC_SL1500_.jpg' },
      { name: 'New Balance Fresh Foam 1080v12', asin: 'B09VXQMCKG', price: 129, originalPrice: 179, image: 'https://m.media-amazon.com/images/I/61LqmJrCYfL._AC_SL1000_.jpg', highlight: '💰 Mejor calidad-precio' },
    ]
  },
  // DÍA 29 - Proyectores
  {
    id: 'proyectores',
    emoji: '🎬',
    title: 'Especial Proyectores',
    subtitle: 'Tu cine en casa',
    searchTerms: ['proyector 4k', 'proyector portatil', 'epson proyector'],
    products: [
      { name: 'XGIMI Horizon Pro 4K', asin: 'B09N75KBNY', price: 1399, originalPrice: 1799, image: 'https://m.media-amazon.com/images/I/61RcZaL8zfL._AC_SL1500_.jpg', highlight: '🏆 Mejor 4K' },
      { name: 'Epson EH-TW7100 4K PRO-UHD', asin: 'B07TVN9DW9', price: 1199, originalPrice: 1599, image: 'https://m.media-amazon.com/images/I/71WJgqF+NtL._AC_SL1500_.jpg' },
      { name: 'XGIMI Halo+ Portátil FHD', asin: 'B09RBCB4TJ', price: 649, originalPrice: 849, image: 'https://m.media-amazon.com/images/I/61xQ+xthcfL._AC_SL1500_.jpg', highlight: '🎒 Portátil premium' },
      { name: 'BenQ TH671ST Gaming 1080p', asin: 'B07BJXKD4X', price: 599, originalPrice: 799, image: 'https://m.media-amazon.com/images/I/71wWITHDgZL._AC_SL1500_.jpg', highlight: '🎮 Ideal gaming' },
      { name: 'Nebula Anker Capsule 3 Laser', asin: 'B0BP6ZHHN2', price: 699, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/61jCIj+hTsL._AC_SL1500_.jpg', highlight: '📦 Súper compacto' },
    ]
  },
  // DÍA 30 - LEGO
  {
    id: 'lego',
    emoji: '🧱',
    title: 'Especial LEGO',
    subtitle: 'Para grandes y pequeños constructores',
    searchTerms: ['lego technic', 'lego star wars', 'lego architecture'],
    products: [
      { name: 'LEGO Technic Lamborghini Sián FKP 37', asin: 'B085BPWMST', price: 349, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/91gqZrcaLLL._AC_SL1500_.jpg', highlight: '🏆 Espectacular' },
      { name: 'LEGO Star Wars AT-AT 75313', asin: 'B09G5PR63V', price: 699, originalPrice: 799, image: 'https://m.media-amazon.com/images/I/81dbMPJRWwL._AC_SL1500_.jpg', highlight: '🌟 Collectors' },
      { name: 'LEGO Ideas Globo Terráqueo', asin: 'B09H34RL8V', price: 179, originalPrice: 229, image: 'https://m.media-amazon.com/images/I/81XhBDL-AhL._AC_SL1500_.jpg' },
      { name: 'LEGO Architecture Tokio', asin: 'B085B2HFMT', price: 49, originalPrice: 69, image: 'https://m.media-amazon.com/images/I/71XWD9gCOjL._AC_SL1500_.jpg', highlight: '💰 Regalo perfecto' },
      { name: 'LEGO Botanical Orquídea', asin: 'B09H34DZ2Y', price: 39.99, originalPrice: 49.99, image: 'https://m.media-amazon.com/images/I/81eLPCPp5UL._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 31 - Mochilas y Viaje
  {
    id: 'mochilas_viaje',
    emoji: '🎒',
    title: 'Especial Mochilas & Viaje',
    subtitle: 'Prepárate para la aventura',
    searchTerms: ['mochila viaje', 'mochila portatil', 'maleta cabina'],
    products: [
      { name: 'Samsonite Guardit 2.0 Laptop 17.3"', asin: 'B078XMCMZP', price: 59, originalPrice: 89, image: 'https://m.media-amazon.com/images/I/81dOHmXSMUL._AC_SL1500_.jpg', highlight: '🏆 Más vendida' },
      { name: 'The North Face Borealis 28L', asin: 'B08R3J2G7J', price: 79, originalPrice: 109, image: 'https://m.media-amazon.com/images/I/81Bf+kNKXxL._AC_SL1500_.jpg' },
      { name: 'American Tourister Maleta Cabina', asin: 'B077BQHFVC', price: 69, originalPrice: 99, image: 'https://m.media-amazon.com/images/I/71xLqoRxl1L._AC_SL1500_.jpg', highlight: '✈️ Cabina perfecta' },
      { name: 'Peak Design Everyday Backpack 20L', asin: 'B01MR5TYMH', price: 249, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/81iP7FyR85L._AC_SL1500_.jpg', highlight: '📷 Para fotógrafos' },
      { name: 'Cabin Max Metz Mochila Cabina', asin: 'B00MWCFLHS', price: 34.99, originalPrice: 49.99, image: 'https://m.media-amazon.com/images/I/81W6Q5yHQML._AC_SL1500_.jpg', highlight: '💰 Económica' },
    ]
  },
];

// ============================================
// LÓGICA PRINCIPAL
// ============================================

function getTodayTheme(): CampaignTheme {
  // Si hay override, buscar ese tema
  const themeOverride = process.env.THEME_OVERRIDE;
  if (themeOverride) {
    const theme = MONTHLY_THEMES.find(t => t.id === themeOverride);
    if (theme) return theme;
  }

  // Si hay día override, usar ese día
  const dayOverride = process.env.DAY_OVERRIDE;
  if (dayOverride) {
    const day = parseInt(dayOverride);
    if (day >= 1 && day <= 31) {
      return MONTHLY_THEMES[(day - 1) % MONTHLY_THEMES.length];
    }
  }

  // Usar el día del mes actual (1-31)
  const today = new Date();
  const dayOfMonth = today.getDate(); // 1-31
  return MONTHLY_THEMES[(dayOfMonth - 1) % MONTHLY_THEMES.length];
}

async function generateCampaignMessage(theme: CampaignTheme): Promise<string> {
  const amazonTag = process.env.AMAZON_ES_TAG || 'monetizehub-21';
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  // Header de la campaña
  let message = `${theme.emoji}${theme.emoji}${theme.emoji} **${theme.title.toUpperCase()}** ${theme.emoji}${theme.emoji}${theme.emoji}\n\n`;
  message += `📅 *${dateStr}*\n`;
  message += `💫 ${theme.subtitle}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Productos
  for (const product of theme.products) {
    const affiliateLink = `https://www.amazon.es/dp/${product.asin}?tag=${amazonTag}`;
    
    // Destacar si tiene highlight
    if (product.highlight) {
      message += `${product.highlight}\n`;
    }

    message += `🔹 **${product.name}**\n`;
    
    // Mostrar precio con descuento si lo tiene
    if (product.originalPrice && product.originalPrice > product.price) {
      const discount = Math.round((1 - product.price / product.originalPrice) * 100);
      message += `   💰 ~~${product.originalPrice.toFixed(2)}€~~ → **${product.price.toFixed(2)}€** (-${discount}%)\n`;
    } else {
      message += `   💰 **${product.price.toFixed(2)}€**\n`;
    }
    
    message += `   🛒 [Ver en Amazon](${affiliateLink})\n\n`;
  }

  // Footer
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `🔔 *¿Te gustan estos especiales diarios?*\n`;
  message += `👉 Comparte el canal con amigos: @tu_canal\n\n`;
  message += `⚠️ _Precios pueden variar. Como Afiliado de Amazon obtengo ingresos por compras adscritas._`;

  return message;
}

async function sendToTelegram(message: string, theme: CampaignTheme): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !chatId) {
    throw new Error('Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHANNEL_ID');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error Telegram: ${error}`);
  }

  logger.success(`✅ Campaña "${theme.title}" enviada correctamente`);
}

async function main() {
  logger.info('📢 Iniciando Campaña Temática Diaria...\n');
  
  try {
    // 1. Obtener tema del día
    const theme = getTodayTheme();
    const dayOfMonth = new Date().getDate();
    logger.info(`📅 Día ${dayOfMonth} del mes`);
    logger.info(`🎯 Tema de hoy: ${theme.emoji} ${theme.title}\n`);

    // 2. Generar mensaje
    logger.info('✍️ Generando mensaje de campaña...');
    const message = await generateCampaignMessage(theme);

    // 3. Enviar a Telegram
    logger.info('📤 Enviando a Telegram...');
    await sendToTelegram(message, theme);

    // 4. Log de productos incluidos
    logger.info('\n📦 Productos en esta campaña:');
    theme.products.forEach((p, i) => {
      const discount = p.originalPrice 
        ? ` (-${Math.round((1 - p.price / p.originalPrice) * 100)}%)`
        : '';
      logger.info(`   ${i + 1}. ${p.name} - ${p.price}€${discount}`);
    });

    logger.success('\n🎉 ¡Campaña diaria completada!');
  } catch (error) {
    logger.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
