using System.Collections.Generic;

namespace MahjongTournamentManager.Server.Models
{
    public class MarioKartTournamentParticipantsResponse
    {
        public string TournamentName { get; set; }
        public IEnumerable<MarioKartParticipant> Participants { get; set; }
    }
}
