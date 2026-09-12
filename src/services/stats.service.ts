import { workflowJson } from '../api/client';
import type { DashboardStats } from '../types/entities';

const WORKFLOW_NAME = 'workflow_taller';
const TABLE_STATS = 'GestionTallerProd_stats';

interface StatsStepResponse {
  custom_function?: {
    data?: DashboardStats;
    success?: boolean;
  };
  customFunction?: {
    data?: DashboardStats;
    success?: boolean;
  };
  data?: DashboardStats;
}

interface WorkflowStatsResponse {
  [key: string]: StatsStepResponse | any;
}

export const StatsService = {
  getDashboardStats: async (): Promise<DashboardStats | null> => {
    try {
      const request = {
        request: {
          flows: [
            {
              name: WORKFLOW_NAME,
              description: WORKFLOW_NAME,
              steps: [
                {
                  name: TABLE_STATS,
                  functionName: TABLE_STATS,
                  actions: [
                    {
                      action: 'custom_function',
                      body: {}
                    }
                  ]
                }
              ]
            }
          ]
        }
      };

      const response = await workflowJson<WorkflowStatsResponse>(
        request,
        'workflow_taller_js',
        'lambda'
      );

      if (response && response[TABLE_STATS]) {
        const stepRes = response[TABLE_STATS];
        const data =
          stepRes?.custom_function?.data ||
          stepRes?.customFunction?.data ||
          stepRes?.data ||
          stepRes?.custom_function ||
          stepRes;
        return data as DashboardStats;
      }

      if (response?.data) {
        return response.data as DashboardStats;
      }

      return null;
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      return null;
    }
  }
};
