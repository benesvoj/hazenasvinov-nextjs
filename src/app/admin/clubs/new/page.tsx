'use client';

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { 
  BuildingOfficeIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewClubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    city: '',
    founded_year: '',
    logo_url: ''
  });
  
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!formData.name.trim()) {
        setError('Název klubu je povinný');
        return;
      }

      const { data, error } = await supabase
        .from('clubs')
        .insert({
          name: formData.name.trim(),
          short_name: formData.short_name.trim() || null,
          city: formData.city.trim() || null,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          logo_url: formData.logo_url.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      // Redirect to the new club's detail page
      router.push(`/admin/clubs/${data.id}`);
    } catch (error) {
      setError('Chyba při vytváření klubu');
      console.error('Error creating club:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/clubs" prefetch={true}>
              <Button variant="light" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Zpět na kluby
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">Vytvořit nový klub</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Informace o klubu</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Two-column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <Input
                    label="Název klubu *"
                    placeholder="např. Hazena Švínov"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    isRequired
                  />
                  
                  <Input
                    label="Krátký název"
                    placeholder="např. Švínov"
                    value={formData.short_name}
                    onChange={(e) => setFormData({...formData, short_name: e.target.value})}
                    description="Krátký název pro zobrazení v tabulkách a sestavách"
                  />
                  
                  <Input
                    label="Město"
                    placeholder="např. Švínov"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    description="Město, kde se klub nachází"
                  />
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  <Input
                    label="Rok založení"
                    type="number"
                    placeholder="např. 1920"
                    value={formData.founded_year}
                    onChange={(e) => setFormData({...formData, founded_year: e.target.value})}
                    description="Rok založení klubu (volitelné)"
                  />
                  
                  <Input
                    label="URL loga"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    description="URL obrázku loga klubu (volitelné)"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Link href="/admin/clubs" prefetch={true}>
                  <Button variant="flat" color="danger">
                    Zrušit
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  color="primary"
                  isLoading={loading}
                >
                  Vytvořit klub
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
