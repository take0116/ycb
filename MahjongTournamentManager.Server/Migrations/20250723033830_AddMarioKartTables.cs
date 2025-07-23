using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MahjongTournamentManager.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddMarioKartTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MarioKartTournaments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TournamentName = table.Column<string>(type: "text", nullable: false),
                    EventDate = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    GameMode = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    MaxParticipants = table.Column<int>(type: "integer", nullable: true),
                    IsPrivate = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarioKartTournaments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarioKartParticipants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MarioKartTournamentId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Team = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarioKartParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarioKartParticipants_MarioKartTournaments_MarioKartTournam~",
                        column: x => x.MarioKartTournamentId,
                        principalTable: "MarioKartTournaments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MarioKartTournamentInvitedUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MarioKartTournamentId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarioKartTournamentInvitedUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarioKartTournamentInvitedUsers_MarioKartTournaments_MarioK~",
                        column: x => x.MarioKartTournamentId,
                        principalTable: "MarioKartTournaments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MarioKartParticipants_MarioKartTournamentId",
                table: "MarioKartParticipants",
                column: "MarioKartTournamentId");

            migrationBuilder.CreateIndex(
                name: "IX_MarioKartTournamentInvitedUsers_MarioKartTournamentId",
                table: "MarioKartTournamentInvitedUsers",
                column: "MarioKartTournamentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MarioKartParticipants");

            migrationBuilder.DropTable(
                name: "MarioKartTournamentInvitedUsers");

            migrationBuilder.DropTable(
                name: "MarioKartTournaments");
        }
    }
}
