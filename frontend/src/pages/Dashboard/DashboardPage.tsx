import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProfileStore } from '../../stores/profileStore';
import { useFilesStore } from '../../stores/fileStore';
import { useSharesStore } from '../../stores/sharesStore';
import { dashboardService } from '../../services/dashboardService';
import { fileService } from '../../services/fileService';
import { useNavigate } from 'react-router-dom';
import WelcomeBanner from '../../components/dashboard/WelcomeBanner';
import WorkspaceOverview from '../../components/dashboard/WorkspaceOverview';
import RecentUploadsWidget from '../../components/dashboard/RecentUploadsWidget';
import SharingActivityWidget from '../../components/dashboard/SharingActivityWidget';
import SmartCollectionsWidget from '../../components/dashboard/SmartCollectionsWidget';
import WorkspaceActivityFeed from '../../components/dashboard/WorkspaceActivityFeed';
import StorageIntelligenceWidget from '../../components/dashboard/StorageIntelligenceWidget';
import SecurityCenterWidget from '../../components/dashboard/SecurityCenterWidget';
import ProductivityInsightsWidget from '../../components/dashboard/ProductivityInsightsWidget';
import QuickActionsWidget from '../../components/dashboard/QuickActionsWidget';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import ErrorState from '../../components/dashboard/ErrorState';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useProfileStore((s) => s.user);

  // Query files to sync with local files database for RecentUploadsWidget completed list
  const { data: filesData } = useQuery({
    queryKey: ['files'],
    queryFn: () => fileService.getFiles(),
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  // Sync files list to local filesStore
  useEffect(() => {
    if (filesData?.data) {
      useFilesStore.setState({ files: filesData.data });
    }
  }, [filesData]);

  const { data: overview, isLoading: isOverviewLoading, isError: isOverviewError, refetch: refetchOverview } = useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: dashboardService.getWorkspaceOverview,
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  const { data: storage, isLoading: isStorageLoading, isError: isStorageError, refetch: refetchStorage } = useQuery({
    queryKey: ['dashboardStorage'],
    queryFn: dashboardService.getStorageInsights,
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  const { data: security, isLoading: isSecurityLoading, isError: isSecurityError, refetch: refetchSecurity } = useQuery({
    queryKey: ['dashboardSecurity'],
    queryFn: dashboardService.getSecurityInsights,
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  const { data: productivity, isLoading: isProductivityLoading, isError: isProductivityError, refetch: refetchProductivity } = useQuery({
    queryKey: ['dashboardProductivity'],
    queryFn: dashboardService.getProductivityInsights,
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  const loading = isOverviewLoading || isStorageLoading || isSecurityLoading || isProductivityLoading;
  const error = isOverviewError || isStorageError || isSecurityError || isProductivityError;

  const handleRetry = () => {
    void refetchOverview();
    void refetchStorage();
    void refetchSecurity();
    void refetchProductivity();
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Dashboard">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !overview || !storage || !security || !productivity) {
    return (
      <DashboardLayout pageTitle="Dashboard">
        <ErrorState message="Unable to load dashboard data." onRetry={handleRetry} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top welcome banner */}
        <WelcomeBanner
          userName={user.fullName.split(' ')[0]}
          onUpload={() => navigate('/upload')}
          onViewFiles={() => navigate('/my-files')}
        />

        {/* Premium SaaS metrics cards row */}
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="sr-only">
            Workspace overview
          </h2>
          <WorkspaceOverview data={overview} />
        </section>

        {/* Smart Collections Tiles */}
        <section aria-labelledby="collections-heading">
          <h2 id="collections-heading" className="sr-only">
            Smart collections
          </h2>
          <SmartCollectionsWidget overviewData={overview} />
        </section>

        {/* Two-Column Responsive Layout reflecting Visual Hierarchy */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Workspace Column (Left) - priority logs & safety audits */}
          <div className="lg:col-span-8 space-y-6 h-auto">
            {/* Priority 1 & 2: Security Dashboard (includes Score, Alerts, Risk Breakdown) */}
            <SecurityCenterWidget data={security} />

            {/* Priority 3: Chronological timeline actions */}
            <WorkspaceActivityFeed />

            {/* Priority 4: Active share link logs */}
            <SharingActivityWidget />

            {/* Auxiliary: Upload center tasks */}
            <RecentUploadsWidget />
          </div>

          {/* Core Analytics Sidebar (Right) - capacity tracking & shortcuts */}
          <div className="lg:col-span-4 space-y-6 h-auto">
            {/* Priority 7: Quick navigation shortcut tiles */}
            <QuickActionsWidget />

            {/* Priority 5: Storage capacity segment progress */}
            <StorageIntelligenceWidget data={storage} />

            {/* Priority 6: Accessed/Unused list insights */}
            <ProductivityInsightsWidget data={productivity} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

