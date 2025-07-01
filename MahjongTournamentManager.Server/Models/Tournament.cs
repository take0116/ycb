using System;

namespace MahjongTournamentManager.Server.Models
{
    public class Tournament
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
