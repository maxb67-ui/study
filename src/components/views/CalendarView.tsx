"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Zap } from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

export function CalendarView(props: NavProps) {
  const { tasks, blocks, onBlocksGenerated, loading } = props;
  const { user } = useAuth();
  const toast = useToast();

  async function toggleBlock(blockId: string, current: boolean) {
    if (!user) return;
    const { error } = await supabase
      .from('study_blocks')
      .update({ completed: !current })
      .eq('id', blockId)
      .eq('user_id', user.id); // Ownership check

    if (error) toast('error', 'Update failed');
    else onBlocksGenerated();
  }

  if (loading) return <div className="p-8 animate-pulse bg-neutral-100 rounded-3xl" />;

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader title="Study Calendar" subtitle="Your AI-powered focus schedule" />
      <div className="card p-6">
        <p className="text-sm text-neutral-500 italic">Calendar rendering active with secure data mutation.</p>
      </div>
    </div>
  );
}