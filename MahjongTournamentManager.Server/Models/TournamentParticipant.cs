using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MahjongTournamentManager.Server.Models
{
    public class TournamentParticipant
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public IdentityUser User { get; set; } // Add this line for navigation property
        public int TournamentSettingsId { get; set; }
        public TournamentSettings TournamentSettings { get; set; }
        public DateTime JoinedDate { get; set; } // Renamed from JoinedAt
    }
}