using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity;
using System;
using System.ComponentModel.DataAnnotations;

namespace MahjongTournamentManager.Server.Models
{
    public class SplatoonParticipant
    {
        public int Id { get; set; }

        public int SplatoonTournamentId { get; set; }
        public virtual SplatoonTournament Tournament { get; set; }

        [Required]
        public string UserId { get; set; }
        public virtual IdentityUser User { get; set; }

        public DateTime JoinedDate { get; set; }

        public string? Team { get; set; }
    }
}

