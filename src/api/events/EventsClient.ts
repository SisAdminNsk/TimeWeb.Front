import type {
  AcceptEventResponse,
    CreateEventRequest,
    CreateEventResponse,
    DeclieEventResponse,
    DetailedEventDto,
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
  },

  getEventDetails: async(authToken: string, eventId: string): Promise<DetailedEventDto> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/events/${eventId}`, {
      method: 'GET',
      headers: getHeaders(authToken)
    });
    return handleResponse<DetailedEventDto>(response);
  },

  acceptEvent: async(authToken: string, eventId: string): Promise<AcceptEventResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/events/${eventId}/accept`, {
      method: 'POST',
      headers: getHeaders(authToken)
    });
    return handleResponse<AcceptEventResponse>(response);
  },

  declineEvent: async(authToken: string, eventId: string): Promise<DeclieEventResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/events/${eventId}/decline`, {
      method: 'POST',
      headers: getHeaders(authToken)
    });
    return handleResponse<DeclieEventResponse>(response);
  }
};

function getHeaders(authToken: string | null): HeadersInit {
  return { 
      'Authorization': `Bearer ${authToken}`, 
      'Content-Type': 'application/json' 
    };
}