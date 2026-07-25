"use client";

import { useState } from 'react';
import { Plus, BookOpen, Trash2, Edit3, User, Calendar, ChevronRight } from 'lucide-react';
import type { NavProps } from '@/components/navProps';
import type { Course, CourseInput } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

export function CoursesView(props: NavProps) {
  const { courses, reloadCourses, loading } = props;
  const { user } = useAuth();
  const toast = useToast();

  async function deleteCourse(id: string) {
    if (!user) return;
    if (!confirm('Are you sure you want to remove this course?')) return;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Security: verify ownership

    if (error) toast('error', 'Delete failed');
    else {
      toast('success', 'Course removed');
      reloadCourses();
    }
  }

  if (loading) return <div className="p-8 animate-pulse bg-neutral-100 rounded-3xl" />;

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
      <PageHeader title="Class Management" subtitle="Your semester overview" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="card p-5 relative group">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">{course.name}</h3>
                <p className="text-xs text-neutral-500">{course.teacher || 'No instructor listed'}</p>
              </div>
              <button onClick={() => deleteCourse(course.id)} className="p-2 text-neutral-300 hover:text-error-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary-500">
              <Calendar className="w-3.5 h-3.5" />
              {course.schedule || 'No schedule set'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}