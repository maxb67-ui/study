# AI Rules & Development Guidelines

## Tech Stack Overview
- **React 18 & TypeScript**: Core frontend framework for building type-safe, interactive UI components.
- **Vite**: Modern build tool and development server with fast module replacement.
- **Tailwind CSS**: Utility-first CSS framework configured with dark mode support and custom design tokens.
- **Supabase JS (`@supabase/supabase-js`)**: Backend-as-a-Service integration for user authentication, PostgreSQL database operations, and state persistence.
- **Lucide React (`lucide-react`)**: Icon library providing consistent vector icons throughout the UI.
- **Custom AI Scheduler Engine (`src/lib/scheduler.ts`)**: Client-side algorithmic engine for generating study schedules, calculating streaks, and recommending study insights.
- **Timezone-Safe Date Utility System (`src/lib/dates.ts`)**: Helper utilities preventing UTC/local timezone date shifting bugs.
- **Toast Notification Provider (`src/components/Toast.tsx`)**: Global notification system for feedback.

## Library & Architectural Rules

1. **Styling & Components**
   - Use Tailwind CSS classes for layout, spacing, typography, and dark mode (`dark:...`).
   - Use custom reusable component utility classes (`card`, `btn-primary`, `btn-secondary`, `input`, `label`) defined in `src/index.css`.
   - Do not write raw CSS files or inline style objects unless calculating dynamic SVG/progress rings.

2. **Icons**
   - Always import vector icons from `lucide-react`.

3. **Authentication & Profile Management**
   - Access user session and profile data via the `useAuth()` hook from `src/lib/auth.tsx`.
   - Never handle raw Supabase auth tokens directly in component state.

4. **Database Access**
   - All database calls should go through the `supabase` client instance imported from `src/lib/supabase.ts`.

5. **Date & Time Operations**
   - Do not use `toISOString().split('T')[0]` directly on dates as it causes timezone offset bugs.
   - Always use `localDateISO()` and `localDateTimeISO()` from `src/lib/dates.ts`.

6. **Scheduling Algorithms**
   - Keep scheduling and analytical business logic in `src/lib/scheduler.ts`. Components should remain focused on rendering and user interaction.

7. **User Notifications**
   - Use `useToast()` to display feedback for async actions (saving, updating, errors, schedule generation).