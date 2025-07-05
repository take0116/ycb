using System.ComponentModel.DataAnnotations;

namespace MahjongTournamentManager.Server.Models
{
    public class SplatoonTournament
    {
        public int Id { get; set; }

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

        public string? StageSelection { get; set; }
        public string? WeaponRestriction { get; set; }
        public string? GearRestriction { get; set; }
        public int Status { get; set; }
        public string? Comment { get; set; }
        public int? MaxParticipants { get; set; }
        public bool IsPrivate { get; set; }
        public virtual ICollection<SplatoonTournamentInvitedUser> InvitedUsers { get; set; } = new List<SplatoonTournamentInvitedUser>();
    }

    public class SplatoonTournamentDto
    {
        public int Id { get; set; }
        public string TournamentName { get; set; }
        public string EventDate { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        public string GameMode { get; set; }
        public string? Comment { get; set; }
        public int Status { get; set; }
        public int? MaxParticipants { get; set; }
    }
}
