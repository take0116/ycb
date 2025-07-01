using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MahjongTournamentManager.Server.Models;

namespace MahjongTournamentManager.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<IdentityUser, IdentityRole, string>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<TournamentSettings> TournamentSettings { get; set; }
    public DbSet<SplatoonTournament> SplatoonTournaments { get; set; }
    public DbSet<SplatoonParticipant> SplatoonParticipants { get; set; }
    public DbSet<TournamentParticipant> TournamentParticipants { get; set; }
    public DbSet<MahjongMatch> MahjongMatches { get; set; }
    public DbSet<MahjongMatchPlayer> MahjongMatchPlayers { get; set; }
    public DbSet<ScheduleAvailability> ScheduleAvailabilities { get; set; }
    }
}