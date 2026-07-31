import { School } from '../../types';

export interface SchoolWithStats extends School {
  student_count: number;
  user_count: number;
  revenue: number;
  trial_days_left: number;
}

export interface GlobalStats {
  total_schools: number;
  active_schools: number;
  trial_schools: number;
  suspended_schools: number;
  expired_trials: number;
  total_students: number;
  total_users: number;
  total_revenue: number;
  price_per_student: number;
  total_parents?: number;
}

export interface CreatorWithStats {
  id: string;
  nom: string;
  telephone: string;
  created_at: string;
  linked_schools_count: number;
  linked_schools: Array<{
    id: string;
    name: string;
    slug: string;
    total_students: number;
    active_students: number;
    revenue_generated: number;
    creator_commission: number;
  }>;
  total_students: number;
  total_active_students: number;
  total_revenue_generated: number;
  total_commission: number;
}
