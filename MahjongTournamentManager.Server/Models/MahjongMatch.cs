using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MahjongTournamentManager.Server.Models
{
    public class MahjongMatch
    {
        [Key]
        public int Id { get; set; }

        public int TournamentSettingsId { get; set; }
        [ForeignKey("TournamentSettingsId")]
        public TournamentSettings TournamentSettings { get; set; }

        public int Round { get; set; }

        public string? ByePlayerUserNames { get; set; }

        public DateOnly? SchedulingStartDate { get; set; }

        public ICollection<MahjongMatchPlayer> MahjongMatchPlayers { get; set; } = new List<MahjongMatchPlayer>();
    }
}