import { supabase } from './supabase'

export interface Group {
  id: string
  name: string
  currency: string
  created_by: string
  created_at: string
}

export interface GroupMember {
  user_id: string
  full_name?: string
  email?: string
}

// 1. Recupera tutti i gruppi di cui l'utente fa parte
export async function getUserGroups(): Promise<Group[]> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('group_members')
    .select('groups(*)')
    .eq('user_id', userData.user.id)

  if (error) {
    console.error('Errore nel recupero dei gruppi:', error.message)
    return []
  }

  return data ? (data.map((item: any) => item.groups).filter(Boolean) as Group[]) : []
}

// 2. Crea un nuovo gruppo e aggiunge l'utente come membro
export async function createGroup(name: string, currency: string = 'EUR'): Promise<Group | null> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    alert('Utente non autenticato')
    return null
  }

  const userId = userData.user.id

  // Assicuriamo l'esistenza del profilo utente per evitare errori di vincolo foreign key
  await supabase.from('profiles').upsert(
    {
      id: userId,
      email: userData.user.email,
      full_name: userData.user.user_metadata?.full_name || 'Utente',
    },
    { onConflict: 'id' }
  )

  // Inserimento del gruppo
  const { data: newGroup, error: groupError } = await supabase
    .from('groups')
    .insert({
      name,
      currency,
      created_by: userId,
    })
    .select()
    .single()

  if (groupError || !newGroup) {
    console.error('Errore durante la creazione del gruppo:', groupError?.message)
    alert(`Errore durante la creazione del gruppo: ${groupError?.message}`)
    return null
  }

  // Aggiunge l'utente creatore come membro del gruppo
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: newGroup.id,
      user_id: userId,
    })

  if (memberError) {
    console.error('Errore nell\'associazione al gruppo:', memberError.message)
  }

  return newGroup
}

// 3. Recupera la lista dei membri di un determinato gruppo (con fallback sicuro)
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      profiles (
        full_name,
        email
      )
    `)
    .eq('group_id', groupId)

  if (error) {
    console.error('Errore recupero membri:', error.message)

    // Fallback: se la join fallisce, recupera comunque gli ID dei membri del gruppo
    const { data: fallbackData } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)

    return (fallbackData || []).map((item: any) => ({
      user_id: item.user_id,
      full_name: 'Partecipante',
      email: '',
    }))
  }

  return (data || []).map((item: any) => ({
    user_id: item.user_id,
    full_name: item.profiles?.full_name || 'Partecipante',
    email: item.profiles?.email || '',
  }))
}

// 4. Permette a un utente di unirsi a un gruppo tramite groupId
export async function joinGroupById(groupId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return false

  const userId = userData.user.id

  // Assicuriamo la presenza del profilo prima dell'inserimento nei membri
  await supabase.from('profiles').upsert(
    {
      id: userId,
      email: userData.user.email,
      full_name: userData.user.user_metadata?.full_name || 'Utente',
    },
    { onConflict: 'id' }
  )

  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
    })

  if (error) {
    // Se l'utente è già membro del gruppo
    if (error.code === '23505') return true
    console.error('Errore unione gruppo:', error.message)
    return false
  }

  return true
}

// 1. Aggiorna nome e valuta del gruppo
export async function updateGroup(groupId: string, name: string, currency: string): Promise<boolean> {
  const { error } = await supabase
    .from('groups')
    .update({ name, currency })
    .eq('id', groupId)

  if (error) {
    console.error('Errore aggiornamento gruppo:', error.message)
    return false
  }

  return true
}

// 2. Permette a un utente di abbandonare il gruppo
export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) {
    console.error('Errore abbandono gruppo:', error.message)
    return false
  }

  return true
}

// 3. Elimina definitivamente un gruppo e i dati correlati
export async function deleteGroup(groupId: string): Promise<boolean> {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)

  if (error) {
    console.error('Errore eliminazione gruppo:', error.message)
    return false
  }

  return true
}