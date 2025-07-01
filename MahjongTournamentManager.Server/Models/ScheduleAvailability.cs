using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace MahjongTournamentManager.Server.Models
{
    public class ScheduleAvailability
    {
        [Key]
        public int Id { get; set; }

        public int MahjongMatchId { get; set; }
        [ForeignKey("MahjongMatchId")]
        public MahjongMatch MahjongMatch { get; set; }

        [Required]
        public string UserId { get; set; }
        [ForeignKey("UserId")]
        public IdentityUser User { get; set; }

        // Specific date and time, now nullable
        public DateTime? DateTime { get; set; }

        // For time-only availability
        public TimeOnly? Time { get; set; }
    }
}