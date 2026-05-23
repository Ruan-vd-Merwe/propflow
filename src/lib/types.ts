export type Profile = {
  id: string
  full_name: string
  email: string
  created_at: string
}

export type Property = {
  id: string
  owner_id: string
  name: string
  address: string
  created_at: string
}

export type Tenant = {
  id: string
  property_id: string
  full_name: string
  email: string
  phone: string
  lease_start: string
  lease_end: string
  monthly_rent: number // in cents
  created_at: string
}

export type Payment = {
  id: string
  tenant_id: string
  amount: number // in cents
  due_date: string
  paid_date: string | null
  status: 'paid' | 'late' | 'missed'
  created_at: string
}

export type RiskScore = {
  score: number
  colour: 'green' | 'amber' | 'red'
  label: string
  breakdown: {
    missed: number
    late: number
    veryLate: number
    streak: number
  }
}

export type TenantWithRisk = Tenant & {
  risk: RiskScore
  payments: Payment[]
}

export type PropertyWithTenants = Property & {
  tenants: TenantWithRisk[]
}
