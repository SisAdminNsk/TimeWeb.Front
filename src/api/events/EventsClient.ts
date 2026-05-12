import type {
  AcceptEventResponse,
    CreateEventRequest,
    CreateEventResponse,
    DeclieEventResponse,
    DetailedEventDto,
    RemoveEventRequest,
    SearchEventsRequest,
    SearchEventsResponse,
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

  removeEvent: async(authToken: string, eventId: string, request: RemoveEventRequest): Promise<void> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/events/${eventId}`, {
      method: 'POST',
      headers: getHeaders(authToken),
      body: JSON.stringify(request)
    });
        
    if (response.status === 403) {
      throw new Error('У вас нет прав на удаление этого события');
    }
        
    if (response.status === 404) {
      throw new Error('Событие не найдено');
    }
        
    return handleResponse<void>(response);
    },

  searchEvents: async (authToken: string, request: SearchEventsRequest): Promise<SearchEventsResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/events/search`, {
      method: 'POST',
      headers: getHeaders(authToken),
      body: JSON.stringify(request)
    });
    return handleResponse<SearchEventsResponse>(response);
  },


  searchNotifications: async(authToken: string, request: SearchNotificationsRequest): Promise<SearchNotificationsResponse> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/notifications/search`, {
      method: 'POST',
      headers: getHeaders(authToken),
      body: JSON.stringify(request)
    });
    return handleResponse<SearchNotificationsResponse>(response);
  },

  getEventDetails: async(authToken: string, eventId: string, includeDeleted: boolean): Promise<DetailedEventDto> => {
    const params = new URLSearchParams({
      includeDeleted: includeDeleted.toString()
    });
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/events/${eventId}?${params}`, {
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
  },

  addMember: async(authToken: string, eventId: string, memberId: string): Promise<void> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/events/${eventId}/members/${memberId}`, {
      method: 'POST',
      headers: getHeaders(authToken)
    });
    return handleResponse<void>(response);
  },

  removeMember: async(authToken: string, eventId: string, memberId: string): Promise<void> => {
    const response = await fetchWithTimeout(`${apiBaseUrl}/v1/events/${eventId}/members/${memberId}`, {
      method: 'DELETE',
      headers: getHeaders(authToken)
    });
    return handleResponse<void>(response);
  }
};

function getHeaders(authToken: string | null): HeadersInit {
  return { 
      'Authorization': `Bearer ${authToken}`, 
      'Content-Type': 'application/json' 
    };
}