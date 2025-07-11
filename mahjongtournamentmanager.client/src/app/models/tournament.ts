// For list view
export interface TournamentListItem {
  id: number;
  gameTitle: string;
  tournamentName: string;
  startDate: Date;
  status: number;
  description: string;
  detailUrl: string;
  participantsCount: number;
}

// For detail/edit view
export interface Tournament {
    id: number;
    tournamentName: string;
    startDate: Date;
    endDate?: Date;
    playerCount: number;
    gameType: string;
    thinkTime: string;
    allowFlying: boolean;
    redDora: boolean;
    startingScore: number;
    status: number;
    description?: string;
}

