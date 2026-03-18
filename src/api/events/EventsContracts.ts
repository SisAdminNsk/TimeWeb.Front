export interface CreateEventRequest {
  startAt: string,
  endAt: string,
  title: string,
  description: string,
  memberIds: string[]
}

export interface CreateEventResponse{
    eventId: string
}

export interface SearchNotificationsRequest{
    eventId: string | null,
    type: 'NewEvent' | 'EventUpdated' | 'EventDeclined' | null,
    recipientStatus: 'NoReaction' | 'AcceptedEvent' | 'DeclinedEvent' | 'NotShow' | null
    pageSize: number,
    pageNumber: number
}

export interface SearchNotificationsResponse{
    totalCount: number,
    notifications: NotificationDto[]
}

export interface NotificationDto{
    eventId: string,
    type: 'NewEvent' | 'EventUpdated' | 'EventDeclined',
    recipientId: string,
    recipientStatus: 'NoReaction' | 'AcceptedEvent' | 'DeclinedEvent' | 'NotShow' 
    createdAt: string
}