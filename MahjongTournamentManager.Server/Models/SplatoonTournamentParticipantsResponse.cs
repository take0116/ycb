using System.Collections.Generic;

namespace MahjongTournamentManager.Server.Models
{
    public class SplatoonTournamentParticipantsResponse
    {
        public string TournamentName { get; set; }
        public List<SplatoonParticipant> Participants { get; set; }
    }
}
