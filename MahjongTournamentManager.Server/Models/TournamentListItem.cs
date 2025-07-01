namespace MahjongTournamentManager.Server.Models
{
    public class TournamentListItem
    {
        public int Id { get; set; }
        public string GameTitle { get; set; }
        public string TournamentName { get; set; }
        public DateOnly StartDate { get; set; }
        public int Status { get; set; }
        public string? Description { get; set; }
        public string DetailUrl { get; set; }
    }
}
