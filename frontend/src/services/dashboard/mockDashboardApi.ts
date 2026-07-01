import type { DashboardApiResponse, DashboardData } from '../../types/dashboard';

const MOCK_DELAY_MS = 800;

const mockDashboardData: DashboardData = {
  user: {
    id: 'usr_01',
    fullName: 'Alex Morgan',
    email: 'alex.morgan@fileflow.io',
    plan: 'Professional',
    accountCreated: 'March 12, 2025',
    lastLogin: 'Today at 9:42 AM',
    avatarInitials: 'AM'
  },
  overview: [
    {
      id: 'total-files',
      label: 'Total Files',
      value: '125 Files',
      supportingText: '12 uploaded this month',
      icon: 'files'
    },
    {
      id: 'storage-used',
      label: 'Storage Used',
      value: '2.4 GB / 5 GB',
      supportingText: '48% of plan capacity',
      icon: 'storage',
      progress: 48
    },
    {
      id: 'shared-files',
      label: 'Shared Files',
      value: '18 Active Shares',
      supportingText: '3 expiring this week',
      icon: 'shares'
    },
    {
      id: 'team-members',
      label: 'Team Members',
      value: '5 Members',
      supportingText: 'Team workspace coming soon',
      icon: 'team'
    }
  ],
  storage: {
    usedBytes: 2_580_000_000,
    totalBytes: 5_368_709_120,
    usedLabel: '2.4 GB',
    totalLabel: '5 GB',
    availableLabel: '2.6 GB',
    percentage: 48
  },
  recentUploads: [
    {
      id: 'file_01',
      fileName: 'Contract.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadDate: 'Jun 10, 2026',
      status: 'ready'
    },
    {
      id: 'file_02',
      fileName: 'MarketingPlan.pdf',
      type: 'PDF',
      size: '5.1 MB',
      uploadDate: 'Jun 9, 2026',
      status: 'ready'
    },
    {
      id: 'file_03',
      fileName: 'ProductRoadmap.xlsx',
      type: 'Spreadsheet',
      size: '890 KB',
      uploadDate: 'Jun 8, 2026',
      status: 'processing'
    },
    {
      id: 'file_04',
      fileName: 'TeamPhoto.png',
      type: 'Image',
      size: '3.2 MB',
      uploadDate: 'Jun 7, 2026',
      status: 'ready'
    },
    {
      id: 'file_05',
      fileName: 'Invoice_Q2.pdf',
      type: 'PDF',
      size: '1.1 MB',
      uploadDate: 'Jun 6, 2026',
      status: 'ready'
    }
  ],
  sharedFiles: [
    {
      id: 'share_01',
      fileName: 'MarketingPlan.pdf',
      sharedWith: 'sarah@company.com',
      shareDate: 'Jun 9, 2026',
      expiryDate: 'Jul 9, 2026',
      status: 'active',
      shareLink: 'https://fileflow.io/s/abc123'
    },
    {
      id: 'share_02',
      fileName: 'Contract.pdf',
      sharedWith: 'legal@partner.io',
      shareDate: 'Jun 5, 2026',
      expiryDate: 'Jun 20, 2026',
      status: 'active',
      shareLink: 'https://fileflow.io/s/def456'
    },
    {
      id: 'share_03',
      fileName: 'Budget2026.xlsx',
      sharedWith: 'finance@company.com',
      shareDate: 'May 28, 2026',
      expiryDate: 'Jun 1, 2026',
      status: 'expired',
      shareLink: 'https://fileflow.io/s/ghi789'
    },
    {
      id: 'share_04',
      fileName: 'DesignAssets.zip',
      sharedWith: 'design@agency.com',
      shareDate: 'Jun 3, 2026',
      expiryDate: 'Aug 3, 2026',
      status: 'active',
      shareLink: 'https://fileflow.io/s/jkl012'
    }
  ],
  activity: [
    {
      id: 'act_01',
      type: 'upload',
      description: 'Uploaded Contract.pdf',
      timestamp: '2026-06-10T14:30:00Z',
      relativeTime: '2 hours ago'
    },
    {
      id: 'act_02',
      type: 'share',
      description: 'Shared MarketingPlan.pdf with sarah@company.com',
      timestamp: '2026-06-09T11:15:00Z',
      relativeTime: 'Yesterday'
    },
    {
      id: 'act_03',
      type: 'download',
      description: 'Downloaded Invoice.pdf',
      timestamp: '2026-06-08T16:45:00Z',
      relativeTime: '2 days ago'
    },
    {
      id: 'act_04',
      type: 'profile',
      description: 'Updated profile settings',
      timestamp: '2026-06-07T09:20:00Z',
      relativeTime: '3 days ago'
    },
    {
      id: 'act_05',
      type: 'revoke',
      description: 'Revoked access to Budget2026.xlsx',
      timestamp: '2026-06-06T13:00:00Z',
      relativeTime: '4 days ago'
    }
  ]
};

let simulateError = false;

export function setSimulateDashboardError(shouldError: boolean): void {
  simulateError = shouldError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Mock dashboard API — structured for future AWS Cognito / API Gateway integration.
 */
export async function fetchDashboardData(): Promise<DashboardApiResponse> {
  await delay(MOCK_DELAY_MS);

  if (simulateError) {
    return {
      data: null,
      error: 'Unable to load dashboard data. Please check your connection and try again.'
    };
  }

  return {
    data: mockDashboardData,
    error: null
  };
}
