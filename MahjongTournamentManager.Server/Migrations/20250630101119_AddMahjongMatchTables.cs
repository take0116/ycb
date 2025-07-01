using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MahjongTournamentManager.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddMahjongMatchTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsTableLocked",
                table: "TournamentSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "MahjongMatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TournamentSettingsId = table.Column<int>(type: "integer", nullable: false),
                    Round = table.Column<int>(type: "integer", nullable: false),
                    ByePlayerUserNames = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MahjongMatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MahjongMatches_TournamentSettings_TournamentSettingsId",
                        column: x => x.TournamentSettingsId,
                        principalTable: "TournamentSettings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MahjongMatchPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MahjongMatchId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    TableNumber = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MahjongMatchPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MahjongMatchPlayers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MahjongMatchPlayers_MahjongMatches_MahjongMatchId",
                        column: x => x.MahjongMatchId,
                        principalTable: "MahjongMatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MahjongMatches_TournamentSettingsId",
                table: "MahjongMatches",
                column: "TournamentSettingsId");

            migrationBuilder.CreateIndex(
                name: "IX_MahjongMatchPlayers_MahjongMatchId",
                table: "MahjongMatchPlayers",
                column: "MahjongMatchId");

            migrationBuilder.CreateIndex(
                name: "IX_MahjongMatchPlayers_UserId",
                table: "MahjongMatchPlayers",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MahjongMatchPlayers");

            migrationBuilder.DropTable(
                name: "MahjongMatches");

            migrationBuilder.DropColumn(
                name: "IsTableLocked",
                table: "TournamentSettings");
        }
    }
}
