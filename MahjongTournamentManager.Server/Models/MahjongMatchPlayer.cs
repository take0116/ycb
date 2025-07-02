using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace MahjongTournamentManager.Server.Models
{
    public class MahjongMatchPlayer
    {
        public int Id { get; set; }

        [Required]
        public int MahjongMatchId { get; set; }
        public MahjongMatch MahjongMatch { get; set; }

        [Required]
        public string UserId { get; set; }
        public IdentityUser User { get; set; }

        [Required]
        public int TableNumber { get; set; }

        public decimal? Score { get; set; }
    }
}
