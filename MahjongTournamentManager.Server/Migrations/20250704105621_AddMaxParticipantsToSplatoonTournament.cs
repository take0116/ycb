using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MahjongTournamentManager.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddMaxParticipantsToSplatoonTournament : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxParticipants",
                table: "SplatoonTournaments",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxParticipants",
                table: "SplatoonTournaments");
        }
    }
}
