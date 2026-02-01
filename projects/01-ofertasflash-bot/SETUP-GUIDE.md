# 📱 Guía Paso a Paso: Configurar Telegram + Bot

## Paso 1: Crear cuenta de Telegram (5 minutos)

### Opción A: En móvil (recomendado)
1. **Descarga Telegram:**
   - 📱 iPhone: [App Store](https://apps.apple.com/app/telegram-messenger/id686449807)
   - 📱 Android: [Google Play](https://play.google.com/store/apps/details?id=org.telegram.messenger)

2. **Abre la app** y pulsa "Empezar"

3. **Introduce tu número de teléfono** (con prefijo +34 para España)

4. **Introduce el código SMS** que recibirás

5. **Configura tu nombre** (puede ser cualquiera)

✅ ¡Ya tienes cuenta de Telegram!

### Opción B: En PC (después de tener cuenta móvil)
- Descarga: https://desktop.telegram.org/
- O usa la web: https://web.telegram.org/

---

## Paso 2: Crear tu Bot con @BotFather (3 minutos)

1. **En Telegram, busca:** `@BotFather` (el oficial tiene ✓ azul)

2. **Pulsa "Iniciar"** o escribe `/start`

3. **Escribe:** `/newbot`

4. **BotFather preguntará el nombre del bot:**
   ```
   Escribe: OfertasFlash Bot
   ```
   (Este es el nombre visible)

5. **BotFather preguntará el username:**
   ```
   Escribe: ofertasflash_tuNombre_bot
   ```
   ⚠️ DEBE terminar en `_bot` o `bot`
   ⚠️ Debe ser único (si está ocupado, prueba otro)

6. **¡Listo!** BotFather te dará un mensaje como:
   ```
   Done! Congratulations on your new bot...
   
   Use this token to access the HTTP API:
   7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

7. **COPIA ESE TOKEN** - Lo necesitarás para el `.env`

---

## Paso 3: Crear Canal de Ofertas (2 minutos)

### En móvil:
1. Pulsa el **icono de lápiz** (nuevo mensaje)
2. Selecciona **"Nuevo canal"**
3. **Nombre:** `OfertasFlash España` (o el que quieras)
4. **Descripción:** `🔥 Las mejores ofertas de Amazon, El Corte Inglés y más`
5. **Tipo:** Público
6. **Link:** `@ofertasflash_tunombre` (debe ser único)
7. Pulsa **"Crear"**

### En PC:
1. Menú hamburguesa (☰) → **"Nuevo canal"**
2. Sigue los mismos pasos

---

## Paso 4: Añadir Bot como Admin del Canal (1 minuto)

1. **Abre tu canal** que acabas de crear
2. Pulsa el **nombre del canal** (arriba) para ver info
3. Pulsa **"Administradores"**
4. Pulsa **"Añadir administrador"**
5. **Busca tu bot:** `@ofertasflash_tuNombre_bot`
6. **Permisos:** Activa al menos:
   - ✅ Publicar mensajes
   - ✅ Editar mensajes de otros
7. Pulsa **"Guardar"**

---

## Paso 5: Obtener ID del Canal

### Opción simple (canal público):
Si tu canal es `@ofertasflash_tunombre`, el ID es exactamente eso:
```
TELEGRAM_CHANNEL_ID=@ofertasflash_tunombre
```

### Opción avanzada (canal privado o ID numérico):
1. Añade el bot `@getidsbot` a tu canal temporalmente
2. Te dirá el ID numérico (ej: `-1001234567890`)
3. Usa ese número como ID
4. Puedes eliminar @getidsbot después

---

## Paso 6: Obtener API Key de Anthropic (Claude)

1. Ve a: https://console.anthropic.com/

2. **Crear cuenta:**
   - Pulsa "Sign up"
   - Usa email o Google
   - Verifica email

3. **Añadir método de pago:**
   - Settings → Billing
   - Añade tarjeta (se cobra por uso, ~$0.001 por oferta)

4. **Crear API Key:**
   - Ve a: https://console.anthropic.com/settings/keys
   - Pulsa "Create Key"
   - Nombre: `OfertasFlash Bot`
   - Copia la key (empieza por `sk-ant-...`)

⚠️ La key solo se muestra UNA VEZ, guárdala bien

---

## Paso 7: Configurar Amazon Associates (Opcional pero recomendado)

1. Ve a: https://afiliados.amazon.es/

2. **Crear cuenta:**
   - "Únete ahora gratis"
   - Usa tu cuenta de Amazon o crea una
   - Rellena datos del sitio web (pon tu canal de Telegram)

3. **Obtener tu Tag:**
   - Una vez aprobado, tu tag será algo como: `tunombre-21`
   - Lo encuentras en el dashboard arriba

---

## Paso 8: Configurar el archivo .env

Una vez tengas todos los datos, abre el archivo `.env` del proyecto y rellena:

```env
# TELEGRAM
TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_CHANNEL_ID=@tu_canal_ofertas

# ANTHROPIC (Claude AI)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx

# AMAZON ASSOCIATES
AMAZON_ES_TAG=tunombre-21

# CONFIG
MAX_DEALS=5
MIN_DISCOUNT=30
PROVIDERS=amazon_es
```

---

## Paso 9: Probar el Bot

```bash
npm run dev
```

Si todo está bien, verás:
```
🚀 Iniciando OfertasFlash Bot...
📡 Fase 1: Scraping de ofertas...
✅ Encontradas X ofertas
✍️ Fase 2: Generando copywriting...
📤 Fase 3: Enviando a Telegram...
🎉 Bot finalizado
```

Y en tu canal aparecerán las ofertas 🎉

---

## 🆘 Problemas Comunes

| Error | Solución |
|-------|----------|
| `TELEGRAM_BOT_TOKEN no configurado` | Revisa que copiaste bien el token |
| `Bot no puede enviar` | Verifica que el bot es admin del canal |
| `ANTHROPIC_API_KEY inválida` | Regenera la key en console.anthropic.com |
| `No se encontraron ofertas` | Baja MIN_DISCOUNT a 20 para pruebas |

---

## ⏱️ Tiempo total estimado: 15-20 minutos

¿Listo? ¡Empieza por el Paso 1!
