using System;
using System.Collections.Generic;

namespace MahjongTournamentManager.Server.Models
{
    public class MahjongMatchDto
    {
        public int Id { get; set; }
        public int Round { get; set; }
        public string? ByePlayerUserNames { get; set; }
        public DateOnly? SchedulingStartDate { get; set; }
        public List<MahjongMatchPlayerDto> MahjongMatchPlayers { get; set; }
    }

    public class MahjongMatchPlayerDto
    {
        public int TableNumber { get; set; }
        public UserDto User { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; }
        public string UserName { get; set; }
    }
}
