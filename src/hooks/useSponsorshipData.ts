import { useState, useEffect, useCallback } from 'react';

export interface MainPartner {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  description: string;
  level: 'platinum' | 'gold';
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'expired' | 'pending';
  benefits: string[];
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessPartner {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  email?: string;
  phone?: string;
  address?: string;
  description: string;
  partnership_type: 'supplier' | 'service' | 'collaboration';
  level: 'silver' | 'bronze';
  start_date: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
  discount_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface MediaPartner {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  email?: string;
  phone?: string;
  description: string;
  media_type: 'newspaper' | 'radio' | 'tv' | 'online' | 'social' | 'other';
  coverage: 'local' | 'regional' | 'national';
  start_date: string;
  status: 'active' | 'inactive' | 'pending';
  coverage_details: string[];
  notes?: string;
  monthly_value_czk?: number;
  created_at: string;
  updated_at: string;
}

export function useSponsorshipData() {
  const [mainPartners, setMainPartners] = useState<MainPartner[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [mediaPartners, setMediaPartners] = useState<MediaPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch main partners
  const fetchMainPartners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sponsorship/main-partners');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch main partners');
      }
      
      setMainPartners(result.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching main partners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch main partners');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch business partners
  const fetchBusinessPartners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sponsorship/business-partners');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch business partners');
      }
      
      setBusinessPartners(result.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching business partners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch business partners');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch media partners
  const fetchMediaPartners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sponsorship/media-partners');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch media partners');
      }
      
      setMediaPartners(result.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching media partners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch media partners');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create main partner
  const createMainPartner = useCallback(async (partnerData: Omit<MainPartner, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/sponsorship/main-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create main partner');
      }
      
      await fetchMainPartners(); // Refresh data
      return result.data;
    } catch (err) {
      console.error('Error creating main partner:', err);
      throw err;
    }
  }, [fetchMainPartners]);

  // Create business partner
  const createBusinessPartner = useCallback(async (partnerData: Omit<BusinessPartner, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/sponsorship/business-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create business partner');
      }
      
      await fetchBusinessPartners(); // Refresh data
      return result.data;
    } catch (err) {
      console.error('Error creating business partner:', err);
      throw err;
    }
  }, [fetchBusinessPartners]);

  // Create media partner
  const createMediaPartner = useCallback(async (partnerData: Omit<MediaPartner, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/sponsorship/media-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create media partner');
      }
      
      await fetchMediaPartners(); // Refresh data
      return result.data;
    } catch (err) {
      console.error('Error creating media partner:', err);
      throw err;
    }
  }, [fetchMediaPartners]);

  // Update main partner
  const updateMainPartner = useCallback(async (id: string, partnerData: Partial<MainPartner>) => {
    try {
      const response = await fetch(`/api/sponsorship/main-partners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update main partner');
      }
      
      await fetchMainPartners(); // Refresh data
      return result.data;
    } catch (err) {
      console.error('Error updating main partner:', err);
      throw err;
    }
  }, [fetchMainPartners]);

  // Delete main partner
  const deleteMainPartner = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/sponsorship/main-partners/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete main partner');
      }
      
      await fetchMainPartners(); // Refresh data
    } catch (err) {
      console.error('Error deleting main partner:', err);
      throw err;
    }
  }, [fetchMainPartners]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMainPartners(),
          fetchBusinessPartners(),
          fetchMediaPartners(),
        ]);
      } catch (err) {
        console.error('Error fetching sponsorship data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [fetchMainPartners, fetchBusinessPartners, fetchMediaPartners]);

  return {
    // Data
    mainPartners,
    businessPartners,
    mediaPartners,
    loading,
    error,
    
    // Actions
    fetchMainPartners,
    fetchBusinessPartners,
    fetchMediaPartners,
    createMainPartner,
    createBusinessPartner,
    createMediaPartner,
    updateMainPartner,
    deleteMainPartner,
    
    // Refresh all data
    refreshAll: () => {
      fetchMainPartners();
      fetchBusinessPartners();
      fetchMediaPartners();
    },
  };
}
