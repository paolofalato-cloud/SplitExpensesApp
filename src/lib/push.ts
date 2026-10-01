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
    console.warn('Push notifiche non supportate da questo browser.')
    return false
  }

  try {
    // 1. Richiedi permesso browser
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Permesso notifiche negato dall\'utente:', permission)
      return false
    }

    // 2. Attendi Service Worker
    const registration = await navigator.serviceWorker.ready

    let subscription = await registration.pushManager.getSubscription()

    // Se non esiste ancora una subscription, ne creiamo una se abbiamo la VAPID key
    if (!subscription && VAPID_PUBLIC_KEY) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      })
    }

    // 3. Tenta il salvataggio su Supabase se abbiamo ottenuto la subscription
    if (subscription) {
      const { error } = await supabase.from('user_push_subscriptions').upsert(
        {
          user_id: userId,
          subscription: subscription.toJSON(),
        },
        { onConflict: 'user_id, subscription' }
      )

      if (error) {
        console.error('Errore salvataggio Supabase (proseguiamo comunque):', error)
      }
    }

    // Se il permesso è stato concesso dal browser, l'iscrizione locale è valida
    return true
  } catch (err) {
    console.error('Errore durante l\'iscrizione alle notifiche Push:', err)
    return false
  }
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      // 1. Rimuove la subscription dal browser
      await subscription.unsubscribe()
    }

    // 2. Rimuove la riga corrispondente da Supabase
    const { error } = await supabase
      .from('user_push_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Errore rimozione subscription da Supabase:', error)
    }

    return true
  } catch (err) {
    console.error('Errore durante la disattivazione delle notifiche:', err)
    return false
  }
}

export async function checkPushSubscription(userId: string | null): Promise<boolean> {
  if (!userId) return false
  
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      return false
    }

    if (Notification.permission !== 'granted') {
      return false
    }

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    return !!subscription
  } catch (err) {
    console.error('Errore nel check notifiche:', err)
    return false
  }
}