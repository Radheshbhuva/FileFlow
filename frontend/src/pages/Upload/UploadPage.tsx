import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useUploadStore } from '../../stores/uploadStore';
import UploadHeader from '../../components/upload/UploadHeader';
import UploadDropzone from '../../components/upload/UploadDropzone';
import UploadQueueTable from '../../components/upload/UploadQueueTable';
import UploadProgressTracker from '../../components/upload/UploadProgressTracker';
import UploadAnalytics from '../../components/upload/UploadAnalytics';
import UploadSummary from '../../components/upload/UploadSummary';
import FailedUploadsPanel from '../../components/upload/FailedUploadsPanel';
import UploadHistory from '../../components/upload/UploadHistory';
import FileDetailsPanel from '../../components/upload/FileDetailsPanel';

export default function UploadPage() {
  const { queue, validationErrors, history } = useUploadStore();

  const hasActiveQueue = queue.length > 0;
  const hasHistory = history.length > 0;
  const hasValidationErrors = validationErrors.length > 0;

  // Show stats column if active uploads exist, or history is logged
  const showSidebar = hasActiveQueue || hasHistory || hasValidationErrors;

  return (
    <DashboardLayout pageTitle="Upload Center">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Dynamic header and dashboard control */}
        <UploadHeader />

        {/* Bento grid workspace */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          
          {/* Main transmission workspace list */}
          <div className={`${showSidebar ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            {/* Completion summary overlay banner */}
            <UploadSummary />

            {/* Ingestion warning compliance list */}
            <FailedUploadsPanel />

            {/* Ingestion dropzone drop actions */}
            <UploadDropzone />

            {/* Ingest progress bar counters */}
            <UploadProgressTracker />

            {/* Transmission queue table grid */}
            <UploadQueueTable />
          </div>

          {/* Stats, charts, and chronological history logs */}
          {showSidebar && (
            <div className="space-y-6 lg:col-span-1">
              <UploadAnalytics />
              <UploadHistory />
            </div>
          )}
        </div>

        {/* Floating specification drawer details */}
        <FileDetailsPanel />
      </div>
    </DashboardLayout>
  );
}
