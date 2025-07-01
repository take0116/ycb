using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MahjongTournamentManager.Server.Models
{
    public class SplatoonParticipant
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SplatoonTournamentId { get; set; }

        [ForeignKey("SplatoonTournamentId")]
        public SplatoonTournament SplatoonTournament { get; set; }

        [Required]
        public string UserId { get; set; }

        [ForeignKey("UserId")]
        public IdentityUser User { get; set; }

        public DateTime JoinedDate { get; set; }
    }
}
