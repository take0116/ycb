using System.ComponentModel.DataAnnotations;

namespace MahjongTournamentManager.Server.Models
{
    public class SplatoonTournamentCreationRequest
    {
        [Required]
        public string TournamentName { get; set; }

        [Required]
        public DateOnly EventDate { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        [Required]
        public TimeOnly EndTime { get; set; }

        [Required]
        public string GameMode { get; set; }

        public string? Comment { get; set; }
        public int Status { get; set; }
        public int? MaxParticipants { get; set; }
        public bool IsPrivate { get; set; }
        public string[]? InvitedUsers { get; set; }
    }
}
