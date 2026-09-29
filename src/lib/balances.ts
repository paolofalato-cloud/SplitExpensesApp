import { supabase } from './supabase'

export interface MemberBalance {
  userId: string
  fullName: string
  email: string
  paidTotal: number
  owedTotal: number
  netBalance: number // Positivo = Credito (gli devono), Negativo = Debito (deve dare)
}

export interface SettlementTransaction {
  fromUserId: string
  fromName: string
  toUserId: string
  toName: string
  amount: number
}

// 1. Calcola i saldi netti di ciascun membro del gruppo
export async function calculateGroupBalances(groupId: string): Promise<MemberBalance[]> {
  // Recupera i membri del gruppo
  const { data: membersData } = await supabase
    .from('group_members')
    .select('user_id, profiles(full_name, email)')
    .eq('group_id', groupId)

  if (!membersData) return []

  // Recupera tutte le spese del gruppo
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, paid_by')
    .eq('group_id', groupId)

  // Recupera le quote di ripartizione
  const expenseIds = (expenses || []).map((e) => e.id)
  let splits: any[] = []

  if (expenseIds.length > 0) {
    const { data: splitsData } = await supabase
      .from('expense_splits')
      .select('expense_id, user_id, amount_owed')
      .in('expense_id', expenseIds)
    splits = splitsData || []
  }

  // Calcolo dei saldi per ciascun utente
  return membersData.map((m: any) => {
    const userId = m.user_id
    const fullName = m.profiles?.full_name || 'Partecipante'
    const email = m.profiles?.email || ''

    // Totale speso di tasca propria
    const paidTotal = (expenses || [])
      .filter((e) => e.paid_by === userId)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // Totale delle proprie quote dovute
    const owedTotal = splits
      .filter((s) => s.user_id === userId)
      .reduce((sum, s) => sum + Number(s.amount_owed), 0)

    const netBalance = Number((paidTotal - owedTotal).toFixed(2))

    return {
      userId,
      fullName,
      email,
      paidTotal,
      owedTotal,
      netBalance,
    }
  })
}

// 2. Algoritmo di Semplificazione dei Debiti (riduce al minimo i trasferimenti necessari)
export function simplifyDebts(balances: MemberBalance[]): SettlementTransaction[] {
  // Dividiamo in debitori e creditori
  const debtors = balances
    .filter((b) => b.netBalance < -0.01)
    .map((b) => ({ ...b, amount: Math.abs(b.netBalance) }))
    .sort((a, b) => b.amount - a.amount)

  const creditors = balances
    .filter((b) => b.netBalance > 0.01)
    .map((b) => ({ ...b, amount: b.netBalance }))
    .sort((a, b) => b.amount - a.amount)

  const transactions: SettlementTransaction[] = []

  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]

    const amount = Math.min(debtor.amount, creditor.amount)

    if (amount > 0.01) {
      transactions.push({
        fromUserId: debtor.userId,
        fromName: debtor.fullName,
        toUserId: creditor.userId,
        toName: creditor.fullName,
        amount: Number(amount.toFixed(2)),
      })
    }

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  return transactions
}