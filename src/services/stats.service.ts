import { workflowJson } from '../api/client';
import type { DashboardStats } from '../types/entities';

const WORKFLOW_NAME = 'workflow_taller';
const TABLE_STATS = 'GestionTallerProd_stats';

export const StatsService = {
  getDashboardStats: async (): Promise<DashboardStats | null> => {
    try {
      const request = {
        request: {
          flows: [
            {
              name: WORKFLOW_NAME,
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
      const response = await workflowJson<any>(request);
      if (response && response[TABLE_STATS]) {
        const stepRes = response[TABLE_STATS];
        return stepRes?.custom_function?.data || stepRes?.customFunction?.data || stepRes?.data || stepRes?.custom_function || stepRes;
      }
      if (response?.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      return null;
    }
  }
};
