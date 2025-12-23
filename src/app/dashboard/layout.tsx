import DashboardLayout from '@/components/dashboard/DashboardLayout';

export const metadata = {
  title: 'Dashboard | MazadClick',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
