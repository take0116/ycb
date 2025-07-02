using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MahjongTournamentManager.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddScoreToMahjongMatchPlayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Score",
                table: "MahjongMatchPlayers",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Score",
                table: "MahjongMatchPlayers");
        }
    }
}
