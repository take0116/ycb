using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace MahjongTournamentManager.Server.Models
{
    public class MarioKartTournament
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

        public int Status { get; set; }
        public string? Comment { get; set; }
        public int? MaxParticipants { get; set; }
        public bool IsPrivate { get; set; }
        public virtual ICollection<MarioKartTournamentInvitedUser> InvitedUsers { get; set; } = new List<MarioKartTournamentInvitedUser>();
        public virtual ICollection<MarioKartParticipant> Participants { get; set; } = new List<MarioKartParticipant>();
    }

    public class MarioKartTournamentDto
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
        public bool IsPrivate { get; set; }
        public List<string> InvitedUserIds { get; set; } = new List<string>();
    }

    public class MarioKartTournamentInvitedUser
    {
        public int Id { get; set; }
        public int MarioKartTournamentId { get; set; }
        public string UserId { get; set; }
        public virtual MarioKartTournament Tournament { get; set; }
    }

    public class MarioKartParticipant
    {
        public int Id { get; set; }
        public int MarioKartTournamentId { get; set; }
        public string UserId { get; set; }
        public string? Team { get; set; }
        public virtual MarioKartTournament Tournament { get; set; }
        public virtual IdentityUser User { get; set; }
    }
}
