using System;
using System.Collections.Generic;

namespace MahjongTournamentManager.Server.Models
{
    public class MatchDto
    {
        public int Id { get; set; }
        public int Round { get; set; }
        public string? ByePlayerUserNames { get; set; }
        public DateOnly? SchedulingStartDate { get; set; }
        public List<MatchPlayerDto> MahjongMatchPlayers { get; set; } = new List<MatchPlayerDto>();
    }

    public class MatchPlayerDto
    {
        public int TableNumber { get; set; }
        public UserDto User { get; set; } = new UserDto();
        public decimal? Score { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
    }

    public class PlayerScoreDto
    {
        public string UserId { get; set; } = string.Empty;
        public decimal Score { get; set; }
    }

    public class SaveResultDto
    {
        public int MatchId { get; set; }
        public List<PlayerScoreDto> PlayerScores { get; set; } = new List<PlayerScoreDto>();
    }
}

