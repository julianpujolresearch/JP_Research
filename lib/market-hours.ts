interface MarketStatus {
  isOpen: boolean
  reason: string
  currentTime: string
  nextOpenTime: string | null
  timezone: string
}

export function isMarketOpen(): MarketStatus {
  // Obtener hora actual en Argentina (UTC-3)
  const now = new Date()
  const argentinaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))

  const currentHour = argentinaTime.getHours()
  const currentMinute = argentinaTime.getMinutes()
  const currentDay = argentinaTime.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  const currentTimeString = argentinaTime.toLocaleString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })

  // Verificar si es fin de semana (sábado = 6, domingo = 0)
  if (currentDay === 0 || currentDay === 6) {
    // Calcular próximo lunes a las 11:00
    const nextMonday = new Date(argentinaTime)
    const daysUntilMonday = currentDay === 0 ? 1 : 2 // Si es domingo, 1 día; si es sábado, 2 días
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
    nextMonday.setHours(11, 0, 0, 0)

    return {
      isOpen: false,
      reason: "Fin de semana - Los mercados operan de lunes a viernes",
      currentTime: currentTimeString,
      nextOpenTime: nextMonday.toLocaleString("es-AR", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      timezone: "America/Argentina/Buenos_Aires",
    }
  }

  // Verificar horario de mercado (11:00 - 17:00)
  const marketOpenHour = 11
  const marketCloseHour = 17

  const currentTimeInMinutes = currentHour * 60 + currentMinute
  const marketOpenInMinutes = marketOpenHour * 60
  const marketCloseInMinutes = marketCloseHour * 60

  if (currentTimeInMinutes < marketOpenInMinutes) {
    // Antes de las 11:00
    const todayOpen = new Date(argentinaTime)
    todayOpen.setHours(marketOpenHour, 0, 0, 0)

    return {
      isOpen: false,
      reason: `Mercado aún no abierto - Abre a las ${marketOpenHour}:00 hs`,
      currentTime: currentTimeString,
      nextOpenTime:
        todayOpen.toLocaleString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " hs (hoy)",
      timezone: "America/Argentina/Buenos_Aires",
    }
  }

  if (currentTimeInMinutes >= marketCloseInMinutes) {
    // Después de las 17:00
    const nextDay = new Date(argentinaTime)

    // Si es viernes, el próximo día hábil es lunes
    if (currentDay === 5) {
      // Viernes
      nextDay.setDate(nextDay.getDate() + 3) // Lunes
    } else {
      nextDay.setDate(nextDay.getDate() + 1) // Mañana
    }

    nextDay.setHours(marketOpenHour, 0, 0, 0)

    return {
      isOpen: false,
      reason: `Mercado cerrado - Cierra a las ${marketCloseHour}:00 hs`,
      currentTime: currentTimeString,
      nextOpenTime: nextDay.toLocaleString("es-AR", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      timezone: "America/Argentina/Buenos_Aires",
    }
  }

  // Mercado abierto
  return {
    isOpen: true,
    reason: `Mercado abierto (${marketOpenHour}:00 - ${marketCloseHour}:00 hs)`,
    currentTime: currentTimeString,
    nextOpenTime: null,
    timezone: "America/Argentina/Buenos_Aires",
  }
}

export function logMarketStatus(module: string): MarketStatus {
  const status = isMarketOpen()
  console.log(`🕐 [${module}] Market Status:`, {
    isOpen: status.isOpen,
    reason: status.reason,
    currentTime: status.currentTime,
    nextOpenTime: status.nextOpenTime,
  })
  return status
}
