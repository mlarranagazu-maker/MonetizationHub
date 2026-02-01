// 📢 Daily Campaign - Campañas Temáticas Diarias
// Cada día del mes tiene un tema diferente, ciclo de 31 días
// Incluye validación automática de enlaces

import { config } from 'dotenv';
import { logger } from './utils/logger.js';
import { validateProducts, filterValidProducts, generateValidationReport } from './utils/link-validator.js';

config();

// Configuración
const MIN_PRODUCTS_PER_CAMPAIGN = 8; // Mínimo de productos válidos para enviar
const TARGET_PRODUCTS = 10; // Objetivo de productos por campaña

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

// 31 TEMAS - Uno para cada día del mes (10 productos cada uno)
const MONTHLY_THEMES: CampaignTheme[] = [
  // DÍA 1 - Barbacoas y Parrillas
  {
    id: 'barbacoas_weber',
    emoji: '🔥',
    title: 'Especial Barbacoas',
    subtitle: 'Las mejores barbacoas para disfrutar al aire libre',
    searchTerms: ['barbacoa', 'parrilla', 'weber'],
    products: [
      { name: 'Weber Spirit E-310 Barbacoa Gas 3 Quemadores', asin: 'B01HHIG326', price: 549, originalPrice: 699, image: 'https://m.media-amazon.com/images/I/71sWn6u9sBL._AC_SL1500_.jpg', highlight: '🏆 Más vendida' },
      { name: 'Weber Master-Touch GBS 57cm Carbón', asin: 'B00WWRB5N2', price: 299, originalPrice: 369, image: 'https://m.media-amazon.com/images/I/81vKOQ8xp9L._AC_SL1500_.jpg' },
      { name: 'Weber Compact Kettle 47cm Negro', asin: 'B00H1PT7J8', price: 99, image: 'https://m.media-amazon.com/images/I/71+4HBdPiVL._AC_SL1500_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Weber Q1000 Gas Portátil', asin: 'B00FKB8NX0', price: 239, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/71SxPV-7eQL._AC_SL1500_.jpg' },
      { name: 'Weber Smokey Joe Premium 37cm Portátil', asin: 'B00H1PT7HU', price: 79, image: 'https://m.media-amazon.com/images/I/71Wm1G4NJNL._AC_SL1500_.jpg', highlight: '🎒 Portátil' },
      { name: 'Campingaz Xpert 100 L Plus Rocky', asin: 'B00RBXTHM0', price: 159, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/71Y0VG1VP5L._AC_SL1500_.jpg' },
      { name: 'Char-Broil Gas2Coal 330 Híbrida', asin: 'B07D347Z63', price: 349, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/81pEFCXMbfL._AC_SL1500_.jpg', highlight: '⚡ Gas + Carbón' },
      { name: 'Tepro Toronto Click Carbón con Tapa', asin: 'B00BU0DULI', price: 119, originalPrice: 149, image: 'https://m.media-amazon.com/images/I/71HMiQ5YwfL._AC_SL1500_.jpg' },
      { name: 'Weber Chimney Starter Encendedor Carbón', asin: 'B000WEOQV8', price: 29, image: 'https://m.media-amazon.com/images/I/71j6qx4sGPL._AC_SL1500_.jpg', highlight: '🔧 Accesorio esencial' },
      { name: 'Landmann Taurus 660 Parrilla Carbón', asin: 'B01LXPQBN5', price: 89, originalPrice: 119, image: 'https://m.media-amazon.com/images/I/71OHJ0nrL4L._AC_SL1500_.jpg' },
    ]
  },
  // DÍA 2 - Smart TV Samsung
  {
    id: 'tv_samsung',
    emoji: '📺',
    title: 'Especial TV Samsung',
    subtitle: 'Tecnología QLED y Smart TV a precios increíbles',
    searchTerms: ['samsung tv', 'samsung qled', 'smart tv'],
    products: [
      { name: 'Samsung 55" Crystal UHD 4K TU7095', asin: 'B0863VZVJF', price: 399, originalPrice: 549, image: 'https://m.media-amazon.com/images/I/71RiQZ4n0QL._AC_SL1500_.jpg', highlight: '🏆 Más vendida' },
      { name: 'Samsung 50" Crystal UHD 4K AU7175', asin: 'B096H2SQJK', price: 379, originalPrice: 499, image: 'https://m.media-amazon.com/images/I/71LJJrKbezL._AC_SL1500_.jpg', highlight: '💰 Mejor relación calidad-precio' },
      { name: 'Samsung 43" Full HD Smart TV T5305', asin: 'B086T29YNH', price: 279, originalPrice: 349, image: 'https://m.media-amazon.com/images/I/71d3oPVZDLL._AC_SL1500_.jpg' },
      { name: 'Samsung 65" Crystal UHD 4K AU7175', asin: 'B096H2Z9NF', price: 549, originalPrice: 699, image: 'https://m.media-amazon.com/images/I/71LPk8kbI2L._AC_SL1500_.jpg' },
      { name: 'Samsung 32" HD Smart TV T4305', asin: 'B086T21FFT', price: 199, image: 'https://m.media-amazon.com/images/I/71RwSNjwpKL._AC_SL1500_.jpg' },
      { name: 'LG 55" 4K UHD Smart TV 55UP75006', asin: 'B092RF4H5P', price: 449, originalPrice: 599, image: 'https://m.media-amazon.com/images/I/71WPj+L4ucL._AC_SL1500_.jpg' },
      { name: 'Hisense 50" 4K UHD Smart TV 50A6G', asin: 'B08YRGP1HT', price: 329, originalPrice: 429, image: 'https://m.media-amazon.com/images/I/71O5SFTPZ9L._AC_SL1500_.jpg', highlight: '💎 Calidad-precio' },
      { name: 'TCL 43" 4K UHD Android TV 43P639', asin: 'B09VD4D3D1', price: 279, originalPrice: 349, image: 'https://m.media-amazon.com/images/I/71N-8V+OHwL._AC_SL1500_.jpg' },
      { name: 'Amazon Fire TV Stick 4K Max', asin: 'B08MQZXN1X', price: 39.99, originalPrice: 64.99, image: 'https://m.media-amazon.com/images/I/51CgKGfMelL._AC_SL1000_.jpg', highlight: '🔥 Accesorio top' },
      { name: 'Barra de Sonido Samsung HW-B450', asin: 'B09WCSJXT2', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/61FJ+hIl-WL._AC_SL1500_.jpg' },
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
      { name: 'Cama Ortopédica Bedsure Perro XL', asin: 'B082WHYKHN', price: 39.99, originalPrice: 54.99, image: 'https://m.media-amazon.com/images/I/81W4HxK9LML._AC_SL1500_.jpg' },
      { name: 'Kong Classic Juguete Resistente L', asin: 'B0002AR0I8', price: 12.99, image: 'https://m.media-amazon.com/images/I/71awnMRjhCL._AC_SL1500_.jpg', highlight: '💪 Indestructible' },
      { name: 'Tractive GPS Localizador Perros', asin: 'B07BFMLZ1P', price: 49.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/61gfT4U1NGL._AC_SL1500_.jpg', highlight: '📍 GPS' },
      { name: 'Furminator Cepillo Deslanador L', asin: 'B0040QQ07C', price: 24.99, originalPrice: 34.99, image: 'https://m.media-amazon.com/images/I/71pimfYkNRL._AC_SL1500_.jpg' },
      { name: 'Pedigree DentaStix Pack 56 uds', asin: 'B00CITLLC0', price: 14.99, originalPrice: 19.99, image: 'https://m.media-amazon.com/images/I/81rOIKBMvvL._AC_SL1500_.jpg' },
      { name: 'Pecute Arnés Perro Anti Tirones', asin: 'B07NQJY3HV', price: 16.99, originalPrice: 24.99, image: 'https://m.media-amazon.com/images/I/71KPT7wYRFL._AC_SL1500_.jpg', highlight: '🎒 Para paseos' },
      { name: 'Comedero Automático PetSafe 5 comidas', asin: 'B00BUFZPWA', price: 49.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/71dT7VsLn+L._AC_SL1500_.jpg' },
      { name: 'Transportín Plegable AmazonBasics L', asin: 'B00OP6SVJQ', price: 34.99, originalPrice: 44.99, image: 'https://m.media-amazon.com/images/I/81EKYYh6EKL._AC_SL1500_.jpg' },
      { name: 'Chubasquero Perro Impermeable XL', asin: 'B07GVNRH5G', price: 19.99, originalPrice: 29.99, image: 'https://m.media-amazon.com/images/I/71sI3V-WnfL._AC_SL1500_.jpg', highlight: '🌧️ Para lluvia' },
    ]
  },
  // DÍA 4 - Relojes Garmin
  {
    id: 'relojes_garmin',
    emoji: '⌚',
    title: 'Especial Relojes Deportivos',
    subtitle: 'El compañero perfecto para deportistas',
    searchTerms: ['garmin', 'reloj gps', 'smartwatch deporte'],
    products: [
      { name: 'Garmin Forerunner 55 GPS Running', asin: 'B096FPLK8P', price: 139, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/61zz1HE9J3S._AC_SL1500_.jpg', highlight: '🏆 Más vendido' },
      { name: 'Garmin Forerunner 245 Music', asin: 'B07QLR6W7S', price: 229, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/71SHObXteRL._AC_SL1500_.jpg', highlight: '🎵 Con música' },
      { name: 'Garmin Instinct 2 Solar', asin: 'B09NMHKXTM', price: 299, originalPrice: 399, image: 'https://m.media-amazon.com/images/I/71A2VQEX0gL._AC_SL1500_.jpg', highlight: '🔋 Carga solar' },
      { name: 'Garmin Vivoactive 4 GPS', asin: 'B07W7HMNZX', price: 199, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/61aJAzj0gwL._AC_SL1500_.jpg' },
      { name: 'Garmin Fenix 6 Pro', asin: 'B07WL6QJ5M', price: 449, originalPrice: 599, image: 'https://m.media-amazon.com/images/I/71ynpnNJzIL._AC_SL1500_.jpg', highlight: '💎 Premium' },
      { name: 'Polar Vantage M2 Multisport', asin: 'B08L3PR6B6', price: 249, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/61WlLJV+pnL._AC_SL1500_.jpg' },
      { name: 'Suunto 5 Peak GPS Ligero', asin: 'B09XRTD8KQ', price: 199, originalPrice: 269, image: 'https://m.media-amazon.com/images/I/61pTmC6IUXL._AC_SL1500_.jpg' },
      { name: 'Coros Pace 2 GPS Premium', asin: 'B08HLQGR5G', price: 179, originalPrice: 229, image: 'https://m.media-amazon.com/images/I/61T4oBjxP2L._AC_SL1500_.jpg', highlight: '🪶 Ultra ligero' },
      { name: 'Amazfit GTR 4 AMOLED GPS', asin: 'B0BGPZ9MQX', price: 159, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/61rY6C5wNiL._AC_SL1500_.jpg', highlight: '💰 Mejor precio' },
      { name: 'Xiaomi Mi Watch S1 Active', asin: 'B09QQR9ZL7', price: 129, originalPrice: 179, image: 'https://m.media-amazon.com/images/I/51WX5lPvqcL._AC_SL1000_.jpg' },
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
      { name: 'Xiaomi 14 Ultra 5G 16GB/512GB', asin: 'B0CXHS4RNH', price: 1299, originalPrice: 1499, image: 'https://m.media-amazon.com/images/I/51JtjDQU6mL._AC_SL1500_.jpg', highlight: '📷 Cámara Leica' },
      { name: 'Xiaomi Redmi Note 12 Pro+ 8GB/256GB', asin: 'B0BVCXJ3KZ', price: 349, originalPrice: 429, image: 'https://m.media-amazon.com/images/I/71X8F1lmBRL._AC_SL1500_.jpg' },
      { name: 'Xiaomi POCO M6 Pro 12GB/512GB', asin: 'B0CTQJ1CMK', price: 229, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/71FQGZY6LuL._AC_SL1500_.jpg' },
      { name: 'Xiaomi Redmi 12C 4GB/128GB', asin: 'B0BTYCJFBG', price: 99, originalPrice: 139, image: 'https://m.media-amazon.com/images/I/71qCHGSvZBL._AC_SL1500_.jpg' },
      { name: 'Xiaomi Pad 6 8GB/256GB Tablet', asin: 'B0C7J6YCP4', price: 349, originalPrice: 399, image: 'https://m.media-amazon.com/images/I/61Qmq7XFVNL._AC_SL1500_.jpg', highlight: '📱 Tablet Premium' },
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
      { name: 'De\'Longhi Magnifica Evo ECAM290', asin: 'B09J52BTHV', price: 399, originalPrice: 549, image: 'https://m.media-amazon.com/images/I/61E2cFTFB4L._AC_SL1500_.jpg', highlight: '✨ Nueva generación' },
      { name: 'Sage The Barista Express Impress', asin: 'B0BHXVPHH4', price: 599, originalPrice: 749, image: 'https://m.media-amazon.com/images/I/71Rb1BNQL9L._AC_SL1500_.jpg' },
      { name: 'Nespresso Lattissima One', asin: 'B07D2C3W8K', price: 199, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/61qJ8X1gHkL._AC_SL1500_.jpg', highlight: '🥛 Con espumador' },
      { name: 'Siemens EQ.500 integral TQ505R09', asin: 'B07TXJXL5F', price: 649, originalPrice: 849, image: 'https://m.media-amazon.com/images/I/71xN8p0+vwL._AC_SL1500_.jpg' },
      { name: 'Melitta Barista Smart TS', asin: 'B07GXJC52H', price: 549, originalPrice: 699, image: 'https://m.media-amazon.com/images/I/71cqjGpzHsL._AC_SL1500_.jpg', highlight: '📱 Control App' },
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
      { name: 'Sony WF-C700N Earbuds ANC', asin: 'B0BZCB5XKQ', price: 89, originalPrice: 119, image: 'https://m.media-amazon.com/images/I/519Eo9BLWML._AC_SL1500_.jpg' },
      { name: 'Sony INZONE H9 Gaming Wireless', asin: 'B0B5XGFXP4', price: 269, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/61fQn36NLVL._AC_SL1500_.jpg', highlight: '🎮 Para gamers' },
      { name: 'Sony WH-XB910N Extra Bass', asin: 'B09F5HZQTH', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/61+lJWBdJXL._AC_SL1500_.jpg', highlight: '🔊 Extra Bass' },
      { name: 'Sony MDR-ZX310 Plegables', asin: 'B00I3LUVBG', price: 19.99, originalPrice: 29.99, image: 'https://m.media-amazon.com/images/I/81EFCUu6OXL._AC_SL1500_.jpg' },
      { name: 'Sony WF-L900 LinkBuds', asin: 'B09QTLP6VN', price: 129, originalPrice: 179, image: 'https://m.media-amazon.com/images/I/51bPxcJcN5L._AC_SL1500_.jpg', highlight: '👂 Diseño abierto' },
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
      { name: 'Roborock Q7 Max+ Autovaciado', asin: 'B09V1J3F8K', price: 549, originalPrice: 699, image: 'https://m.media-amazon.com/images/I/61sN7kPJnXL._AC_SL1500_.jpg' },
      { name: 'iRobot Roomba i3+ Autovaciado', asin: 'B08R2H7R8T', price: 449, originalPrice: 599, image: 'https://m.media-amazon.com/images/I/61qOr7cDyRL._AC_SL1500_.jpg' },
      { name: 'Dreame L10s Ultra Robot', asin: 'B0B5P4M7XV', price: 799, originalPrice: 999, image: 'https://m.media-amazon.com/images/I/61RQxm-G5WL._AC_SL1500_.jpg', highlight: '🧼 Friega + Aspira' },
      { name: 'Eufy RoboVac 11S Slim', asin: 'B07QXM2V7D', price: 149, originalPrice: 229, image: 'https://m.media-amazon.com/images/I/61fGhLHYN+L._AC_SL1500_.jpg' },
      { name: 'Lefant M210 Robot Aspirador', asin: 'B08GCRHNSH', price: 119, originalPrice: 179, image: 'https://m.media-amazon.com/images/I/61vG9YJ2RcL._AC_SL1500_.jpg' },
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
      { name: 'PlayStation 5 Digital Edition', asin: 'B09BKN7W87', price: 449, image: 'https://m.media-amazon.com/images/I/51fqDoTsHXL._SL1500_.jpg', highlight: '💰 Versión digital' },
      { name: 'DualSense Volcanic Red', asin: 'B09Q3GY9GS', price: 69.99, originalPrice: 74.99, image: 'https://m.media-amazon.com/images/I/61bYK7K0wnL._SL1500_.jpg' },
      { name: 'DualSense Charging Station', asin: 'B08H99J4SG', price: 27.99, originalPrice: 29.99, image: 'https://m.media-amazon.com/images/I/61k7EhZNZmL._SL1500_.jpg' },
      { name: 'PS5 Camera HD 1080p', asin: 'B08H99GFLF', price: 49.99, originalPrice: 59.99, image: 'https://m.media-amazon.com/images/I/41Q+cqjEQ5L._SL1000_.jpg' },
      { name: 'SSD WD Black SN850 1TB PS5', asin: 'B0B25LXFQ6', price: 119, originalPrice: 169, image: 'https://m.media-amazon.com/images/I/71SHnBDg9uL._AC_SL1500_.jpg', highlight: '💾 Amplía almacenamiento' },
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
      { name: 'Ninja FlexDrawer AN500EU 10.4L', asin: 'B0CLPV4HNB', price: 249, originalPrice: 329, image: 'https://m.media-amazon.com/images/I/71T1QqQr+aL._AC_SL1500_.jpg', highlight: '🔥 Mega capacidad' },
      { name: 'TEFAL Easy Fry Dual Zone', asin: 'B09KGXV5Z3', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/71e9bKlrr+L._AC_SL1500_.jpg' },
      { name: 'Aigostar Air Fryer 7L XXL', asin: 'B09MTKF3KN', price: 69, originalPrice: 99, image: 'https://m.media-amazon.com/images/I/61PGQJ7R0WL._AC_SL1500_.jpg' },
      { name: 'Xiaomi Smart Air Fryer 6.5L', asin: 'B0BGZH4SMQ', price: 79, originalPrice: 119, image: 'https://m.media-amazon.com/images/I/51V9LIqhF6L._AC_SL1500_.jpg', highlight: '📱 Control App' },
      { name: 'Princess Aerofryer XXL 5.2L', asin: 'B08JHR7T6V', price: 89, originalPrice: 129, image: 'https://m.media-amazon.com/images/I/71-PK1UPJsL._AC_SL1500_.jpg' },
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
      { name: 'Purina Felix Double Delicious 80x85g', asin: 'B085W7LDZF', price: 32.99, originalPrice: 45.99, image: 'https://m.media-amazon.com/images/I/81FXWB+K4cL._AC_SL1500_.jpg' },
      { name: 'Transportín Gato Plegable XXL', asin: 'B073WPWV4P', price: 29.99, originalPrice: 39.99, image: 'https://m.media-amazon.com/images/I/71aLnF0k7cL._AC_SL1500_.jpg' },
      { name: 'Rascador Carton Gato XL 5 unidades', asin: 'B08RYQBZQM', price: 15.99, originalPrice: 22.99, image: 'https://m.media-amazon.com/images/I/71eVXXfqq3L._AC_SL1500_.jpg' },
      { name: 'Cama Gato Donut Antiestrés', asin: 'B09G9GZT9F', price: 19.99, originalPrice: 29.99, image: 'https://m.media-amazon.com/images/I/71N+6qCqKRL._AC_SL1500_.jpg' },
      { name: 'Whiskas Snacks Temptations 8x60g', asin: 'B07K2VXLC6', price: 13.99, originalPrice: 19.99, image: 'https://m.media-amazon.com/images/I/81K7zJQ3dZL._AC_SL1500_.jpg' },
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
      { name: 'Apple Watch Series 9 GPS 41mm', asin: 'B0CHX2F5QT', price: 419, originalPrice: 459, image: 'https://m.media-amazon.com/images/I/81s2LYRJ3nL._AC_SL1500_.jpg' },
      { name: 'Correa Apple Watch Milanesa', asin: 'B09JQPT1LK', price: 99, image: 'https://m.media-amazon.com/images/I/71YvYGrjNcL._AC_SL1500_.jpg', highlight: '✨ Elegante' },
      { name: 'Funda Protectora Apple Watch', asin: 'B0B6CP4D7J', price: 9.99, originalPrice: 14.99, image: 'https://m.media-amazon.com/images/I/61XG9n9BTPL._AC_SL1500_.jpg' },
      { name: 'Base Carga Apple Watch Stand', asin: 'B07DFFG6VB', price: 19.99, originalPrice: 29.99, image: 'https://m.media-amazon.com/images/I/61H3n4yc4GL._AC_SL1500_.jpg' },
      { name: 'Pack 5 Correas Silicona Apple Watch', asin: 'B09NQJQBZB', price: 14.99, originalPrice: 24.99, image: 'https://m.media-amazon.com/images/I/71Dh8sSYXJL._AC_SL1500_.jpg' },
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
      { name: 'Segway Ninebot MAX G30E II', asin: 'B09W9RDXWT', price: 699, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/61O2HpTj+OL._AC_SL1500_.jpg', highlight: '🔋 65km autonomía' },
      { name: 'Xiaomi Electric Scooter 4', asin: 'B0B8V7LZZM', price: 399, originalPrice: 499, image: 'https://m.media-amazon.com/images/I/51qMl56FJFL._AC_SL1000_.jpg' },
      { name: 'Hiboy S2 Pro Patinete 10"', asin: 'B08HGZBCPH', price: 449, originalPrice: 549, image: 'https://m.media-amazon.com/images/I/61TzZ2H84oL._AC_SL1500_.jpg' },
      { name: 'Candado Patinete Linka Smart', asin: 'B07RTDDNKJ', price: 49, originalPrice: 79, image: 'https://m.media-amazon.com/images/I/61CjPJzgKWL._AC_SL1500_.jpg' },
      { name: 'Casco Urban Closca Loop', asin: 'B08H1LVZKH', price: 79, originalPrice: 99, image: 'https://m.media-amazon.com/images/I/61MLCQDy3CL._AC_SL1500_.jpg', highlight: '🪖 Plegable' },
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
      { name: 'Bañera Bebé Plegable Stokke Flexi', asin: 'B00FMPM3DC', price: 39.99, originalPrice: 49.99, image: 'https://m.media-amazon.com/images/I/71FJ0+9qB5L._AC_SL1500_.jpg' },
      { name: 'Sacaleches Eléctrico Medela Swing', asin: 'B00JQ8JQIQ', price: 139, originalPrice: 189, image: 'https://m.media-amazon.com/images/I/51m3U7mxmzL._AC_SL1500_.jpg' },
      { name: 'Termómetro Digital Braun ThermoScan', asin: 'B00NVQGYFY', price: 49.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/61lbmIq3TIL._AC_SL1500_.jpg' },
      { name: 'Mochila Portabebés Ergobaby Omni 360', asin: 'B06Y5XZSY7', price: 149, originalPrice: 189, image: 'https://m.media-amazon.com/images/I/81CJ3sNQP+L._AC_SL1500_.jpg', highlight: '👶 Ergonómica' },
      { name: 'Humidificador Bebé Babymoov Hygro+', asin: 'B00OPJP6CW', price: 69.99, originalPrice: 89.99, image: 'https://m.media-amazon.com/images/I/71qRU8bxILL._AC_SL1500_.jpg' },
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
      { name: 'Acer Nitro 5 AN515 RTX 4050', asin: 'B0C4HWK6LN', price: 849, originalPrice: 1049, image: 'https://m.media-amazon.com/images/I/81n+qEd9ZNL._AC_SL1500_.jpg' },
      { name: 'HP Victus 16 RTX 4060 16.1"', asin: 'B0C4J9S67J', price: 999, originalPrice: 1299, image: 'https://m.media-amazon.com/images/I/71nH1Wa98PL._AC_SL1500_.jpg' },
      { name: 'ASUS TUF Gaming A15 RTX 4070', asin: 'B0C4HX6FL7', price: 1299, originalPrice: 1549, image: 'https://m.media-amazon.com/images/I/81GpPJnTi2L._AC_SL1500_.jpg', highlight: '🔥 RTX 4070' },
      { name: 'Lenovo IdeaPad Gaming 3 RTX 3050', asin: 'B0BTXK6DVN', price: 699, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/71xJO9CCJNL._AC_SL1500_.jpg' },
      { name: 'MSI Cyborg 15 A12VE RTX 4050', asin: 'B0C4P3DXJZ', price: 899, originalPrice: 1099, image: 'https://m.media-amazon.com/images/I/71K4kKl6BsL._AC_SL1500_.jpg' },
      { name: 'Ratón Gaming Logitech G502 HERO', asin: 'B07GBZ4Q68', price: 39.99, originalPrice: 59.99, image: 'https://m.media-amazon.com/images/I/61mpMH5TzkL._AC_SL1500_.jpg' },
      { name: 'Base Refrigeradora Gaming RGB', asin: 'B09GFQZK4V', price: 29.99, originalPrice: 49.99, image: 'https://m.media-amazon.com/images/I/71Ue-4sPMtL._AC_SL1500_.jpg' },
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
      { name: 'Canon EOS R10 + RF-S 18-150mm', asin: 'B0B2KVPMXL', price: 1299, originalPrice: 1499, image: 'https://m.media-amazon.com/images/I/61zexBP+RfL._AC_SL1500_.jpg' },
      { name: 'Canon RF 35mm f/1.8 Macro IS STM', asin: 'B07H4R3MSL', price: 449, originalPrice: 549, image: 'https://m.media-amazon.com/images/I/71yNEJwCu4L._AC_SL1500_.jpg' },
      { name: 'Canon Speedlite EL-100', asin: 'B07GC1QGBK', price: 179, originalPrice: 239, image: 'https://m.media-amazon.com/images/I/61n1oHKOhBL._AC_SL1500_.jpg' },
      { name: 'Tarjeta SanDisk Extreme PRO 256GB', asin: 'B09X7FXHVJ', price: 44.99, originalPrice: 64.99, image: 'https://m.media-amazon.com/images/I/81bC4QKtYEL._AC_SL1500_.jpg' },
      { name: 'Trípode Manfrotto Befree Advanced', asin: 'B07XPVV5YP', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/61S9e2QE1DL._AC_SL1200_.jpg' },
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
      { name: 'Esterilla Yoga Liforme Premium', asin: 'B01M65W4WL', price: 89, originalPrice: 129, image: 'https://m.media-amazon.com/images/I/61wgNn5vb1L._AC_SL1500_.jpg' },
      { name: 'Kettlebell Ajustable 3-18kg', asin: 'B08L3ZP93V', price: 129, originalPrice: 179, image: 'https://m.media-amazon.com/images/I/61e+2zN5ZrL._AC_SL1500_.jpg' },
      { name: 'Bicicleta Estática Spinning Indoor', asin: 'B08VDMKR4R', price: 299, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/71HUj+XVVKL._AC_SL1500_.jpg' },
      { name: 'Foam Roller Masaje Muscular', asin: 'B07K1F9Z7P', price: 19.99, originalPrice: 29.99, image: 'https://m.media-amazon.com/images/I/61xYEHVhqEL._AC_SL1500_.jpg' },
      { name: 'Proteína Whey Optimum Nutrition 2.27kg', asin: 'B000QSNYGI', price: 54.99, originalPrice: 74.99, image: 'https://m.media-amazon.com/images/I/71d1bK9tKoL._AC_SL1500_.jpg' },
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
      { name: 'Philips Hue Iris Lámpara Mesa', asin: 'B07T8QM9TH', price: 79, originalPrice: 99, image: 'https://m.media-amazon.com/images/I/51jU2XbHWPL._AC_SL1000_.jpg' },
      { name: 'Philips Hue Go Portable', asin: 'B00UVHAC12', price: 69, originalPrice: 89, image: 'https://m.media-amazon.com/images/I/61J1w3KnLEL._AC_SL1000_.jpg', highlight: '🔋 Portátil' },
      { name: 'Philips Hue White Ambiance GU10 x2', asin: 'B0748NKTJD', price: 34.99, originalPrice: 49.99, image: 'https://m.media-amazon.com/images/I/41bN05xc5hL._AC_SL1000_.jpg' },
      { name: 'Philips Hue Dimmer Switch V2', asin: 'B09D8X1XBQ', price: 19.99, originalPrice: 29.99, image: 'https://m.media-amazon.com/images/I/31gfKpPNJhL._AC_.jpg' },
      { name: 'Philips Hue Outdoor Lightstrip 5m', asin: 'B08HQ5LGCJ', price: 129, originalPrice: 169, image: 'https://m.media-amazon.com/images/I/71F0OHB9r7L._AC_SL1500_.jpg', highlight: '🌳 Exterior' },
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
      { name: 'Super Smash Bros. Ultimate', asin: 'B07D2FSDF5', price: 49.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/81Mh4RlhxsL._SL1500_.jpg' },
      { name: 'Animal Crossing: New Horizons', asin: 'B082FGWWHT', price: 44.99, originalPrice: 59.99, image: 'https://m.media-amazon.com/images/I/91lLDRq23ML._SL1500_.jpg' },
      { name: 'Nintendo Switch Funda + Protector', asin: 'B06WLKL8JN', price: 19.99, originalPrice: 24.99, image: 'https://m.media-amazon.com/images/I/81H3cRBmK7L._SL1500_.jpg' },
      { name: 'Joy-Con Neon Red/Blue Pack', asin: 'B08HFMXQV5', price: 69.99, originalPrice: 79.99, image: 'https://m.media-amazon.com/images/I/51bUMPaTvKL._SL1000_.jpg' },
      { name: 'Base Carga Joy-Con 4 en 1', asin: 'B075FBLJCR', price: 14.99, originalPrice: 24.99, image: 'https://m.media-amazon.com/images/I/71I9WU+xR2L._SL1500_.jpg' },
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
      { name: 'NuFace Mini Tonificador Facial', asin: 'B00CRJKFUQ', price: 179, originalPrice: 229, image: 'https://m.media-amazon.com/images/I/51Rlm5d7KML._SL1500_.jpg' },
      { name: 'CeraVe Crema Hidratante 454g', asin: 'B00KVLJXEA', price: 16.99, originalPrice: 24.99, image: 'https://m.media-amazon.com/images/I/61S7BrCBj7L._SL1000_.jpg', highlight: '💰 Mejor precio' },
      { name: 'La Roche-Posay Effaclar Duo+', asin: 'B00IDFJ7TM', price: 16.99, originalPrice: 22.99, image: 'https://m.media-amazon.com/images/I/51M1mBJy9tL._SL1500_.jpg' },
      { name: 'Oral-B iO Series 9 Eléctrico', asin: 'B08VNDQZ6M', price: 249, originalPrice: 349, image: 'https://m.media-amazon.com/images/I/71q6aIlTq9L._AC_SL1500_.jpg' },
      { name: 'Dyson Airwrap Complete', asin: 'B09NRG7WYH', price: 499, originalPrice: 599, image: 'https://m.media-amazon.com/images/I/61YXDCR8WlL._SL1500_.jpg', highlight: '💨 Secado + Rizos' },
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
      { name: 'KitchenAid Exprimidor Cítricos', asin: 'B0000639FD', price: 99, originalPrice: 129, image: 'https://m.media-amazon.com/images/I/71EJnRokbsL._AC_SL1500_.jpg' },
      { name: 'KitchenAid Picadora 3.5 Tazas', asin: 'B00CJGHRR6', price: 59, originalPrice: 79, image: 'https://m.media-amazon.com/images/I/71QQ1YcP8zL._AC_SL1500_.jpg' },
      { name: 'KitchenAid Accesorio Pasta Rodillo', asin: 'B00005RIFQ', price: 129, originalPrice: 169, image: 'https://m.media-amazon.com/images/I/61v6jEH8Y6L._AC_SL1500_.jpg', highlight: '🍝 Para pasta' },
      { name: 'KitchenAid Accesorio Picadora Carne', asin: 'B00004SGFH', price: 79, originalPrice: 99, image: 'https://m.media-amazon.com/images/I/71fz2WgGdoL._AC_SL1500_.jpg' },
      { name: 'KitchenAid Cafetera Goteo 12 Tazas', asin: 'B074WBPNK1', price: 119, originalPrice: 159, image: 'https://m.media-amazon.com/images/I/71oM+5PlrFL._AC_SL1500_.jpg' },
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
      { name: 'Ring Indoor Cam Gen 2', asin: 'B09491FYZ8', price: 49, originalPrice: 69, image: 'https://m.media-amazon.com/images/I/51lKj8gw9mL._SL1000_.jpg' },
      { name: 'Eufy Security eufyCam 2C Pro 2-Cam', asin: 'B09C28KHF5', price: 219, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/61a8zglJe9L._SL1500_.jpg', highlight: '🔋 Sin suscripción' },
      { name: 'TP-Link Tapo C310 Exterior', asin: 'B08GCKTNC5', price: 39.99, originalPrice: 54.99, image: 'https://m.media-amazon.com/images/I/51bN-Bfc+0L._AC_SL1000_.jpg' },
      { name: 'Ring Alarm Kit 5 Piezas 2ª Gen', asin: 'B084DLNF5V', price: 199, originalPrice: 269, image: 'https://m.media-amazon.com/images/I/71OMGv9WUKL._SL1500_.jpg' },
      { name: 'Xiaomi Smart Camera C300', asin: 'B0B8VX8JQP', price: 34.99, originalPrice: 49.99, image: 'https://m.media-amazon.com/images/I/51IEzJhJq1L._AC_SL1500_.jpg' },
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
      { name: 'Garmin Varia RTL515 Radar Trasero', asin: 'B089QJ9V6D', price: 179, originalPrice: 219, image: 'https://m.media-amazon.com/images/I/61mxJ3T0pRL._AC_SL1500_.jpg', highlight: '🚨 Radar coches' },
      { name: 'Wahoo ELEMNT BOLT V2 GPS', asin: 'B096QYVPVT', price: 249, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/71VqX3xaFnL._AC_SL1500_.jpg' },
      { name: 'Maillot Ciclismo Castelli Aero', asin: 'B07N6GTZTP', price: 89, originalPrice: 129, image: 'https://m.media-amazon.com/images/I/71XmsCXJuRL._AC_SL1500_.jpg' },
      { name: 'Pedales Shimano SPD-SL 105', asin: 'B07MXNJ56G', price: 89, originalPrice: 119, image: 'https://m.media-amazon.com/images/I/71Nx5cjhp4L._AC_SL1500_.jpg' },
      { name: 'Bomba Inflador Topeak Road Morph', asin: 'B00BKNV6E2', price: 44.99, originalPrice: 59.99, image: 'https://m.media-amazon.com/images/I/61oKQmHCKVL._AC_SL1500_.jpg' },
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
      { name: 'Google Nest Audio', asin: 'B0854HLMWD', price: 69, originalPrice: 99, image: 'https://m.media-amazon.com/images/I/71i6cxbXgaL._SL1500_.jpg' },
      { name: 'Sonos Era 100 Bluetooth + WiFi', asin: 'B0BW2LZ1ZM', price: 249, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/71+cV8UMWnL._AC_SL1500_.jpg', highlight: '✨ Nueva generación' },
      { name: 'Echo Studio Hi-Fi', asin: 'B07NQDPL7W', price: 179, originalPrice: 219, image: 'https://m.media-amazon.com/images/I/51YvIhz8JFL._AC_SL1000_.jpg', highlight: '🎧 3D Audio' },
      { name: 'Apple HomePod mini', asin: 'B08L7N6PS8', price: 99, image: 'https://m.media-amazon.com/images/I/71e7y7fGadL._AC_SL1500_.jpg' },
      { name: 'Bose SoundLink Revolve+ II', asin: 'B091L44N3P', price: 269, originalPrice: 329, image: 'https://m.media-amazon.com/images/I/71Cig8BklOL._AC_SL1500_.jpg', highlight: '🔊 360° sonido' },
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
      { name: 'Herman Miller Aeron Remastered', asin: 'B01N32WL55', price: 1299, originalPrice: 1499, image: 'https://m.media-amazon.com/images/I/61U9mNWBPGL._AC_SL1500_.jpg', highlight: '👑 Legendaria' },
      { name: 'Corsair TC200 Fabric Gaming', asin: 'B0B2Z1VTFK', price: 279, originalPrice: 349, image: 'https://m.media-amazon.com/images/I/71nY5LnGaOL._AC_SL1500_.jpg' },
      { name: 'Razer Iskur X Gaming Chair', asin: 'B08WJS9GX4', price: 349, originalPrice: 449, image: 'https://m.media-amazon.com/images/I/71Y7VSJR2NL._AC_SL1500_.jpg' },
      { name: 'Ikea MARKUS Silla Oficina', asin: 'B00KOCPHEC', price: 179, originalPrice: 219, image: 'https://m.media-amazon.com/images/I/61yO7LjZGnL._AC_SL1500_.jpg' },
      { name: 'Cojín Lumbar Ergonómico Memory Foam', asin: 'B07QM7JYLJ', price: 29.99, originalPrice: 44.99, image: 'https://m.media-amazon.com/images/I/71Pv8qx7VJL._AC_SL1500_.jpg' },
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
      { name: 'Kindle Oasis 8GB 7"', asin: 'B07L5GDTYY', price: 249, originalPrice: 299, image: 'https://m.media-amazon.com/images/I/61TXnm9CQ9L._AC_SL1500_.jpg', highlight: '✨ Premium' },
      { name: 'Kobo Clara 2E 6"', asin: 'B0B83YV5X2', price: 129, originalPrice: 149, image: 'https://m.media-amazon.com/images/I/71Zd1z9xShL._AC_SL1500_.jpg' },
      { name: 'Kobo Libra 2 7"', asin: 'B09H77NNZL', price: 179, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/71P5hZFGDbL._AC_SL1500_.jpg' },
      { name: 'Lámpara Lectura Clip USB', asin: 'B07XRQQGKW', price: 12.99, originalPrice: 19.99, image: 'https://m.media-amazon.com/images/I/61mIq+u1URL._AC_SL1500_.jpg' },
      { name: 'Cargador Inalámbrico Kindle', asin: 'B09TN7FFHQ', price: 29.99, originalPrice: 39.99, image: 'https://m.media-amazon.com/images/I/61fgqxD6SSL._AC_SL1500_.jpg' },
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
      { name: 'Ecobee Smart Thermostat Premium', asin: 'B09XXS41RP', price: 229, originalPrice: 279, image: 'https://m.media-amazon.com/images/I/61xS+s3k-cL._AC_SL1500_.jpg' },
      { name: 'Shelly 1 Mini Gen3 Pack 4', asin: 'B0C3JXQXHJ', price: 49.99, originalPrice: 69.99, image: 'https://m.media-amazon.com/images/I/41f0wq5eY6L._AC_SL1500_.jpg', highlight: '⚡ Relé WiFi' },
      { name: 'Aqara Sensor Puerta/Ventana 2 Pack', asin: 'B07D37VDM3', price: 24.99, originalPrice: 34.99, image: 'https://m.media-amazon.com/images/I/41RJRP59ZNL._AC_SL1500_.jpg' },
      { name: 'SwitchBot Bot Pulsador Inteligente', asin: 'B08K3C33S3', price: 29.99, originalPrice: 39.99, image: 'https://m.media-amazon.com/images/I/61YFZx7tXGL._AC_SL1500_.jpg' },
      { name: 'Eve Motion Sensor HomeKit', asin: 'B07B1Y7V8V', price: 39.99, originalPrice: 49.99, image: 'https://m.media-amazon.com/images/I/51x0+zZPfkL._AC_SL1500_.jpg' },
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
      { name: 'Brooks Ghost 15', asin: 'B0B31TQGVK', price: 119, originalPrice: 159, image: 'https://m.media-amazon.com/images/I/71aP+OHqVkL._AC_SL1500_.jpg' },
      { name: 'Adidas Ultraboost Light', asin: 'B0BRT3SQD6', price: 139, originalPrice: 189, image: 'https://m.media-amazon.com/images/I/71pVPSbU2VL._AC_SL1500_.jpg' },
      { name: 'New Balance Fresh Foam 1080v12', asin: 'B09VXQMCKG', price: 129, originalPrice: 179, image: 'https://m.media-amazon.com/images/I/61LqmJrCYfL._AC_SL1000_.jpg', highlight: '💰 Mejor calidad-precio' },
      { name: 'Hoka Clifton 9', asin: 'B0BK8VVMFY', price: 139, originalPrice: 169, image: 'https://m.media-amazon.com/images/I/71Qe44gLYGL._AC_SL1500_.jpg', highlight: '☁️ Ultra cómodas' },
      { name: 'Saucony Endorphin Speed 3', asin: 'B0B3RV3G1K', price: 159, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/71+2jOxZGqL._AC_SL1500_.jpg' },
      { name: 'On Cloud 5', asin: 'B09YK1HWFX', price: 149, originalPrice: 169, image: 'https://m.media-amazon.com/images/I/71qPVKtw5TL._AC_SL1500_.jpg' },
      { name: 'Plantillas Running Superfeet', asin: 'B00LHPDN36', price: 39.99, originalPrice: 54.99, image: 'https://m.media-amazon.com/images/I/81Ai+5OQGUL._AC_SL1500_.jpg' },
      { name: 'Calcetines Running Balega Hidden', asin: 'B00CX63I22', price: 14.99, originalPrice: 19.99, image: 'https://m.media-amazon.com/images/I/71HbpGz8HqL._AC_SL1500_.jpg' },
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
      { name: 'Samsung The Freestyle', asin: 'B09Q2BQHF2', price: 649, originalPrice: 899, image: 'https://m.media-amazon.com/images/I/71sDFU+o1GL._AC_SL1500_.jpg', highlight: '🔄 360° rotación' },
      { name: 'Optoma UHD35 4K Gaming', asin: 'B08L7CZ2P1', price: 999, originalPrice: 1299, image: 'https://m.media-amazon.com/images/I/71oZkRwPf5L._AC_SL1500_.jpg' },
      { name: 'Pantalla Proyector 120" Motorizada', asin: 'B07CGDKXFH', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/61xqvfk-NNL._AC_SL1500_.jpg' },
      { name: 'Soporte Techo Proyector Universal', asin: 'B07FQ6JV1D', price: 24.99, originalPrice: 39.99, image: 'https://m.media-amazon.com/images/I/61xL5Pc3vML._AC_SL1500_.jpg' },
      { name: 'Cable HDMI 2.1 4K/120Hz 3m', asin: 'B088TXPWZR', price: 14.99, originalPrice: 24.99, image: 'https://m.media-amazon.com/images/I/61bJe+RHR5L._AC_SL1500_.jpg' },
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
      { name: 'LEGO Technic Ferrari 488 GTE', asin: 'B0858ZTXJD', price: 169, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/91x6nOXfC4L._AC_SL1500_.jpg' },
      { name: 'LEGO Creator Expert Titanic', asin: 'B09FNXC9GB', price: 599, originalPrice: 679, image: 'https://m.media-amazon.com/images/I/81YpWMxwFSL._AC_SL1500_.jpg', highlight: '🚢 9090 piezas' },
      { name: 'LEGO Harry Potter Hogwarts', asin: 'B08G4R1C7S', price: 399, originalPrice: 469, image: 'https://m.media-amazon.com/images/I/81QCJkMFhkL._AC_SL1500_.jpg' },
      { name: 'LEGO Icons Bouquet Flores Silvestres', asin: 'B09H36D1MW', price: 49.99, originalPrice: 59.99, image: 'https://m.media-amazon.com/images/I/91DFE4qOFwL._AC_SL1500_.jpg' },
      { name: 'LEGO Speed Champions Ferrari 812', asin: 'B09H35WKVK', price: 19.99, originalPrice: 24.99, image: 'https://m.media-amazon.com/images/I/81A26QJZbpL._AC_SL1500_.jpg' },
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
      { name: 'Osprey Farpoint 40 Viaje', asin: 'B07J3XQ8PS', price: 139, originalPrice: 179, image: 'https://m.media-amazon.com/images/I/81dPK3qDYKL._AC_SL1500_.jpg' },
      { name: 'Fjällräven Kånken Classic 16L', asin: 'B007GFTXXM', price: 89, originalPrice: 110, image: 'https://m.media-amazon.com/images/I/71r8UD7M9WL._AC_SL1500_.jpg', highlight: '🎨 Icónica' },
      { name: 'Samsonite S\'Cure Spinner 75cm', asin: 'B00H2D46EY', price: 149, originalPrice: 199, image: 'https://m.media-amazon.com/images/I/71hOIQR+4xL._AC_SL1500_.jpg' },
      { name: 'Organizador Equipaje 8 Piezas', asin: 'B07FF2ZCQQ', price: 16.99, originalPrice: 24.99, image: 'https://m.media-amazon.com/images/I/81cMn+X8xFL._AC_SL1500_.jpg' },
      { name: 'Báscula Equipaje Digital 50kg', asin: 'B07L1P6C8H', price: 9.99, originalPrice: 14.99, image: 'https://m.media-amazon.com/images/I/61xYtWs8O4L._AC_SL1500_.jpg' },
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

  // Calcular ahorro total de la campaña
  let totalAhorro = 0;
  let maxDiscount = 0;
  theme.products.forEach(p => {
    if (p.originalPrice && p.originalPrice > p.price) {
      totalAhorro += (p.originalPrice - p.price);
      const discount = Math.round((1 - p.price / p.originalPrice) * 100);
      if (discount > maxDiscount) maxDiscount = discount;
    }
  });

  // Header VIRAL de la campaña
  let message = `🚨🚨🚨 **ESPECIAL DEL DÍA** 🚨🚨🚨\n\n`;
  message += `${theme.emoji}${theme.emoji} **${theme.title.toUpperCase()}** ${theme.emoji}${theme.emoji}\n\n`;
  message += `📅 *${dateStr}*\n`;
  message += `💫 ${theme.subtitle}\n\n`;
  
  // Stats impactantes
  message += `┌─────────────────────────\n`;
  message += `│ 📦 **${theme.products.length} PRODUCTOS** seleccionados\n`;
  if (maxDiscount > 0) {
    message += `│ 🔥 Descuentos hasta **-${maxDiscount}%**\n`;
  }
  if (totalAhorro > 0) {
    message += `│ 💰 Ahorro total posible: **${totalAhorro.toFixed(0)}€**\n`;
  }
  message += `└─────────────────────────\n\n`;

  // Productos con formato mejorado
  let productNum = 1;
  for (const product of theme.products) {
    const affiliateLink = `https://www.amazon.es/dp/${product.asin}?tag=${amazonTag}`;
    
    // Número y highlight
    message += `**${productNum}.** `;
    if (product.highlight) {
      message += `${product.highlight} `;
    }
    message += `\n`;

    message += `📦 ${product.name}\n`;
    
    // Mostrar precio con descuento - más visual
    if (product.originalPrice && product.originalPrice > product.price) {
      const discount = Math.round((1 - product.price / product.originalPrice) * 100);
      const ahorro = (product.originalPrice - product.price).toFixed(2);
      message += `❌ ~~${product.originalPrice.toFixed(2)}€~~ `;
      message += `✅ **${product.price.toFixed(2)}€** `;
      message += `🔥 **-${discount}%** (ahorras ${ahorro}€)\n`;
    } else {
      message += `💰 **${product.price.toFixed(2)}€**\n`;
    }
    
    message += `🛒 **COMPRAR:** ${affiliateLink}\n\n`;
    productNum++;
  }

  // Footer VIRAL
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `❓ **¿Cuál te pillas?** Cuéntanos 👇\n\n`;
  message += `🔔 **ACTIVA NOTIFICACIONES** para no perderte ningún chollo\n`;
  message += `📲 **COMPARTE** con quien lo necesite: @OfertasFlashES\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `⚠️ _Precios pueden variar. Afiliado Amazon._`;

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
    logger.info(`🎯 Tema de hoy: ${theme.emoji} ${theme.title}`);
    logger.info(`📦 Productos originales: ${theme.products.length}\n`);

    // 2. VALIDAR ENLACES antes de enviar
    logger.info('🔍 Validando enlaces de productos...');
    const validations = await validateProducts(theme.products);
    const validProducts = theme.products.filter(p => 
      validations.find(v => v.asin === p.asin && v.isValid)
    );
    
    const invalidCount = theme.products.length - validProducts.length;
    if (invalidCount > 0) {
      logger.warn(`⚠️ ${invalidCount} productos con enlaces inválidos eliminados`);
    }
    
    // Verificar que tenemos suficientes productos válidos
    if (validProducts.length < MIN_PRODUCTS_PER_CAMPAIGN) {
      throw new Error(`Solo ${validProducts.length} productos válidos. Mínimo requerido: ${MIN_PRODUCTS_PER_CAMPAIGN}`);
    }
    
    logger.success(`✅ ${validProducts.length} productos con enlaces verificados\n`);
    
    // Crear tema con solo productos válidos
    const validatedTheme: CampaignTheme = {
      ...theme,
      products: validProducts.slice(0, TARGET_PRODUCTS),
    };

    // 3. Generar mensaje con productos validados
    logger.info('✍️ Generando mensaje de campaña...');
    const message = await generateCampaignMessage(validatedTheme);

    // 4. Enviar a Telegram
    logger.info('📤 Enviando a Telegram...');
    await sendToTelegram(message, validatedTheme);

    // 5. Log de productos incluidos
    logger.info('\n📦 Productos publicados:');
    validatedTheme.products.forEach((p, i) => {
      const discount = p.originalPrice 
        ? ` (-${Math.round((1 - p.price / p.originalPrice) * 100)}%)`
        : '';
      logger.info(`   ${i + 1}. ${p.name} - ${p.price}€${discount}`);
    });

    logger.success(`\n🎉 ¡Campaña diaria completada con ${validatedTheme.products.length} productos!`);
  } catch (error) {
    logger.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
