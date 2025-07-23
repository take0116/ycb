using System;

namespace MahjongTournamentManager.Server.Models
{
    public class TournamentListItem
    {
        public int Id { get; set; }
        public string GameType { get; set; }
        public string TournamentName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int Status { get; set; }
        public string? Description { get; set; }
        public int ParticipantsCount { get; set; }
    }
}
