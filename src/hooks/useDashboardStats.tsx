import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalCases: number;
  openCases: number;
  inProgressCases: number;
  closedCases: number;
  highPriorityCases: number;
  assignedCases: number;
  recentActivity: number;
  monthlyNewCases: number;
}

export const useDashboardStats = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    openCases: 0,
    inProgressCases: 0,
    closedCases: 0,
    highPriorityCases: 0,
    assignedCases: 0,
    recentActivity: 0,
    monthlyNewCases: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, userProfile]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Build base query based on user role
      let casesQuery = supabase.from('cases').select('*');
      
      // Apply role-based filtering
      if (userProfile?.role === 'volunteer') {
        casesQuery = casesQuery.or(`assigned_to.eq.${user?.id},created_by.eq.${user?.id}`);
      }

      const { data: cases, error: casesError } = await casesQuery;

      if (casesError) throw casesError;

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const stats: DashboardStats = {
        totalCases: cases?.length || 0,
        openCases: cases?.filter(c => c.status === 'open').length || 0,
        inProgressCases: cases?.filter(c => c.status === 'in_progress').length || 0,
        closedCases: cases?.filter(c => c.status === 'closed').length || 0,
        highPriorityCases: cases?.filter(c => c.priority === 'high').length || 0,
        assignedCases: cases?.filter(c => c.assigned_to === user?.id).length || 0,
        recentActivity: cases?.filter(c => 
          new Date(c.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0,
        monthlyNewCases: cases?.filter(c => 
          c.created_at?.startsWith(currentMonth)
        ).length || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description: error instanceof Error ? error.message : "Failed to load dashboard statistics",
      });
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refetch: fetchStats };
};