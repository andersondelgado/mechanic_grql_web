/**
 * SecurityService — Autenticación gRQL.
 * Patrón adoptado de Lusiana: usa workflow_security → signin/signup.
 */
import { workflowJson } from '../api/client';
import { lambdaDecode, DB_LAMBDAS, BASE_URL } from '../api/config';
import { buildMutationRequest } from '../api/workflow.types';

export const SecurityService = {
  async signIn(username: string, password: string): Promise<any> {
    const lambdaId = lambdaDecode('workflow_security_js');
    const request = buildMutationRequest('workflow_security', 'security', 'signin', {
      body: { username, password },
    });
    return workflowJson(request, 'workflow_security_js');
  },

  async signUp(username: string, password: string, passwordConfirmation?: string): Promise<any> {
    const request = buildMutationRequest('workflow_security', 'security', 'signup', {
      body: { username, password, password_confirmation: passwordConfirmation ?? password },
    });
    return workflowJson(request, 'workflow_security_js');
  },

  setToken(token: string): void {
    localStorage.setItem('token', token);
  },

  setLambdaToken(token: string): void {
    localStorage.setItem('lambdaToken', token);
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('lambdaToken');
    localStorage.removeItem('owner');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getLambdaToken(): string | null {
    return localStorage.getItem('lambdaToken');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('lambdaToken') || !!localStorage.getItem('token');
  },
};
