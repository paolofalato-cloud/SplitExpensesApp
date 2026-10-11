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

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return false
    }

    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription && VAPID_PUBLIC_KEY) {
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

    if (Notification.permission !== 'granted') {
      return false
    }

    const { data: dbSub, error } = await supabase
      .from('user_push_subscriptions')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
    ])

    if (!registration) {
      return !!dbSub
    }

    let subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      return true
    }

    if (dbSub && !error && VAPID_PUBLIC_KEY) {
      try {
        const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        })

        if (subscription) {
          const subJson = subscription.toJSON()
          await supabase.from('user_push_subscriptions').upsert(
            {
              user_id: userId,
              subscription: JSON.parse(JSON.stringify(subJson)),
            },
            { onConflict: 'user_id' }
          )
        }
      } catch (subErr) {
        console.error('Errore ripristino background push:', subErr)
      }
      return true
    }

    return false
  } catch (err) {
    console.error('Errore nel check notifiche:', err)
    return false
  }
}