using System;
using System.ComponentModel.DataAnnotations;

namespace MahjongTournamentManager.Server.Models
{
    public class MahjongTournamentCreationRequest
    {
        [Required]
        public string TournamentName { get; set; }

        [Required]
        public DateOnly StartDate { get; set; }

        [Required]
        public DateOnly EndDate { get; set; }

        [Required]
        public int PlayerCount { get; set; }

        [Required]
        public string GameType { get; set; }

        [Required]
        public string ThinkTime { get; set; }

        public bool AllowFlying { get; set; }
        public bool RedDora { get; set; }
        public int StartingScore { get; set; }
        public string? Description { get; set; }
        public int Status { get; set; }
        public bool IsPrivate { get; set; }
        public string[]? InvitedUsers { get; set; }
    }
}
