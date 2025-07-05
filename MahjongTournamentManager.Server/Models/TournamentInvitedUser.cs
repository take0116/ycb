using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MahjongTournamentManager.Server.Models
{
    public class TournamentInvitedUser
    {
        [Key]
        public int Id { get; set; }

        public int TournamentSettingsId { get; set; }
        [ForeignKey("TournamentSettingsId")]
        public virtual TournamentSettings TournamentSettings { get; set; }

        public string UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual IdentityUser User { get; set; }
    }
}
