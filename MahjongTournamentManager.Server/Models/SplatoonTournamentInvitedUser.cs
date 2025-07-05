using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MahjongTournamentManager.Server.Models
{
    public class SplatoonTournamentInvitedUser
    {
        [Key]
        public int Id { get; set; }

        public int SplatoonTournamentId { get; set; }
        [ForeignKey("SplatoonTournamentId")]
        public virtual SplatoonTournament SplatoonTournament { get; set; }

        public string UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual IdentityUser User { get; set; }
    }
}
