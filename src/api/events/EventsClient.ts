import type {
    CreateEventRequest,
    CreateEventResponse,
    SearchNotificationsRequest,
    SearchNotificationsResponse
} from './EventsContracts';
import { config } from '../../config/env';
import { fetchWithTimeout, handleResponse } from '../HttpClient';

const apiBaseUrl = config.eventsApiUrl;

export const eventsClient = {
  createEvent: async (authToken: string, request: CreateEventRequest): Promise<CreateEventResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/events`, {
      method: 'POST',
      headers: getHeaders(authToken),
      body: JSON.stringify(request)
    });
    return handleResponse<CreateEventResponse>(response);
  },

  searchNotifications: async(authToken: string, request: SearchNotificationsRequest): Promise<SearchNotificationsResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/notifications/search`, {
      method: 'POST',
      headers: getHeaders(authToken),
      body: JSON.stringify(request)
    });
    return handleResponse<SearchNotificationsResponse>(response);
  }
};

function getHeaders(authToken: string | null): HeadersInit {
  return { 
      'Authorization': `Bearer ${authToken}`, 
      'Content-Type': 'application/json' 
    };
}