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

export interface SearchEventsRequest{
    startAt: string,
    endAt: string,
    memberId: string | null,
    status: 'Pending' | 'Accepted' | 'Declined',
    pageSize: number,
    pageNumber: number
}

export interface SearchEventsResponse{
    
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

export interface DetailedEventInitiatorDto{
    userId: string,
    username: string
}

export interface DetailedEventMemberDto{
    userId: string,
    username: string,
    status: 'Pending' | 'Accepted' | 'Decliend',
    respondedAt: string
}

export interface DetailedEventDto{
    eventId: string,
    initiator: DetailedEventInitiatorDto,
    members: DetailedEventMemberDto[],
    title: string,
    description: string,
    startAt: string,
    endAt: string,
    createdAt: string
}

export interface AcceptEventResponse{
    eventId: string
}

export interface DeclieEventResponse{
    eventId: string
}