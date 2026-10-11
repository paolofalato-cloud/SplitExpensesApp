import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID_PUBLIC_KEY mancante nelle variabili d\'ambiente.')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return false
    }

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      })
    }

    if (!subscription) {
      return false
    }

    const subJson = subscription.toJSON()
    const payload = {
      user_id: userId,
      subscription: JSON.parse(JSON.stringify(subJson)),
    }

    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) {
      console.error('Errore salvataggio Supabase push:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Errore durante l\'iscrizione alle notifiche Push:', err)
    return false
  }
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }
    }

    const { error } = await supabase
      .from('user_push_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Errore cancellazione sottoscrizione Supabase:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Errore durante la disiscrizione push:', err)
    return false
  }
}

export async function checkPushSubscription(userId: string | null): Promise<boolean> {
  if (!userId) return false

  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      return false
    }

    // Se il permesso non è concesso a livello browser, disattivato
    if (Notification.permission !== 'granted') {
      return false
    }

    // Controlliamo se esiste la riga su Supabase
    const { data: dbSub, error } = await supabase
      .from('user_push_subscriptions')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    // Se la riga c'è su Supabase ed il permesso è concesso, l'utente è attivo!
    // Evitiamo chiamate a subscribe() automatiche all'avvio che i browser bloccano.
    if (dbSub && !error) {
      return true
    }

    return false
  } catch (err) {
    console.error('Errore nel check notifiche:', err)
    return false
  }
}