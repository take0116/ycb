using System.Collections.Generic;

namespace MahjongTournamentManager.Server.Models
{
    public class TournamentParticipantsResponse
    {
        public string TournamentName { get; set; }
        public List<TournamentParticipant> Participants { get; set; }
        public int PlayerCount { get; set; }
    }
}
