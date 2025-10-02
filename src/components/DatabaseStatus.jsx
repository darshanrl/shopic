import React from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Database, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export default function DatabaseStatus() {
  const isConfigured = isSupabaseConfigured();

  if (isConfigured) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10 text-green-400 mb-4">
        <CheckCircle className="w-4 h-4" />
        <div>
          <strong>Database Connected!</strong>
          <p className="text-sm mt-1">Your app is connected to PostgreSQL via Supabase.</p>
        </div>
      </Alert>
    );
  }

  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-400 mb-4">
      <AlertCircle className="w-4 h-4" />
      <div>
        <strong>Database Setup Required</strong>
        <p className="text-sm mt-2 mb-3">
          To enable authentication and database features, you need to set up Supabase.
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-yellow-500/20 border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/30"
            onClick={() => window.open('/SETUP.md', '_blank')}
          >
            <Database className="w-4 h-4 mr-2" />
            Setup Guide
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-yellow-500/20 border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/30"
            onClick={() => window.open('https://supabase.com', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Supabase
          </Button>
        </div>
      </div>
    </Alert>
  );
}
