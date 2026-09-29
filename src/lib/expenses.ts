import { supabase } from './supabase'

export interface Expense {
  id: string
  group_id: string
  description: string
  amount: number
  paid_by: string
  category: string
  date: string
  created_at: string
}

// Salva una nuova spesa e la dividi equamente tra i membri del gruppo
export async function addExpense(
  groupId: string,
  description: string,
  amount: number,
  paidBy: string,
  memberIds: string[],
  category: string = 'general'
) {
  // 1. Inserisce la spesa principale
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      description,
      amount,
      paid_by: paidBy,
      category,
    })
    .select()
    .single()

  if (expenseError || !expense) {
    console.error('Errore creazione spesa:', expenseError?.message)
    return null
  }

  // 2. Calcola la quota per ciascun membro (divisione equa)
  const splitAmount = Number((amount / memberIds.length).toFixed(2))

  const splits = memberIds.map((userId) => ({
    expense_id: expense.id,
    user_id: userId,
    amount_owed: splitAmount,
  }))

  // 3. Inserisce le quote nella tabella expense_splits
  const { error: splitsError } = await supabase.from('expense_splits').insert(splits)

  if (splitsError) {
    console.error('Errore inserimento quote:', splitsError.message)
  }

  return expense
}

// Recupera tutte le spese di un determinato gruppo
export async function getGroupExpenses(groupId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore recupero spese:', error.message)
    return []
  }

  return data || []
}

// Registra un rimborso tra due utenti (Pagatore -> Ricevente)
export async function addSettlement(
  groupId: string,
  payerId: string,
  payeeId: string,
  amount: number
) {
  // 1. Inserisce la spesa di tipo 'settlement'
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      description: 'Rimborso Debito',
      amount,
      paid_by: payerId,
      category: 'settlement',
    })
    .select()
    .single()

  if (expenseError || !expense) {
    console.error('Errore creazione rimborso:', expenseError?.message)
    return false
  }

  // 2. L'intera quota del rimborso viene assegnata al destinatario (payeeId)
  const { error: splitError } = await supabase.from('expense_splits').insert({
    expense_id: expense.id,
    user_id: payeeId,
    amount_owed: amount,
  })

  if (splitError) {
    console.error('Errore assegnazione quota rimborso:', splitError.message)
    return false
  }

  return true
}

// Elimina una spesa e le relative quote associate (grazie al CASCADE o elimina manuale)
export async function deleteExpense(expenseId: string): Promise<boolean> {
  // 1. Elimina le quote
  await supabase.from('expense_splits').delete().eq('expense_id', expenseId)

  // 2. Elimina la spesa
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)

  if (error) {
    console.error('Errore eliminazione spesa:', error.message)
    return false
  }

  return true
}